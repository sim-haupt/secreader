import { ExternalLink } from "lucide-react";

import type { FilingRecord } from "@sec-intel-app/shared";

import { filingTone, formatDate } from "../lib/format";

interface FilingsTableProps {
  filings: FilingRecord[];
}

export function FilingsTable({ filings }: FilingsTableProps) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_rgba(12,51,46,0.09)] backdrop-blur md:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
            Recent SEC filings
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Source filings used for the capital-markets intelligence summaries.
          </p>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-[24px] border border-slate-200 lg:block">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <th className="px-5 py-4">Date</th>
              <th className="px-5 py-4">Form</th>
              <th className="px-5 py-4">Description</th>
              <th className="px-5 py-4">Accession</th>
              <th className="px-5 py-4">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filings.map((filing) => (
              <tr key={filing.accessionNumber} className="align-top">
                <td className="px-5 py-4 text-sm font-medium text-slate-900">
                  {formatDate(filing.filingDate)}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ${filingTone(filing.form)}`}
                  >
                    {filing.form}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  {filing.description || "Recent SEC filing"}
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{filing.accessionNumber}</td>
                <td className="px-5 py-4">
                  <a
                    href={filing.secUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Open
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4 lg:hidden">
        {filings.map((filing) => (
          <article
            key={filing.accessionNumber}
            className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{formatDate(filing.filingDate)}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {filing.description || "Recent SEC filing"}
                </p>
              </div>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ring-1 ${filingTone(filing.form)}`}
              >
                {filing.form}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-500">{filing.accessionNumber}</span>
              <a
                href={filing.secUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-emerald-700"
              >
                SEC filing
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
