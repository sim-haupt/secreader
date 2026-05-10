import type { CompanyProfile } from "../lib/types";

interface CompanyHeaderProps {
  company: CompanyProfile;
}

export function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(12,51,46,0.12)] backdrop-blur md:p-8">
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
              Recent SEC filing intelligence focused on financing, dilution, offerings, and
              repurchase activity.
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
    </section>
  );
}
