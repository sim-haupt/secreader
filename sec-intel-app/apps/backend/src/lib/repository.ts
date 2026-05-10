import type { PoolClient } from "pg";

import type {
  AnalysisEvent,
  CompanyProfile,
  FilingRecord
} from "@sec-intel-app/shared";

import { withTransaction, query } from "./database.js";

export interface StoredCompany extends CompanyProfile {
  id: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredFiling extends FilingRecord {
  id: number;
  companyId: number;
  rawTextHash: string | null;
  createdAt: string;
}

export interface StoredFilingDocument {
  filingId: number;
  sourceUrl: string;
  rawText: string;
  rawTextHash: string;
  fetchedAt: string;
}

interface CompanyRow {
  id: string;
  ticker: string;
  cik: string;
  company_name: string;
  sic: string | null;
  fiscal_year_end: string | null;
  created_at: Date;
  updated_at: Date;
}

interface FilingRow {
  id: string;
  company_id: string;
  accession_number: string;
  filing_date: string;
  report_date: string | null;
  form: string;
  primary_document: string;
  description: string;
  sec_url: string;
  raw_text_hash: string | null;
  created_at: Date;
}

interface FilingDocumentRow {
  filing_id: string;
  source_url: string;
  raw_text: string;
  raw_text_hash: string;
  fetched_at: Date;
}

interface FilingEventRow {
  filing_id: string;
  event_type: AnalysisEvent["eventType"];
  title: string;
  summary: string;
  amount: string | null;
  securities: string | null;
  status: string | null;
  confidence: AnalysisEvent["confidence"];
  source_snippet: string;
}

function mapCompany(row: CompanyRow): StoredCompany {
  return {
    id: Number(row.id),
    ticker: row.ticker,
    cik: row.cik,
    companyName: row.company_name,
    sic: row.sic,
    fiscalYearEnd: row.fiscal_year_end,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

function mapFiling(row: FilingRow): StoredFiling {
  return {
    id: Number(row.id),
    companyId: Number(row.company_id),
    accessionNumber: row.accession_number,
    filingDate: row.filing_date,
    reportDate: row.report_date,
    form: row.form,
    primaryDocument: row.primary_document,
    description: row.description,
    secUrl: row.sec_url,
    rawTextHash: row.raw_text_hash,
    createdAt: row.created_at.toISOString()
  };
}

export async function findCompanyByTicker(
  ticker: string
): Promise<StoredCompany | null> {
  const rows = await query<CompanyRow>(
    `SELECT id, ticker, cik, company_name, sic, fiscal_year_end, created_at, updated_at
     FROM companies
     WHERE ticker = $1`,
    [ticker]
  );

  return rows[0] ? mapCompany(rows[0]) : null;
}

export async function upsertCompany(
  company: CompanyProfile
): Promise<StoredCompany> {
  const rows = await query<CompanyRow>(
    `INSERT INTO companies (ticker, cik, company_name, sic, fiscal_year_end)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (ticker)
     DO UPDATE SET
       cik = EXCLUDED.cik,
       company_name = EXCLUDED.company_name,
       sic = EXCLUDED.sic,
       fiscal_year_end = EXCLUDED.fiscal_year_end,
       updated_at = NOW()
     RETURNING id, ticker, cik, company_name, sic, fiscal_year_end, created_at, updated_at`,
    [
      company.ticker,
      company.cik,
      company.companyName,
      company.sic,
      company.fiscalYearEnd
    ]
  );

  return mapCompany(rows[0]!);
}

export async function findRecentFilings(
  companyId: number,
  limit: number,
  forms?: string[]
): Promise<StoredFiling[]> {
  const values: unknown[] = [companyId];
  let formsClause = "";

  if (forms?.length) {
    values.push(forms);
    formsClause = ` AND form = ANY($${values.length}::text[])`;
  }

  values.push(limit);

  const rows = await query<FilingRow>(
    `SELECT id, company_id, accession_number, filing_date, report_date, form, primary_document,
            description, sec_url, raw_text_hash, created_at
     FROM filings
     WHERE company_id = $1${formsClause}
     ORDER BY filing_date DESC
     LIMIT $${values.length}`,
    values
  );

  return rows.map(mapFiling);
}

export async function upsertFilings(
  companyId: number,
  filings: FilingRecord[]
): Promise<void> {
  if (!filings.length) {
    return;
  }

  await withTransaction(async (client) => {
    for (const filing of filings) {
      await client.query(
        `INSERT INTO filings (
           company_id, accession_number, filing_date, report_date, form,
           primary_document, description, sec_url
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (accession_number)
         DO UPDATE SET
           filing_date = EXCLUDED.filing_date,
           report_date = EXCLUDED.report_date,
           form = EXCLUDED.form,
           primary_document = EXCLUDED.primary_document,
           description = EXCLUDED.description,
           sec_url = EXCLUDED.sec_url`,
        [
          companyId,
          filing.accessionNumber,
          filing.filingDate,
          filing.reportDate,
          filing.form,
          filing.primaryDocument,
          filing.description,
          filing.secUrl
        ]
      );
    }
  });
}

export async function findFilingDocument(
  filingId: number
): Promise<StoredFilingDocument | null> {
  const rows = await query<FilingDocumentRow>(
    `SELECT filing_id, source_url, raw_text, raw_text_hash, fetched_at
     FROM filing_documents
     WHERE filing_id = $1`,
    [filingId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    filingId: Number(row.filing_id),
    sourceUrl: row.source_url,
    rawText: row.raw_text,
    rawTextHash: row.raw_text_hash,
    fetchedAt: row.fetched_at.toISOString()
  };
}

export async function upsertFilingDocument(input: {
  filingId: number;
  sourceUrl: string;
  rawText: string;
  rawTextHash: string;
}): Promise<void> {
  await withTransaction(async (client) => {
    await client.query(
      `INSERT INTO filing_documents (filing_id, source_url, raw_text, raw_text_hash, fetched_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (filing_id)
       DO UPDATE SET
         source_url = EXCLUDED.source_url,
         raw_text = EXCLUDED.raw_text,
         raw_text_hash = EXCLUDED.raw_text_hash,
         fetched_at = NOW(),
         updated_at = NOW()`,
      [input.filingId, input.sourceUrl, input.rawText, input.rawTextHash]
    );

    await client.query(
      `UPDATE filings
       SET raw_text_hash = $2
       WHERE id = $1`,
      [input.filingId, input.rawTextHash]
    );
  });
}

export async function findEventsForFilings(
  filingIds: number[]
): Promise<Map<number, AnalysisEvent[]>> {
  if (!filingIds.length) {
    return new Map();
  }

  const rows = await query<FilingEventRow>(
    `SELECT filing_id, event_type, title, summary, amount, securities, status, confidence, source_snippet
     FROM filing_events
     WHERE filing_id = ANY($1::bigint[])`,
    [filingIds]
  );

  const eventsByFiling = new Map<number, AnalysisEvent[]>();

  for (const row of rows) {
    const filingId = Number(row.filing_id);
    const bucket = eventsByFiling.get(filingId) ?? [];
    bucket.push({
      eventType: row.event_type,
      title: row.title,
      summary: row.summary,
      filingDate: "",
      form: "",
      accessionNumber: "",
      amount: row.amount ?? "not found",
      securities: row.securities ?? "not found",
      status: row.status ?? "not found",
      confidence: row.confidence,
      sourceUrl: "",
      sourceSnippet: row.source_snippet,
      signalDirection: "neutral",
      warningLevel: "low",
      shortTermImpact: row.summary,
      keyTerms: "not found",
      sourceLabel: "SEC filing",
      shareCount: "not found",
      pricePerShare: "not found",
      insiderName: "not found"
    });
    eventsByFiling.set(filingId, bucket);
  }

  return eventsByFiling;
}

export async function replaceEventsForFiling(
  filingId: number,
  events: AnalysisEvent[]
): Promise<void> {
  await withTransaction(async (client: PoolClient) => {
    await client.query(`DELETE FROM filing_events WHERE filing_id = $1`, [filingId]);

    for (const event of events) {
      await client.query(
        `INSERT INTO filing_events (
           filing_id, event_type, title, summary, amount, securities, status, confidence, source_snippet
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          filingId,
          event.eventType,
          event.title,
          event.summary,
          event.amount === "not found" ? null : event.amount,
          event.securities === "not found" ? null : event.securities,
          event.status === "not found" ? null : event.status,
          event.confidence,
          event.sourceSnippet
        ]
      );
    }
  });
}
