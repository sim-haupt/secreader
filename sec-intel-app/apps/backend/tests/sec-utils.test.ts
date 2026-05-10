import { describe, expect, it } from "vitest";

import {
  buildSecFilingUrl,
  formatCik,
  isValidTicker,
  normalizeTickerInput
} from "@sec-intel-app/shared";

import { detectEventsFromFiling } from "../src/lib/detector.js";

describe("ticker validation", () => {
  it("normalizes and validates standard tickers", () => {
    expect(normalizeTickerInput(" tsla ")).toBe("TSLA");
    expect(isValidTicker("AAPL")).toBe(true);
    expect(isValidTicker("BRK.B")).toBe(true);
  });

  it("rejects invalid ticker input", () => {
    expect(isValidTicker("TSLA!")).toBe(false);
    expect(isValidTicker("")).toBe(false);
  });
});

describe("SEC utilities", () => {
  it("formats CIK values to ten digits", () => {
    expect(formatCik(320193)).toBe("0000320193");
  });

  it("builds SEC archive URLs deterministically", () => {
    expect(
      buildSecFilingUrl("0000320193", "0000320193-24-000069", "aapl-20240330x10q.htm")
    ).toBe(
      "https://www.sec.gov/Archives/edgar/data/320193/000032019324000069/aapl-20240330x10q.htm"
    );
  });
});

describe("event detection", () => {
  it("detects ATM programs", () => {
    const filing = {
      accessionNumber: "0000000000-24-000001",
      filingDate: "2024-05-01",
      reportDate: null,
      form: "8-K",
      primaryDocument: "example.htm",
      description: "Current report",
      secUrl: "https://www.sec.gov/example"
    };

    const text =
      "The Company entered into an Equity Distribution Agreement for an at-the-market offering of common stock with gross proceeds of up to $250 million.";

    const events = detectEventsFromFiling(filing, text);

    expect(events[0]?.eventType).toBe("ATM_PROGRAM");
    expect(events[0]?.amount).toBe("$250 million");
    expect(events[0]?.securities).toBe("common stock");
  });

  it("detects convertible debt offerings", () => {
    const filing = {
      accessionNumber: "0000000000-24-000002",
      filingDate: "2024-05-01",
      reportDate: null,
      form: "8-K",
      primaryDocument: "example.htm",
      description: "Current report",
      secUrl: "https://www.sec.gov/example"
    };

    const text =
      "The issuer announced a public offering of $750 million aggregate principal amount of convertible senior notes due 2030.";

    const events = detectEventsFromFiling(filing, text);

    expect(events.some((event) => event.eventType === "CONVERTIBLE_DEBT")).toBe(true);
  });
});

