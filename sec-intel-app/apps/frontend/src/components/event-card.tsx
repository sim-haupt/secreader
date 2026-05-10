import { ExternalLink } from "lucide-react";

import type { AnalysisEvent } from "../lib/types";

import {
  buildEventHeadline,
  compactEventTitle,
  confidenceTone,
  filingTone,
  formatDate,
  titleCaseConfidence,
  warningLabel,
  warningTone
} from "../lib/format";

interface EventCardProps {
  event: AnalysisEvent;
}

export function EventCard({ event }: EventCardProps) {
  const headline = buildEventHeadline(event);

  return (
    <article className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(12,51,46,0.09)] backdrop-blur">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ${headline.tone}`}>
                {headline.label}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ${filingTone(event.form)}`}
              >
                {event.form}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ${warningTone(event.warningLevel)}`}
              >
                {warningLabel(event.warningLevel)}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ${confidenceTone(event.confidence)}`}
              >
                {event.confidence} confidence
              </span>
            </div>

            <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
              {compactEventTitle(event.eventType)}
            </h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">{headline.explanation}</p>
          </div>

          {event.sourceUrl ? (
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              SEC filing
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
          <div className="space-y-3 text-sm leading-7 text-slate-700">
            <p>
              <span className="font-semibold text-slate-950">Filing:</span>{" "}
              {event.form} filed {formatDate(event.filingDate)}
            </p>
            <p>
              <span className="font-semibold text-slate-950">Detected event:</span>{" "}
              {compactEventTitle(event.eventType)}
            </p>
            <p>
              <span className="font-semibold text-slate-950">Summary:</span>{" "}
              {event.summary}
            </p>
            <p>
              <span className="font-semibold text-slate-950">Key terms:</span>{" "}
              {event.keyTerms}
            </p>
            <p>
              <span className="font-semibold text-slate-950">Source:</span>{" "}
              {event.sourceLabel}
            </p>
            {event.insiderName !== "not found" ? (
              <p>
                <span className="font-semibold text-slate-950">Insider:</span>{" "}
                {event.insiderName}
              </p>
            ) : null}
            <p>
              <span className="font-semibold text-slate-950">Confidence:</span>{" "}
              {titleCaseConfidence(event.confidence)}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
