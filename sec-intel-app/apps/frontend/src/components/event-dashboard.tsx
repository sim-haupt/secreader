"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import type { AnalyzeResponse, CompanyProfile, EventType } from "../lib/types";

import { CompanyHeader } from "./company-header";
import { EventCard } from "./event-card";
import { FilingsTable } from "./filings-table";
import { SearchBar } from "./search-bar";
import { formatDateTimeUtc, getEventLabel } from "../lib/format";

interface EventDashboardProps {
  analysis: AnalyzeResponse;
  company: CompanyProfile;
}

export function EventDashboard({ analysis, company }: EventDashboardProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<"ALL" | EventType>("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [showFilings, setShowFilings] = useState(false);

  const availableTypes = Array.from(
    new Set(
      analysis.events
        .map((event) => event.eventType)
        .filter((eventType) => eventType !== "NONE_FOUND")
    )
  );

  const visibleEvents =
    filter === "ALL"
      ? analysis.events.filter((event) => event.eventType !== "NONE_FOUND")
      : analysis.events.filter((event) => event.eventType === filter);

  const hasDetectedEvents = analysis.events.some((event) => event.eventType !== "NONE_FOUND");

  function refreshAnalysis() {
    setRefreshing(true);
    router.push(`/ticker/${analysis.ticker}?refresh=1&ts=${Date.now()}`);
  }

  return (
    <div className="space-y-8">
      <SearchBar initialTicker={analysis.ticker} compact />

      <CompanyHeader company={company} />

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(12,51,46,0.09)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Capital-Markets Intelligence
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
              Short-term float and price signals
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Plain-English readout of recent SEC events that may affect float, dilution, financing risk, or near-term price action. Analyzed at {formatDateTimeUtc(analysis.analyzedAt)}.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as "ALL" | EventType)}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 outline-none"
            >
              <option value="ALL">All event types</option>
              {availableTypes.map((eventType) => (
                <option key={eventType} value={eventType}>
                  {getEventLabel(eventType)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={refreshAnalysis}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh from SEC
            </button>
          </div>
        </div>
      </section>

      {hasDetectedEvents ? (
        <section className="grid gap-5">
          {visibleEvents.length ? (
            visibleEvents.map((event, index) => (
              <EventCard key={`${event.accessionNumber}-${event.eventType}-${index}`} event={event} />
            ))
          ) : (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-600">
              No events match the selected filter.
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-[32px] border border-dashed border-slate-300 bg-white/85 p-10 text-center shadow-[0_18px_50px_rgba(12,51,46,0.06)]">
          <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
            No relevant recent events found
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
            No obvious recent signal for dilution, offerings, buybacks, or financing events was found in the filings reviewed.
          </p>
        </section>
      )}

      <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(12,51,46,0.09)] backdrop-blur md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
              Raw filings
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Optional detail view if you want to inspect the underlying SEC filings yourself.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowFilings((current) => !current)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {showFilings ? "Hide filings" : "Show filings"}
          </button>
        </div>

        {showFilings ? <div className="mt-6"><FilingsTable filings={analysis.recentFilings} /></div> : null}
      </section>
    </div>
  );
}
