import { createHash } from "node:crypto";

import { htmlToText } from "html-to-text";

import {
  buildSecFilingUrl,
  formatCik,
  normalizeTickerInput,
  stripAccessionDashes,
  type FilingRecord
} from "@sec-intel-app/shared";

import { env } from "../config/env.js";
import { TtlCache } from "./cache.js";
import { AppError } from "./http.js";

interface TickerEntry {
  ticker: string;
  title: string;
  cik_str: number;
}

interface SubmissionsResponse {
  name: string;
  sic?: string | number;
  fiscalYearEnd?: string;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: Array<string | null>;
      form: string[];
      primaryDocument: string[];
      primaryDocDescription?: Array<string | null>;
    };
  };
}

interface FilingTextResponse {
  hash: string;
  sourceUrl: string;
  text: string;
  rawBody: string;
}

export interface CompanyFactEntry {
  end?: string;
  filed?: string;
  fy?: number;
  fp?: string;
  form?: string;
  frame?: string;
  val?: number | string;
}

export interface CompanyFactConcept {
  units: Record<string, CompanyFactEntry[]>;
}

export interface CompanyFactsResponse {
  facts: Record<string, Record<string, CompanyFactConcept>>;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeWhitespace(input: string): string {
  return input.replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function nullableText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

class SecRequestScheduler {
  private queue = Promise.resolve();
  private lastRunAt = 0;

  constructor(private readonly minIntervalMs: number) {}

  schedule<T>(work: () => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => {
      const waitMs = Math.max(0, this.minIntervalMs - (Date.now() - this.lastRunAt));
      if (waitMs > 0) {
        await sleep(waitMs);
      }

      this.lastRunAt = Date.now();
      return work();
    });

    this.queue = run.then(
      () => undefined,
      () => undefined
    );

    return run;
  }
}

export class SecClient {
  private readonly tickerCache = new TtlCache<string, Map<string, TickerEntry>>(1000 * 60 * 60 * 12);
  private readonly requestScheduler = new SecRequestScheduler(350);

  private async fetchJson<T>(url: string): Promise<T> {
    return this.requestScheduler.schedule(async () => {
      const response = await fetch(url, {
        headers: {
          "User-Agent": env.SEC_USER_AGENT,
          "Accept-Encoding": "gzip, deflate",
          Accept: "application/json,text/plain,*/*"
        },
        signal: AbortSignal.timeout(12_000)
      });

      if (!response.ok) {
        throw new AppError(response.status, `SEC request failed for ${url}.`);
      }

      return (await response.json()) as T;
    });
  }

  private async fetchText(url: string): Promise<string> {
    return this.requestScheduler.schedule(async () => {
      const response = await fetch(url, {
        headers: {
          "User-Agent": env.SEC_USER_AGENT,
          "Accept-Encoding": "gzip, deflate",
          Accept: "text/html,text/plain,application/xml;q=0.9,*/*;q=0.8"
        },
        signal: AbortSignal.timeout(12_000)
      });

      if (!response.ok) {
        throw new AppError(response.status, `SEC document request failed for ${url}.`);
      }

      return response.text();
    });
  }

  async getTickerMap(): Promise<Map<string, TickerEntry>> {
    const cached = this.tickerCache.get("tickers");
    if (cached) {
      return cached;
    }

    const response = await this.fetchJson<Record<string, TickerEntry>>(
      "https://www.sec.gov/files/company_tickers.json"
    );

    const entries = Object.values(response);
    const mapped = new Map(entries.map((entry) => [normalizeTickerInput(entry.ticker), entry]));
    this.tickerCache.set("tickers", mapped);

    return mapped;
  }

  async resolveTicker(
    ticker: string
  ): Promise<{ cik: string; companyName: string; ticker: string }> {
    const mapped = await this.getTickerMap();
    const normalizedTicker = normalizeTickerInput(ticker);
    const entry = mapped.get(normalizedTicker);

    if (!entry) {
      throw new AppError(404, `Ticker ${normalizedTicker} was not found in SEC ticker data.`);
    }

    return {
      ticker: normalizedTicker,
      cik: formatCik(entry.cik_str),
      companyName: entry.title
    };
  }

  async getCompanySubmissions(cik: string): Promise<SubmissionsResponse> {
    return this.fetchJson<SubmissionsResponse>(
      `https://data.sec.gov/submissions/CIK${formatCik(cik)}.json`
    );
  }

  async getRecentFilings(
    cik: string,
    limit: number,
    forms?: string[]
  ): Promise<FilingRecord[]> {
    const submissions = await this.getCompanySubmissions(cik);
    const recent = submissions.filings.recent;
    const filteredForms = forms?.length ? new Set(forms) : null;
    const filings: FilingRecord[] = [];

    for (let index = 0; index < recent.accessionNumber.length; index += 1) {
      const form = recent.form[index];
      const accessionNumber = recent.accessionNumber[index];
      const filingDate = recent.filingDate[index];
      const primaryDocument = recent.primaryDocument[index];

      if (!form || !accessionNumber || !filingDate || !primaryDocument) {
        continue;
      }

      if (filteredForms && !filteredForms.has(form)) {
        continue;
      }

      // EDGAR archive URLs are deterministic once we know CIK, accession number, and the primary document.
      const secUrl = buildSecFilingUrl(cik, accessionNumber, primaryDocument);

      filings.push({
        accessionNumber,
        filingDate,
        reportDate: nullableText(recent.reportDate[index]),
        form,
        primaryDocument,
        description: recent.primaryDocDescription?.[index] ?? "",
        secUrl
      });

      if (filings.length >= limit) {
        break;
      }
    }

    return filings;
  }

  async getCompanyFacts(cik: string): Promise<CompanyFactsResponse> {
    return this.fetchJson<CompanyFactsResponse>(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${formatCik(cik)}.json`
    );
  }

  async getFilingText(sourceUrl: string): Promise<FilingTextResponse> {
    // The SEC exposes filing bodies directly at archive URLs; we normalize HTML into plain text
    // so downstream extraction works on a predictable text representation.
    const rawBody = await this.fetchText(sourceUrl);
    const lowerUrl = sourceUrl.toLowerCase();
    const isMarkupDocument =
      lowerUrl.endsWith(".htm") ||
      lowerUrl.endsWith(".html") ||
      lowerUrl.endsWith(".xml") ||
      rawBody.includes("<html");

    const text = normalizeWhitespace(
      isMarkupDocument
        ? htmlToText(rawBody, {
            selectors: [
              { selector: "a", options: { hideLinkHrefIfSameAsText: true } },
              { selector: "table", format: "dataTable" }
            ],
            wordwrap: false
          })
        : rawBody
    );

    return {
      text,
      rawBody,
      sourceUrl,
      hash: createHash("sha256").update(text).digest("hex")
    };
  }

  buildArchiveDocumentUrl(
    cik: string,
    accessionNumber: string,
    primaryDocument: string
  ): string {
    const normalizedCik = formatCik(cik).replace(/^0+/, "");
    const accessionWithoutDashes = stripAccessionDashes(accessionNumber);
    return `https://www.sec.gov/Archives/edgar/data/${normalizedCik}/${accessionWithoutDashes}/${primaryDocument}`;
  }
}
