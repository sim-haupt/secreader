import {
  EVENT_TYPE_LABELS,
  type AnalysisEvent,
  type ConfidenceLevel,
  type EventType,
  type FilingRecord
} from "@sec-intel-app/shared";

interface DetectionRule {
  eventType: EventType;
  keywords: string[];
  confidence: ConfidenceLevel;
}

const DETECTION_RULES: DetectionRule[] = [
  {
    eventType: "ATM_PROGRAM",
    keywords: ["at-the-market offering", "atm offering", "equity distribution agreement"],
    confidence: "high"
  },
  {
    eventType: "REGISTERED_DIRECT_OFFERING",
    keywords: ["registered direct offering", "securities purchase agreement"],
    confidence: "high"
  },
  {
    eventType: "PUBLIC_OFFERING",
    keywords: ["public offering", "underwritten offering", "prospectus supplement", "net proceeds"],
    confidence: "medium"
  },
  {
    eventType: "SHELF_REGISTRATION",
    keywords: ["shelf registration", "form s-3", "form s-1", "424b5", "424b3", "resale registration"],
    confidence: "high"
  },
  {
    eventType: "BUYBACK_AUTHORIZATION",
    keywords: [
      "share repurchase",
      "stock repurchase",
      "repurchase program",
      "authorized repurchase",
      "accelerated share repurchase",
      "10b5-1 repurchase"
    ],
    confidence: "medium"
  },
  {
    eventType: "BUYBACK_COMPLETED",
    keywords: ["issuer purchases of equity securities", "repurchased shares", "repurchased common stock"],
    confidence: "medium"
  },
  {
    eventType: "CONVERTIBLE_DEBT",
    keywords: ["convertible notes", "convertible senior notes", "senior notes", "notes offering"],
    confidence: "high"
  },
  {
    eventType: "WARRANT_ISSUANCE",
    keywords: ["common stock purchase warrants", "pre-funded warrants", "warrants"],
    confidence: "high"
  },
  {
    eventType: "RESALE_REGISTRATION",
    keywords: ["resale registration", "resale prospectus"],
    confidence: "high"
  },
  {
    eventType: "OTHER_FINANCING_EVENT",
    keywords: ["dilution", "offering", "financing", "net proceeds"],
    confidence: "low"
  }
];

const SECURITY_PATTERNS: Array<[RegExp, string]> = [
  [/\bcommon stock\b/i, "common stock"],
  [/\bpreferred stock\b/i, "preferred stock"],
  [/\bconvertible senior notes?\b/i, "convertible senior notes"],
  [/\bsenior notes?\b/i, "senior notes"],
  [/\bcommon stock purchase warrants?\b/i, "common stock purchase warrants"],
  [/\bpre-funded warrants?\b/i, "pre-funded warrants"],
  [/\bwarrants?\b/i, "warrants"]
];

function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function findKeywordMatch(text: string, keywords: string[]): { index: number; keyword: string } | null {
  const lowerText = text.toLowerCase();

  for (const keyword of keywords) {
    const index = lowerText.indexOf(keyword.toLowerCase());
    if (index >= 0) {
      return { index, keyword };
    }
  }

  return null;
}

function extractSnippet(text: string, index: number, keyword: string): string {
  const start = Math.max(0, index - 220);
  const end = Math.min(text.length, index + keyword.length + 260);
  return normalizeWhitespace(text.slice(start, end));
}

function extractAmount(snippet: string): string {
  const match = snippet.match(
    /\$[0-9][0-9,]*(?:\.\d+)?(?:\s?(?:million|billion|thousand))?/i
  );
  return match?.[0] ?? "not found";
}

function extractSecurities(snippet: string): string {
  for (const [pattern, label] of SECURITY_PATTERNS) {
    if (pattern.test(snippet)) {
      return label;
    }
  }

  return "not found";
}

function inferStatus(snippet: string, eventType: EventType): string {
  if (/authorized|approved/i.test(snippet) && eventType === "BUYBACK_AUTHORIZATION") {
    return "authorized";
  }

  if (/closed|completed|settled/i.test(snippet)) {
    return "completed";
  }

  if (/entered into|announced|launched|commenced|filed/i.test(snippet)) {
    return "announced";
  }

  return "disclosed";
}

function buildSummary(eventType: EventType, keyword: string, snippet: string): string {
  return `${EVENT_TYPE_LABELS[eventType]} detected from the phrase "${keyword}" in a recent SEC filing. ${snippet}`;
}

export function detectEventsFromFiling(
  filing: FilingRecord,
  rawText: string
): AnalysisEvent[] {
  const events: AnalysisEvent[] = [];
  const seenEventTypes = new Set<EventType>();

  for (const rule of DETECTION_RULES) {
    const match = findKeywordMatch(rawText, rule.keywords);
    if (!match || seenEventTypes.has(rule.eventType)) {
      continue;
    }

    const sourceSnippet = extractSnippet(rawText, match.index, match.keyword);
    const amount = extractAmount(sourceSnippet);
    const securities = extractSecurities(sourceSnippet);
    const status = inferStatus(sourceSnippet, rule.eventType);

    events.push({
      eventType: rule.eventType,
      title: EVENT_TYPE_LABELS[rule.eventType],
      summary: buildSummary(rule.eventType, match.keyword, sourceSnippet),
      filingDate: filing.filingDate,
      form: filing.form,
      accessionNumber: filing.accessionNumber,
      amount,
      securities,
      status,
      confidence: rule.confidence,
      sourceUrl: filing.secUrl,
      sourceSnippet
    });

    seenEventTypes.add(rule.eventType);
  }

  return events;
}

export function buildNoneFoundEvent(
  filing: FilingRecord | null
): AnalysisEvent {
  return {
    eventType: "NONE_FOUND",
    title: "No recent capital-market events found",
    summary: "Not found in recent filings.",
    filingDate: filing?.filingDate ?? "not found",
    form: filing?.form ?? "not found",
    accessionNumber: filing?.accessionNumber ?? "not found",
    amount: "not found",
    securities: "not found",
    status: "not found",
    confidence: "low",
    sourceUrl: filing?.secUrl ?? "",
    sourceSnippet: "Not found in recent filings."
  };
}

