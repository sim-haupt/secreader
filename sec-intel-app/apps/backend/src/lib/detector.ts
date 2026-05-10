import {
  EVENT_TYPE_LABELS,
  type AnalysisEvent,
  type ConfidenceLevel,
  type EventType,
  type FilingRecord,
  type SignalDirection,
  type WarningLevel
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

function titleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
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

function extractShareCount(snippet: string): string {
  const patterns = [
    /\b([0-9][0-9,]*(?:\.\d+)?)\s+(?:shares?|share|warrants?|units?)\b/i,
    /\bup to\s+([0-9][0-9,]*(?:\.\d+)?)\s+(?:shares?|warrants?)\b/i
  ];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "not found";
}

function extractPricePerShare(snippet: string): string {
  const patterns = [
    /\bexercise price(?: of)?\s+(\$[0-9][0-9,]*(?:\.\d+)?)/i,
    /\b(?:purchase|offering) price(?: of)?\s+(\$[0-9][0-9,]*(?:\.\d+)?)(?:\s+per share)?/i,
    /\b(\$[0-9][0-9,]*(?:\.\d+)?)\s+per share\b/i
  ];

  for (const pattern of patterns) {
    const match = snippet.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return "not found";
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

function inferSignalDirection(eventType: EventType): SignalDirection {
  switch (eventType) {
    case "BUYBACK_AUTHORIZATION":
    case "BUYBACK_COMPLETED":
    case "INSIDER_BUY":
      return "positive";
    case "PUBLIC_OFFERING":
    case "ATM_PROGRAM":
    case "REGISTERED_DIRECT_OFFERING":
    case "WARRANT_ISSUANCE":
    case "RESALE_REGISTRATION":
    case "INSIDER_SELL":
      return "negative";
    case "SHELF_REGISTRATION":
    case "CONVERTIBLE_DEBT":
    case "OTHER_FINANCING_EVENT":
      return "mixed";
    case "NONE_FOUND":
      return "neutral";
  }
}

function inferWarningLevel(eventType: EventType): WarningLevel {
  switch (eventType) {
    case "PUBLIC_OFFERING":
    case "ATM_PROGRAM":
    case "REGISTERED_DIRECT_OFFERING":
    case "WARRANT_ISSUANCE":
    case "INSIDER_SELL":
      return "high";
    case "SHELF_REGISTRATION":
    case "CONVERTIBLE_DEBT":
    case "RESALE_REGISTRATION":
    case "BUYBACK_AUTHORIZATION":
    case "INSIDER_BUY":
      return "medium";
    case "BUYBACK_COMPLETED":
    case "OTHER_FINANCING_EVENT":
    case "NONE_FOUND":
      return "low";
  }
}

function buildShortTermImpact(eventType: EventType): string {
  switch (eventType) {
    case "BUYBACK_AUTHORIZATION":
      return "Positive signal. A buyback can support price and reduce available share supply.";
    case "BUYBACK_COMPLETED":
      return "Positive signal. The company is actively repurchasing stock.";
    case "PUBLIC_OFFERING":
      return "Negative signal. A stock offering can pressure price by increasing supply.";
    case "SHELF_REGISTRATION":
      return "Warning. A shelf does not dilute immediately, but it can set up future offerings.";
    case "ATM_PROGRAM":
      return "Negative signal. An ATM program lets the company sell stock into the market over time.";
    case "REGISTERED_DIRECT_OFFERING":
      return "Negative signal. A direct offering can add supply and weigh on short-term price.";
    case "CONVERTIBLE_DEBT":
      return "Mixed signal. It brings in cash now but can lead to future dilution if converted.";
    case "WARRANT_ISSUANCE":
      return "Negative signal. Warrants can create future dilution when exercised.";
    case "RESALE_REGISTRATION":
      return "Negative signal. Existing holders may be able to sell more shares into the market.";
    case "INSIDER_BUY":
      return "Positive signal. Insider buying can suggest management confidence.";
    case "INSIDER_SELL":
      return "Negative signal. Insider selling can pressure sentiment in the short term.";
    case "OTHER_FINANCING_EVENT":
      return "Watch closely. The filing includes financing language that may affect price or float.";
    case "NONE_FOUND":
      return "No major short-term float or financing signal was detected.";
  }
}

function buildSourceLabel(form: string): string {
  if (/^8-K$/i.test(form)) {
    return "8-K / exhibit / press release";
  }

  if (/^4$/i.test(form)) {
    return "Form 4 insider trading report";
  }

  if (/^10-[QK]$/i.test(form)) {
    return `${form} periodic report`;
  }

  if (/^424/i.test(form)) {
    return `${form} prospectus filing`;
  }

  if (/^S-/i.test(form)) {
    return `${form} registration statement`;
  }

  return `${form} SEC filing`;
}

function buildKeyTerms(input: {
  amount: string;
  securities: string;
  shareCount: string;
  pricePerShare: string;
  status: string;
  insiderName: string;
}): string {
  const terms = [
    input.amount !== "not found" ? input.amount : null,
    input.shareCount !== "not found" ? `${input.shareCount} shares/warrants` : null,
    input.pricePerShare !== "not found" ? `${input.pricePerShare} per share` : null,
    input.securities !== "not found" ? input.securities : null,
    input.status !== "not found" ? input.status : null,
    input.insiderName !== "not found" ? input.insiderName : null
  ].filter(Boolean);

  return terms.length ? terms.join(" • ") : "Not found in the extracted filing text.";
}

function buildSummary(eventType: EventType, details: {
  amount: string;
  securities: string;
  shareCount: string;
  pricePerShare: string;
  insiderName: string;
}): string {
  switch (eventType) {
    case "BUYBACK_AUTHORIZATION":
      return details.amount !== "not found"
        ? `The company announced a board-approved share repurchase program of up to ${details.amount}.`
        : "The company announced a new or updated share repurchase authorization.";
    case "BUYBACK_COMPLETED":
      return "The company reported active share repurchases in a recent filing.";
    case "PUBLIC_OFFERING":
      return details.amount !== "not found"
        ? `The company disclosed a public offering for about ${details.amount}.`
        : "The company disclosed a public offering that may increase share supply.";
    case "SHELF_REGISTRATION":
      return "The company filed or referenced a shelf registration that could support a future capital raise.";
    case "ATM_PROGRAM":
      return details.amount !== "not found"
        ? `The company disclosed an at-the-market sale program of up to ${details.amount}.`
        : "The company disclosed an at-the-market sale program that could add shares into the market.";
    case "REGISTERED_DIRECT_OFFERING":
      return "The company disclosed a registered direct offering with outside investors.";
    case "CONVERTIBLE_DEBT":
      return details.amount !== "not found"
        ? `The company disclosed convertible or note financing of about ${details.amount}.`
        : "The company disclosed convertible or note financing that may affect future dilution.";
    case "WARRANT_ISSUANCE":
      return details.shareCount !== "not found" || details.pricePerShare !== "not found"
        ? `The company disclosed warrants${details.shareCount !== "not found" ? ` covering about ${details.shareCount} shares` : ""}${details.pricePerShare !== "not found" ? ` at roughly ${details.pricePerShare}` : ""}.`
        : "The company disclosed warrants that may create future dilution.";
    case "RESALE_REGISTRATION":
      return "The company disclosed a resale registration that may let holders sell more stock.";
    case "INSIDER_BUY":
      return details.insiderName !== "not found"
        ? `${details.insiderName} reported an insider purchase.`
        : "A recent Form 4 reported insider buying.";
    case "INSIDER_SELL":
      return details.insiderName !== "not found"
        ? `${details.insiderName} reported an insider sale.`
        : "A recent Form 4 reported insider selling.";
    case "OTHER_FINANCING_EVENT":
      return "The filing includes financing language that may matter for short-term price action.";
    case "NONE_FOUND":
      return "Not found in recent filings.";
  }
}

function extractInsiderEventFromRawSource(
  filing: FilingRecord,
  rawSource?: string
): AnalysisEvent[] {
  if (filing.form !== "4" || !rawSource) {
    return [];
  }

  const code = rawSource.match(/<transactionCode>\s*([A-Z])\s*<\/transactionCode>/i)?.[1]?.toUpperCase();
  if (!code || !["P", "S"].includes(code)) {
    return [];
  }

  const eventType: EventType = code === "P" ? "INSIDER_BUY" : "INSIDER_SELL";
  const insiderName =
    rawSource.match(/<rptOwnerName>\s*([^<]+)\s*<\/rptOwnerName>/i)?.[1]?.trim() ?? "not found";
  const shareCount =
    rawSource.match(/<transactionShares>\s*<value>\s*([^<]+)\s*<\/value>/i)?.[1]?.trim() ?? "not found";
  const pricePerShare =
    rawSource.match(/<transactionPricePerShare>\s*<value>\s*([^<]+)\s*<\/value>/i)?.[1]?.trim() ?? "not found";
  const sourceSnippet = normalizeWhitespace(
    `Reporting owner ${insiderName}. Transaction code ${code}. Shares ${shareCount}. Price per share ${pricePerShare}.`
  );
  const signalDirection = inferSignalDirection(eventType);
  const warningLevel = inferWarningLevel(eventType);
  const amount = pricePerShare !== "not found" && shareCount !== "not found"
    ? "not found"
    : "not found";
  const keyTerms = buildKeyTerms({
    amount,
    securities: "common stock",
    shareCount,
    pricePerShare,
    status: code === "P" ? "purchased" : "sold",
    insiderName
  });

  return [
    {
      eventType,
      title: EVENT_TYPE_LABELS[eventType],
      summary: buildSummary(eventType, {
        amount,
        securities: "common stock",
        shareCount,
        pricePerShare: pricePerShare !== "not found" ? `$${pricePerShare}` : "not found",
        insiderName
      }),
      filingDate: filing.filingDate,
      form: filing.form,
      accessionNumber: filing.accessionNumber,
      amount,
      securities: "common stock",
      status: code === "P" ? "purchased" : "sold",
      confidence: "high",
      sourceUrl: filing.secUrl,
      sourceSnippet,
      signalDirection,
      warningLevel,
      shortTermImpact: buildShortTermImpact(eventType),
      keyTerms,
      sourceLabel: buildSourceLabel(filing.form),
      shareCount,
      pricePerShare: pricePerShare !== "not found" ? `$${pricePerShare}` : "not found",
      insiderName: insiderName !== "" ? titleCase(insiderName) : "not found"
    }
  ];
}

export function detectEventsFromFiling(
  filing: FilingRecord,
  rawText: string,
  rawSource?: string
): AnalysisEvent[] {
  const insiderEvents = extractInsiderEventFromRawSource(filing, rawSource);
  if (insiderEvents.length) {
    return insiderEvents;
  }

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
    const shareCount = extractShareCount(sourceSnippet);
    const pricePerShare = extractPricePerShare(sourceSnippet);
    const signalDirection = inferSignalDirection(rule.eventType);
    const warningLevel = inferWarningLevel(rule.eventType);
    const insiderName = "not found";
    const keyTerms = buildKeyTerms({
      amount,
      securities,
      shareCount,
      pricePerShare,
      status,
      insiderName
    });

    events.push({
      eventType: rule.eventType,
      title: EVENT_TYPE_LABELS[rule.eventType],
      summary: buildSummary(rule.eventType, {
        amount,
        securities,
        shareCount,
        pricePerShare,
        insiderName
      }),
      filingDate: filing.filingDate,
      form: filing.form,
      accessionNumber: filing.accessionNumber,
      amount,
      securities,
      status,
      confidence: rule.confidence,
      sourceUrl: filing.secUrl,
      sourceSnippet,
      signalDirection,
      warningLevel,
      shortTermImpact: buildShortTermImpact(rule.eventType),
      keyTerms,
      sourceLabel: buildSourceLabel(filing.form),
      shareCount,
      pricePerShare,
      insiderName
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
    sourceSnippet: "Not found in recent filings.",
    signalDirection: "neutral",
    warningLevel: "low",
    shortTermImpact: buildShortTermImpact("NONE_FOUND"),
    keyTerms: "Not found in recent filings.",
    sourceLabel: filing ? buildSourceLabel(filing.form) : "Recent SEC filings",
    shareCount: "not found",
    pricePerShare: "not found",
    insiderName: "not found"
  };
}
