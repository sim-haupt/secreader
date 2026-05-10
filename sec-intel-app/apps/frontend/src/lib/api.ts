/* eslint-disable no-undef */
import type { AnalyzeResponse, CompanyProfile } from "./types";

function getApiBaseUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is required.");
  }

  return apiBaseUrl;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Backend request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function analyzeTicker(
  ticker: string,
  refresh = false
): Promise<AnalyzeResponse> {
  return apiRequest<AnalyzeResponse>("/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      ticker,
      refresh
    })
  });
}

export async function getCompany(
  ticker: string,
  refresh = false
): Promise<CompanyProfile> {
  const query = refresh ? "?refresh=1" : "";
  return apiRequest<CompanyProfile>(`/api/company/${ticker}${query}`);
}
