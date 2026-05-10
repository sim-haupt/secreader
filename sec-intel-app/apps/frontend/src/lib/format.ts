import { format, parseISO } from "date-fns";

import {
  EVENT_TYPE_LABELS,
  type AnalysisEvent,
  type ConfidenceLevel,
  type EventType,
  type FinancialMetric,
  type SignalDirection,
  type WarningLevel
} from "./types";

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

export function signalTone(signalDirection: SignalDirection): string {
  switch (signalDirection) {
    case "positive":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "negative":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    case "mixed":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "neutral":
      return "bg-slate-100 text-slate-900 ring-slate-200";
  }
}

export function signalLabel(signalDirection: SignalDirection): string {
  switch (signalDirection) {
    case "positive":
      return "Positive";
    case "negative":
      return "Negative";
    case "mixed":
      return "Mixed";
    case "neutral":
      return "Neutral";
  }
}

export function warningTone(warningLevel: WarningLevel): string {
  switch (warningLevel) {
    case "high":
      return "bg-rose-100 text-rose-900 ring-rose-200";
    case "medium":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "low":
      return "bg-slate-100 text-slate-900 ring-slate-200";
  }
}

export function warningLabel(warningLevel: WarningLevel): string {
  switch (warningLevel) {
    case "high":
      return "High warning";
    case "medium":
      return "Medium warning";
    case "low":
      return "Low warning";
  }
}

export function buildEventHeadline(event: AnalysisEvent): {
  label: string;
  tone: string;
  explanation: string;
} {
  return {
    label: signalLabel(event.signalDirection),
    tone: signalTone(event.signalDirection),
    explanation: event.shortTermImpact
  };
}

export function compactEventTitle(eventType: EventType): string {
  return EVENT_TYPE_LABELS[eventType];
}

export function formatMetric(metric: FinancialMetric): string {
  return metric.value;
}
