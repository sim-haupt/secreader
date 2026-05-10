import { format, parseISO } from "date-fns";

import { EVENT_TYPE_LABELS, type ConfidenceLevel, type EventType } from "@sec-intel-app/shared";

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

