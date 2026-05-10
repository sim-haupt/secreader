const TICKER_PATTERN = /^[A-Z][A-Z.-]{0,9}$/;

export const DEFAULT_FILING_LIMIT = 20;

export const DEFAULT_ANALYSIS_FORMS = [
  "8-K",
  "10-Q",
  "10-K",
  "4",
  "S-1",
  "S-3",
  "424B5",
  "424B3",
  "424B2",
  "424B1"
] as const;

export function normalizeTickerInput(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidTicker(input: string): boolean {
  return TICKER_PATTERN.test(normalizeTickerInput(input));
}

export function formatCik(cik: string | number): string {
  return String(cik).replace(/\D/g, "").padStart(10, "0");
}

export function stripAccessionDashes(accessionNumber: string): string {
  return accessionNumber.replace(/-/g, "");
}

export function buildSecFilingUrl(
  cik: string | number,
  accessionNumber: string,
  primaryDocument: string
): string {
  const normalizedCik = formatCik(cik).replace(/^0+/, "");
  const normalizedAccession = stripAccessionDashes(accessionNumber);
  return `https://www.sec.gov/Archives/edgar/data/${normalizedCik}/${normalizedAccession}/${primaryDocument}`;
}
