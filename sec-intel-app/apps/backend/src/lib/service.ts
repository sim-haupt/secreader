import {
  DEFAULT_ANALYSIS_FORMS,
  DEFAULT_FILING_LIMIT,
  isValidTicker,
  normalizeTickerInput,
  type AnalyzeResponse,
  type AnalysisEvent,
  type CompanyProfile,
  type FinancialMetric,
  type FinancialSnapshot,
  type FilingRecord,
  type SplitEvent
} from "@sec-intel-app/shared";

import { TtlCache } from "./cache.js";
import { buildNoneFoundEvent, detectEventsFromFiling } from "./detector.js";
import { AppError } from "./http.js";
import { OpenAiExtractor } from "./openaiExtractor.js";
import {
  findCompanyByTicker,
  findFilingDocument,
  findRecentFilings,
  replaceEventsForFiling,
  upsertCompany,
  upsertFilingDocument,
  upsertFilings,
  type StoredCompany,
  type StoredFiling
} from "./repository.js";
import { SecClient, type CompanyFactEntry, type CompanyFactsResponse } from "./secClient.js";

function hoursAgo(hours: number): number {
  return Date.now() - hours * 60 * 60 * 1000;
}

function mapCompanyProfile(company: StoredCompany): CompanyProfile {
  return {
    ticker: company.ticker,
    cik: company.cik,
    companyName: company.companyName,
    sic: company.sic,
    fiscalYearEnd: company.fiscalYearEnd
  };
}

function mapFilingRecord(filing: StoredFiling): FilingRecord {
  return {
    accessionNumber: filing.accessionNumber,
    filingDate: filing.filingDate,
    reportDate: filing.reportDate,
    form: filing.form,
    primaryDocument: filing.primaryDocument,
    description: filing.description,
    secUrl: filing.secUrl
  };
}

function parseCreatedAtIso(createdAt: string): number {
  return new Date(createdAt).getTime();
}

function shouldRefreshFilingsCache(filings: StoredFiling[], requestedLimit: number): boolean {
  if (!filings.length) {
    return true;
  }

  if (filings.length < Math.min(requestedLimit, 5)) {
    return true;
  }

  return parseCreatedAtIso(filings[0]!.createdAt) < hoursAgo(6);
}

function isRelevantForAnalysis(filing: FilingRecord): boolean {
  if (DEFAULT_ANALYSIS_FORMS.includes(filing.form as (typeof DEFAULT_ANALYSIS_FORMS)[number])) {
    return true;
  }

  return /offering|registration|prospectus|repurchase|warrant|notes|13d|13g|beneficial ownership|insider/i.test(
    `${filing.form} ${filing.description}`
  );
}

function emptyMetric(label: string): FinancialMetric {
  return {
    label,
    value: "not found",
    asOf: "not found"
  };
}

function formatNumericValue(value: number, kind: "currency" | "shares"): string {
  if (!Number.isFinite(value)) {
    return "not found";
  }

  if (kind === "currency") {
    if (Math.abs(value) >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }

    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }

    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }

  if (Math.abs(value) >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }

  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }

  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function compareFactEntries(a: CompanyFactEntry, b: CompanyFactEntry): number {
  const aDate = new Date(a.filed ?? a.end ?? 0).getTime();
  const bDate = new Date(b.filed ?? b.end ?? 0).getTime();
  return bDate - aDate;
}

function findLatestFactEntry(
  facts: CompanyFactsResponse,
  namespace: string,
  conceptNames: string[],
  preferredUnits: string[]
): CompanyFactEntry | null {
  const scopedFacts = facts.facts[namespace];
  if (!scopedFacts) {
    return null;
  }

  for (const conceptName of conceptNames) {
    const concept = scopedFacts[conceptName];
    if (!concept) {
      continue;
    }

    for (const unit of preferredUnits) {
      const entries = concept.units[unit];
      if (!entries?.length) {
        continue;
      }

      const filtered = entries
        .filter((entry) => typeof entry.val === "number")
        .filter((entry) => !entry.frame)
        .filter((entry) => !entry.form || /^10-[QK]$|^10-K\/A$|^10-Q\/A$|^8-K$/i.test(entry.form))
        .sort(compareFactEntries);

      if (filtered[0]) {
        return filtered[0];
      }
    }
  }

  return null;
}

