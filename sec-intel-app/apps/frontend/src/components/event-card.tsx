import { ExternalLink } from "lucide-react";

import type { AnalysisEvent } from "@sec-intel-app/shared";

import { confidenceTone, filingTone, formatDate, getEventLabel } from "../lib/format";

interface EventCardProps {
  event: AnalysisEvent;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <article className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_18px_50px_rgba(12,51,46,0.09)] backdrop-blur">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800 ring-1 ring-emerald-200">
                {getEventLabel(event.eventType)}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ${filingTone(event.form)}`}
              >
                {event.form}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ${confidenceTone(event.confidence)}`}
              >
                {event.confidence} confidence
              </span>
            </div>

            <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
              {event.title}
            </h3>
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

        <p className="text-base leading-7 text-slate-700">{event.summary}</p>

        <div className="grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Filing Date</p>
            <p className="mt-1 font-semibold text-slate-900">{formatDate(event.filingDate)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Amount</p>
            <p className="mt-1 font-semibold text-slate-900">{event.amount}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Securities</p>
            <p className="mt-1 font-semibold text-slate-900">{event.securities}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
            <p className="mt-1 font-semibold text-slate-900">{event.status}</p>
          </div>
        </div>

        <blockquote className="rounded-[24px] border border-emerald-100 bg-emerald-50/70 px-5 py-4 text-sm leading-7 text-emerald-950">
          {event.sourceSnippet}
        </blockquote>
      </div>
    </article>
  );
}
