export default function TickerLoading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="space-y-6">
        <div className="rounded-[32px] border border-white/70 bg-white/90 p-8 text-center shadow-[0_20px_60px_rgba(12,51,46,0.09)] backdrop-blur">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
          <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-slate-950">
            Reading SEC filings
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Pulling recent filings, checking for offerings, buybacks, insider selling, warrants,
            and split history. This can take a few seconds.
          </p>
        </div>
        <div className="h-56 animate-pulse rounded-[32px] bg-white/80" />
        <div className="h-40 animate-pulse rounded-[32px] bg-white/80" />
        <div className="h-64 animate-pulse rounded-[32px] bg-white/80" />
      </div>
    </div>
  );
}
