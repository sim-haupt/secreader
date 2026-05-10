import { format, parseISO } from "date-fns";

import { EVENT_TYPE_LABELS, type ConfidenceLevel, type EventType } from "./types";

const UTC_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short"
});

export function formatDate(value: string): string {
  if (value === "not found") {
    return value;
  }

  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

export function formatDateTimeUtc(value: string): string {
  try {
    return UTC_DATE_TIME_FORMATTER.format(new Date(value));
  } catch {
    return value;
  }
}

export function getEventLabel(eventType: EventType): string {
  return EVENT_TYPE_LABELS[eventType];
}

export function confidenceTone(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case "high":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "medium":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "low":
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

export function filingTone(form: string): string {
  if (/^8-K$/i.test(form)) {
    return "bg-sky-100 text-sky-800 ring-sky-200";
  }

  if (/^10-[QK]$/i.test(form)) {
    return "bg-violet-100 text-violet-800 ring-violet-200";
  }

  if (/^S-/i.test(form) || /^424/i.test(form)) {
    return "bg-rose-100 text-rose-800 ring-rose-200";
  }

  return "bg-slate-100 text-slate-700 ring-slate-200";
}

export function titleCaseConfidence(confidence: ConfidenceLevel): string {
  return confidence.charAt(0).toUpperCase() + confidence.slice(1);
}

export function getShortTermImpact(eventType: EventType): {
  label: string;
  tone: string;
  explanation: string;
} {
  switch (eventType) {
    case "BUYBACK_AUTHORIZATION":
    case "BUYBACK_COMPLETED":
      return {
        label: "Float support",
        tone: "bg-emerald-100 text-emerald-900 ring-emerald-200",
        explanation: "Can support price because the company may be reducing share supply or signaling confidence."
      };
    case "PUBLIC_OFFERING":
    case "ATM_PROGRAM":
    case "REGISTERED_DIRECT_OFFERING":
    case "WARRANT_ISSUANCE":
    case "RESALE_REGISTRATION":
      return {
        label: "Potential dilution",
        tone: "bg-rose-100 text-rose-900 ring-rose-200",
        explanation: "Can pressure price in the short term because more shares may hit the market."
      };
    case "SHELF_REGISTRATION":
      return {
        label: "Watchlist item",
        tone: "bg-amber-100 text-amber-900 ring-amber-200",
        explanation: "Not dilution by itself, but it can set up future share or debt sales."
      };
    case "CONVERTIBLE_DEBT":
      return {
        label: "Financing risk",
        tone: "bg-orange-100 text-orange-900 ring-orange-200",
        explanation: "Raises capital now and may create future dilution if the notes convert into stock."
      };
    case "OTHER_FINANCING_EVENT":
      return {
        label: "Needs review",
        tone: "bg-slate-100 text-slate-900 ring-slate-200",
        explanation: "This financing language may matter, but the filing should be reviewed closely."
      };
    case "NONE_FOUND":
      return {
        label: "No signal found",
        tone: "bg-slate-100 text-slate-900 ring-slate-200",
        explanation: "No recent float-moving event was detected in the filings reviewed."
      };
  }
}

export function buildSimpleSummary(eventType: EventType, amount: string, securities: string): string {
  switch (eventType) {
    case "BUYBACK_AUTHORIZATION":
      return amount !== "not found"
        ? `The company disclosed a buyback authorization of up to ${amount}.`
        : "The company disclosed a new or updated buyback authorization.";
    case "BUYBACK_COMPLETED":
      return "The company reported active share repurchases in a recent filing.";
    case "PUBLIC_OFFERING":
      return amount !== "not found"
        ? `The company disclosed a public offering tied to roughly ${amount} of securities.`
        : "The company disclosed a public offering that could increase available supply.";
    case "SHELF_REGISTRATION":
      return "The company filed or referenced a shelf registration that can be used for future capital raises.";
    case "ATM_PROGRAM":
      return amount !== "not found"
        ? `The company disclosed an at-the-market program for up to ${amount}.`
        : "The company disclosed an at-the-market stock sale program.";
    case "REGISTERED_DIRECT_OFFERING":
      return "The company disclosed a registered direct offering with new investor financing.";
    case "CONVERTIBLE_DEBT":
      return amount !== "not found"
        ? `The company disclosed convertible or note financing for about ${amount}.`
        : "The company disclosed convertible or note financing that may affect future share supply.";
    case "WARRANT_ISSUANCE":
      return securities !== "not found"
        ? `The company disclosed ${securities}, which can create future dilution if exercised.`
        : "The company disclosed warrants, which can create future dilution if exercised.";
    case "RESALE_REGISTRATION":
      return "The company disclosed a resale registration that may allow existing holders to sell shares.";
    case "OTHER_FINANCING_EVENT":
      return "The filing includes financing language that may affect short-term price or share supply.";
    case "NONE_FOUND":
      return "No float-moving event was found in the recent filings reviewed.";
  }
}

export function buildKeyTerms(event: {
  amount: string;
  securities: string;
  status: string;
}): string {
  const parts = [
    event.amount !== "not found" ? event.amount : null,
    event.securities !== "not found" ? event.securities : null,
    event.status !== "not found" ? event.status : null
  ].filter(Boolean);

  return parts.length ? parts.join(" • ") : "Specific terms were not clearly stated in the extracted snippet.";
}

export function buildSourceLabel(form: string): string {
  if (/^8-K$/i.test(form)) {
    return "8-K / attached exhibit or press release";
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