function metricFromFact(
  label: string,
  entry: CompanyFactEntry | null,
  kind: "currency" | "shares"
): FinancialMetric {
  if (!entry || typeof entry.val !== "number") {
    return emptyMetric(label);
  }

  return {
    label,
    value: formatNumericValue(entry.val, kind),
    asOf: entry.end ?? entry.filed ?? "not found"
  };
}

function buildFinancialSnapshot(facts: CompanyFactsResponse | null): FinancialSnapshot {
  if (!facts) {
    return {
      revenue: emptyMetric("Latest revenue"),
      netIncome: emptyMetric("Latest net income"),
      cash: emptyMetric("Cash"),
      totalDebt: emptyMetric("Total debt"),
      publicFloat: emptyMetric("Public float"),
      sharesOutstanding: emptyMetric("Shares outstanding")
    };
  }

  const revenueEntry = findLatestFactEntry(facts, "us-gaap", [
    "Revenues",
    "RevenueFromContractWithCustomerExcludingAssessedTax",
    "SalesRevenueNet"
  ], ["USD"]);
  const netIncomeEntry = findLatestFactEntry(facts, "us-gaap", [
    "NetIncomeLoss"
  ], ["USD"]);
  const cashEntry = findLatestFactEntry(facts, "us-gaap", [
    "CashAndCashEquivalentsAtCarryingValue"
  ], ["USD"]);
  const debtEntry =
    findLatestFactEntry(facts, "us-gaap", [
      "LongTermDebtAndCapitalLeaseObligations",
      "LongTermDebtNoncurrent",
      "LongTermDebt",
      "DebtInstrumentCarryingAmount"
    ], ["USD"]) ??
    findLatestFactEntry(facts, "us-gaap", ["Liabilities"], ["USD"]);
  const publicFloatEntry = findLatestFactEntry(facts, "dei", [
    "EntityPublicFloat"
  ], ["USD"]);
  const sharesOutstandingEntry = findLatestFactEntry(facts, "dei", [
    "EntityCommonStockSharesOutstanding"
  ], ["shares"]);

  return {
    revenue: metricFromFact("Latest revenue", revenueEntry, "currency"),
    netIncome: metricFromFact("Latest net income", netIncomeEntry, "currency"),
    cash: metricFromFact("Cash", cashEntry, "currency"),
    totalDebt: metricFromFact("Total debt", debtEntry, "currency"),
    publicFloat: metricFromFact("Public float", publicFloatEntry, "currency"),
    sharesOutstanding: metricFromFact("Shares outstanding", sharesOutstandingEntry, "shares")
  };
}

function isRelevantForSplitHistory(filing: FilingRecord): boolean {
  return /^(8-K|10-Q|10-K|20-F|DEF 14A|PRE 14A|S-1|S-3|F-1|F-3)$/i.test(filing.form);
}

function extractSplitHistory(
  filing: FilingRecord,
  rawText: string
): SplitEvent[] {
  const lower = rawText.toLowerCase();
  const patterns = [
    {
      splitType: "reverse_split" as const,
      label: "Reverse stock split",
      phrases: ["reverse stock split", "reverse split", "1-for-"]
    },
    {
      splitType: "split" as const,
      label: "Stock split",
      phrases: ["stock split", "forward stock split", "two-for-one split", "three-for-two split"]
    }
  ];

  const found: SplitEvent[] = [];

  for (const pattern of patterns) {
    const matchedPhrase = pattern.phrases.find((phrase) => lower.includes(phrase));
    if (!matchedPhrase) {
      continue;
    }

    const index = lower.indexOf(matchedPhrase);
    const snippet = rawText
      .slice(Math.max(0, index - 220), Math.min(rawText.length, index + matchedPhrase.length + 260))
      .replace(/\s+/g, " ")
      .trim();

    const ratioMatch =
      snippet.match(/\b(\d+(?:\.\d+)?\s*-\s*for\s*-\s*\d+(?:\.\d+)?)\b/i) ??
      snippet.match(/\b(\d+(?:\.\d+)?\s*for\s*\d+(?:\.\d+)?)\b/i) ??
      snippet.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)-for-(one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
    const effectiveDateMatch =
      snippet.match(/\beffective(?: as of| on)?\s+([A-Z][a-z]+ \d{1,2}, \d{4})/i) ??
      snippet.match(/\bon\s+([A-Z][a-z]+ \d{1,2}, \d{4})/i);

    found.push({
      title: pattern.label,
      splitType: pattern.splitType,
      ratio: ratioMatch?.[1]?.replace(/\s*-\s*/g, "-") ?? "not found",
      effectiveDate: effectiveDateMatch?.[1] ?? filing.reportDate ?? filing.filingDate,
      filingDate: filing.filingDate,
      form: filing.form,
      sourceUrl: filing.secUrl,
      sourceSnippet: snippet
    });
  }

  return found;
}

