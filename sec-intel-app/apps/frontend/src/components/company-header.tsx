import type { CompanyProfile, SplitEvent } from "../lib/types";

import { formatDate } from "../lib/format";

interface CompanyHeaderProps {
  company: CompanyProfile;
  splitHistory: SplitEvent[];
}

export function CompanyHeader({ company, splitHistory }: CompanyHeaderProps) {
  const latestSplit = splitHistory[0] ?? null;

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(12,51,46,0.12)] backdrop-blur md:p-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-800">
              {company.ticker}
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                {company.companyName}
              </h1>
              <p className="mt-2 max-w-3xl text-base text-slate-600 md:text-lg">
                Recent SEC filing intelligence focused on financing, dilution, offerings, repurchase activity, and split history.
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">CIK</dt>
              <dd className="mt-1 font-semibold text-slate-900">{company.cik}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">SIC</dt>
              <dd className="mt-1 font-semibold text-slate-900">{company.sic ?? "Not available"}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
              <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Fiscal Year End</dt>
              <dd className="mt-1 font-semibold text-slate-900">
                {company.fiscalYearEnd ?? "Not available"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Most Recent Split Event
            </p>
            {latestSplit ? (
              <div className="mt-3 space-y-2 text-sm leading-7 text-slate-700">
                <p>
                  <span className="font-semibold text-slate-950">
                    {latestSplit.splitType === "reverse_split" ? "Reverse split" : "Stock split"}:
                  </span>{" "}
                  {latestSplit.ratio} effective {formatDate(latestSplit.effectiveDate)}
                </p>
                <p>
                  <span className="font-semibold text-slate-950">Filed:</span>{" "}
                  {latestSplit.form} on {formatDate(latestSplit.filingDate)}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-slate-600">
                No recent split or reverse split was detected in the filing history reviewed.
              </p>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Split History
            </p>
            {splitHistory.length ? (
              <div className="mt-3 flex flex-col gap-2">
                {splitHistory.slice(0, 5).map((splitEvent, index) => (
                  <div
                    key={`${splitEvent.filingDate}-${splitEvent.ratio}-${index}`}
                    className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200"
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {splitEvent.splitType === "reverse_split" ? "Reverse split" : "Stock split"} {splitEvent.ratio}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Effective {formatDate(splitEvent.effectiveDate)} · Filed {splitEvent.form} on{" "}
                      {formatDate(splitEvent.filingDate)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-slate-600">
                No split history was detected in the recent filing set reviewed.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
