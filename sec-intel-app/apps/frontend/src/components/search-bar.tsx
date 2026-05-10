"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

import { isValidTicker, normalizeTickerInput } from "../lib/sec";

interface SearchBarProps {
  initialTicker?: string;
  compact?: boolean;
}

export function SearchBar({ initialTicker = "", compact = false }: SearchBarProps) {
  const router = useRouter();
  const [ticker, setTicker] = useState(initialTicker);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeTickerInput(ticker);

    if (!isValidTicker(normalized)) {
      setError("Enter a valid U.S. stock ticker.");
      return;
    }

    setError("");
    router.push(`/ticker/${normalized}`);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={[
          "rounded-[28px] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(12,51,46,0.12)] backdrop-blur",
          compact ? "p-3" : "p-4"
        ].join(" ")}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="h-5 w-5 text-slate-500" />
            <input
              aria-label="Ticker"
              value={ticker}
              onChange={(event) => setTicker(event.target.value)}
              placeholder="Enter ticker, like AAPL or NVDA"
              className="w-full border-0 bg-transparent font-medium text-slate-900 outline-none placeholder:text-slate-400"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-[22px] bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
          >
            Analyze ticker
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
    </form>
  );
}