export class SecIntelService {
  private readonly secClient = new SecClient();
  private readonly openAiExtractor = new OpenAiExtractor();
  private readonly companyCache = new TtlCache<string, CompanyProfile>(1000 * 60 * 60 * 6);
  private readonly filingsCache = new TtlCache<string, FilingRecord[]>(1000 * 60 * 15);

  async resolveCompany(
    ticker: string,
    refresh = false
  ): Promise<StoredCompany> {
    const normalizedTicker = normalizeTickerInput(ticker);
    if (!isValidTicker(normalizedTicker)) {
      throw new AppError(400, "Ticker must contain only letters, periods, or dashes.");
    }

    const cachedCompany = !refresh ? this.companyCache.get(normalizedTicker) : null;
    if (cachedCompany) {
      const stored = await findCompanyByTicker(cachedCompany.ticker);
      if (stored) {
        return stored;
      }
    }

    const storedCompany = !refresh ? await findCompanyByTicker(normalizedTicker) : null;
    if (storedCompany && storedCompany.sic && storedCompany.fiscalYearEnd) {
      this.companyCache.set(normalizedTicker, mapCompanyProfile(storedCompany));
      return storedCompany;
    }

    const resolved = await this.secClient.resolveTicker(normalizedTicker);
    const submissions = await this.secClient.getCompanySubmissions(resolved.cik);

    const upserted = await upsertCompany({
      ticker: normalizedTicker,
      cik: resolved.cik,
      companyName: submissions.name || resolved.companyName,
      sic: submissions.sic ? String(submissions.sic) : null,
      fiscalYearEnd: submissions.fiscalYearEnd ?? null
    });

    this.companyCache.set(normalizedTicker, mapCompanyProfile(upserted));
    return upserted;
  }

  async getCompany(ticker: string, refresh = false): Promise<CompanyProfile> {
    const company = await this.resolveCompany(ticker, refresh);
    return mapCompanyProfile(company);
  }

  async getFilings(
    ticker: string,
    limit = DEFAULT_FILING_LIMIT,
    forms?: string[],
    refresh = false
  ): Promise<{ cik: string; filings: FilingRecord[]; ticker: string }> {
    const company = await this.resolveCompany(ticker, refresh);
    const cacheKey = `${company.ticker}:${limit}:${forms?.join(",") ?? "*"}`;

    if (!refresh) {
      const memoryCached = this.filingsCache.get(cacheKey);
      if (memoryCached) {
        return { ticker: company.ticker, cik: company.cik, filings: memoryCached };
      }
    }

    const storedFilings = !refresh ? await findRecentFilings(company.id, limit, forms) : [];

    if (!refresh && !shouldRefreshFilingsCache(storedFilings, limit)) {
      const filings = storedFilings.map(mapFilingRecord);
      this.filingsCache.set(cacheKey, filings);
      return { ticker: company.ticker, cik: company.cik, filings };
    }

    const fetchedFilings = await this.secClient.getRecentFilings(company.cik, limit, forms);
    await upsertFilings(company.id, fetchedFilings);
    const refreshedFilings = await findRecentFilings(company.id, limit, forms);
    const filings = refreshedFilings.map(mapFilingRecord);

    this.filingsCache.set(cacheKey, filings);
    return { ticker: company.ticker, cik: company.cik, filings };
  }

