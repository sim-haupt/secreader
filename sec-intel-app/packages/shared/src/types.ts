export const EVENT_TYPES = [
  "BUYBACK_AUTHORIZATION",
  "BUYBACK_COMPLETED",
  "PUBLIC_OFFERING",
  "SHELF_REGISTRATION",
  "ATM_PROGRAM",
  "REGISTERED_DIRECT_OFFERING",
  "CONVERTIBLE_DEBT",
  "WARRANT_ISSUANCE",
  "RESALE_REGISTRATION",
  "OTHER_FINANCING_EVENT",
  "NONE_FOUND"
] as const;

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export interface CompanyProfile {
  ticker: string;
  cik: string;
  companyName: string;
  sic: string | null;
  fiscalYearEnd: string | null;
}

export interface FilingRecord {
  accessionNumber: string;
  filingDate: string;
  reportDate: string | null;
  form: string;
  primaryDocument: string;
  description: string;
  secUrl: string;
}

export interface AnalysisEvent {
  eventType: EventType;
  title: string;
  summary: string;
  filingDate: string;
  form: string;
  accessionNumber: string;
  amount: string;
  securities: string;
  status: string;
  confidence: ConfidenceLevel;
  sourceUrl: string;
  sourceSnippet: string;
}

export interface AnalyzeResponse {
  ticker: string;
  companyName: string;
  cik: string;
  analyzedAt: string;
  events: AnalysisEvent[];
  recentFilings: FilingRecord[];
}

