import type { FinancialSnapshot } from "../lib/types";

import { formatDate, formatMetric } from "../lib/format";

interface FinancialHealthProps {
  financialSnapshot: FinancialSnapshot;
}

function MetricCard({
  title,
  value,
  asOf
}: {
  title: string;
  value: string;
  asOf: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">As of {formatDate(asOf)}</p>
    </div>
  );
}

export function FinancialHealth({ financialSnapshot }: FinancialHealthProps) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(12,51,46,0.09)] backdrop-blur md:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
          Financial Health
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
          Basic reported company numbers
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          This is a quick SEC-based snapshot for context. Public float may be missing for some issuers.
          If float is unavailable, use shares outstanding as a rough size reference.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title={financialSnapshot.revenue.label}
          value={formatMetric(financialSnapshot.revenue)}
          asOf={financialSnapshot.revenue.asOf}
        />
        <MetricCard
          title={financialSnapshot.netIncome.label}
          value={formatMetric(financialSnapshot.netIncome)}
          asOf={financialSnapshot.netIncome.asOf}
        />
        <MetricCard
          title={financialSnapshot.cash.label}
          value={formatMetric(financialSnapshot.cash)}
          asOf={financialSnapshot.cash.asOf}
        />
        <MetricCard
          title={financialSnapshot.totalDebt.label}
          value={formatMetric(financialSnapshot.totalDebt)}
          asOf={financialSnapshot.totalDebt.asOf}
        />
        <MetricCard
          title={financialSnapshot.publicFloat.label}
          value={formatMetric(financialSnapshot.publicFloat)}
          asOf={financialSnapshot.publicFloat.asOf}
        />
        <MetricCard
          title={financialSnapshot.sharesOutstanding.label}
          value={formatMetric(financialSnapshot.sharesOutstanding)}
          asOf={financialSnapshot.sharesOutstanding.asOf}
        />
      </div>
    </section>
  );
}

