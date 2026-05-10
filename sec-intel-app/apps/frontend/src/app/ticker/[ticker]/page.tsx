import { isValidTicker, normalizeTickerInput } from "../../../lib/sec";

import { EventDashboard } from "../../../components/event-dashboard";
import { SearchBar } from "../../../components/search-bar";
import { analyzeTicker, getCompany } from "../../../lib/api";

interface TickerPageProps {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ refresh?: string }>;
}

export default async function TickerPage({ params, searchParams }: TickerPageProps) {
  const { ticker } = await params;
  const { refresh } = await searchParams;
  const normalizedTicker = normalizeTickerInput(ticker);

  if (!isValidTicker(normalizedTicker)) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <SearchBar initialTicker={normalizedTicker} compact />
        <div className="mt-8 rounded-[32px] border border-rose-200 bg-white/90 p-8 text-slate-700 shadow-[0_20px_60px_rgba(12,51,46,0.08)]">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
            Invalid ticker
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Enter a valid U.S. stock ticker using letters, periods, or dashes.
          </p>
        </div>
      </div>
    );
  }

  try {
    const refreshRequested = refresh === "1";
    const [analysis, company] = await Promise.all([
      analyzeTicker(normalizedTicker, refreshRequested),
      getCompany(normalizedTicker, refreshRequested)
    ]);

    return (
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <EventDashboard analysis={analysis} company={company} />
      </div>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load SEC analysis.";

    return (
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">
        <SearchBar initialTicker={normalizedTicker} compact />
        <div className="mt-8 rounded-[32px] border border-rose-200 bg-white/90 p-8 shadow-[0_20px_60px_rgba(12,51,46,0.08)]">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
            SEC analysis unavailable
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600">{message}</p>
        </div>
      </div>
    );
  }
}
