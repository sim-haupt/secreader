const TICKER_PATTERN = /^[A-Z][A-Z.-]{0,9}$/;

export function normalizeTickerInput(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidTicker(input: string): boolean {
  return TICKER_PATTERN.test(normalizeTickerInput(input));
}