  async analyzeTicker(input: {
    ticker: string;
    limit?: number;
    refresh?: boolean;
  }): Promise<AnalyzeResponse> {
    const limit = input.limit ?? DEFAULT_FILING_LIMIT;
    const company = await this.resolveCompany(input.ticker, input.refresh ?? false);
    const analysisForms = [...DEFAULT_ANALYSIS_FORMS];
    const recentFilingsResponse = await this.getFilings(
      company.ticker,
      limit,
      analysisForms,
      input.refresh ?? false
    );
    const companyFacts = await this.secClient.getCompanyFacts(company.cik).catch(() => null);
    const relevantFilings = recentFilingsResponse.filings.filter(isRelevantForAnalysis);
    const splitCandidateResponse = await this.getFilings(
      company.ticker,
      80,
      ["8-K", "10-Q", "10-K", "20-F", "DEF 14A", "PRE 14A", "S-1", "S-3", "F-1", "F-3"],
      input.refresh ?? false
    );
    const storedFilings = await findRecentFilings(company.id, limit, analysisForms);
    const splitStoredFilings = await findRecentFilings(
      company.id,
      80,
      ["8-K", "10-Q", "10-K", "20-F", "DEF 14A", "PRE 14A", "S-1", "S-3", "F-1", "F-3"]
    );
    const filingIndex = new Map(storedFilings.map((filing) => [filing.accessionNumber, filing]));
    const splitFilingIndex = new Map(splitStoredFilings.map((filing) => [filing.accessionNumber, filing]));
    const allEvents: AnalysisEvent[] = [];
    const splitHistory: SplitEvent[] = [];

    for (const filing of relevantFilings) {
      const storedFiling = filingIndex.get(filing.accessionNumber);
      if (!storedFiling) {
        continue;
      }

      const cachedDocument = !input.refresh ? await findFilingDocument(storedFiling.id) : null;
      let filingText: { rawText: string; rawBody?: string } | null = cachedDocument
        ? { rawText: cachedDocument.rawText }
        : null;

      if (!filingText) {
        const document = await this.secClient.getFilingText(filing.secUrl);
        await upsertFilingDocument({
          filingId: storedFiling.id,
          sourceUrl: document.sourceUrl,
          rawText: document.text,
          rawTextHash: document.hash
        });
        filingText = {
          rawText: document.text,
          rawBody: document.rawBody
        };
      }

      const detectedEvents = detectEventsFromFiling(filing, filingText.rawText, filingText.rawBody);
      const refinedEvents: AnalysisEvent[] = [];

      for (const event of detectedEvents) {
        if (this.openAiExtractor.enabled) {
          refinedEvents.push(await this.openAiExtractor.refineEvent(event));
        } else {
          refinedEvents.push(event);
        }
      }

      await replaceEventsForFiling(storedFiling.id, refinedEvents);
      allEvents.push(...refinedEvents);
    }

    for (const filing of splitCandidateResponse.filings.filter(isRelevantForSplitHistory)) {
      const storedFiling = splitFilingIndex.get(filing.accessionNumber);
      if (!storedFiling) {
        continue;
      }

      const cachedDocument = !input.refresh ? await findFilingDocument(storedFiling.id) : null;
      let filingText: { rawText: string } | null = cachedDocument
        ? { rawText: cachedDocument.rawText }
        : null;

      if (!filingText) {
        const document = await this.secClient.getFilingText(filing.secUrl);
        await upsertFilingDocument({
          filingId: storedFiling.id,
          sourceUrl: document.sourceUrl,
          rawText: document.text,
          rawTextHash: document.hash
        });
        filingText = { rawText: document.text };
      }

      splitHistory.push(...extractSplitHistory(filing, filingText.rawText));
    }

    const uniqueSplitHistory = splitHistory
      .filter((event, index, all) => all.findIndex((candidate) =>
        candidate.filingDate === event.filingDate &&
        candidate.splitType === event.splitType &&
        candidate.ratio === event.ratio
      ) === index)
      .sort((a, b) => new Date(b.filingDate).getTime() - new Date(a.filingDate).getTime())
      .slice(0, 8);

    return {
      ticker: company.ticker,
      companyName: company.companyName,
      cik: company.cik,
      analyzedAt: new Date().toISOString(),
      events: allEvents.length ? allEvents : [buildNoneFoundEvent(recentFilingsResponse.filings[0] ?? null)],
      recentFilings: recentFilingsResponse.filings,
      financialSnapshot: buildFinancialSnapshot(companyFacts),
      splitHistory: uniqueSplitHistory
    };
  }
}
