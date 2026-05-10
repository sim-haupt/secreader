import Link from "next/link";
import { ArrowRight, Database, FileSearch, Radar } from "lucide-react";

import { SearchBar } from "@/components/search-bar";

const featureCards = [
  {
    title: "Capital-market event detection",
    description:
      "Flags buybacks, public offerings, shelf registrations, ATM programs, convertible debt, warrants, and dilution-related language.",
    icon: Radar
  },
  {
    title: "Official SEC sourcing",
    description:
      "Resolves the ticker to a CIK, pulls recent EDGAR filings, and links every event back to the original filing URL.",
    icon: FileSearch
  },
  {
    title: "Caching and traceability",
    description:
      "Stores company data, filing metadata, and extracted events in PostgreSQL so refreshes stay fast and source-grounded.",
    icon: Database
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between py-4">
        <div className="inline-flex items-center gap-3 rounded-full border border-white/70 bg-white/85 px-4 py-2 shadow-[0_12px_30px_rgba(12,51,46,0.08)] backdrop-blur">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="font-display text-sm font-semibold uppercase tracking-[0.22em] text-slate-800">
            SEC Intel
          </span>
        </div>
      </header>

      <section className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-emerald-700">
              Recent Filing Intelligence
            </p>
            <h1 className="max-w-4xl font-display text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Turn SEC filings into a capital-markets signal board.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Enter a U.S. stock ticker and get grounded, source-linked intelligence about buybacks,
              offerings, ATM programs, shelf registrations, dilution, and other financing events from
              recent EDGAR filings.
            </p>
          </div>

          <div className="max-w-2xl">
            <SearchBar />
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            {["AAPL", "TSLA", "NVDA", "PLTR", "RIVN"].map((ticker) => (
              <Link
                key={ticker}
                href={`/ticker/${ticker}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-4 py-2 font-medium transition hover:border-slate-300 hover:bg-white"
              >
                {ticker}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.title}
                className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(12,51,46,0.12)] backdrop-blur"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                      {card.title}
                    </h2>
                    <p className="mt-3 text-base leading-7 text-slate-600">{card.description}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
