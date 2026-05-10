/* eslint-disable no-undef */
import type { AnalyzeResponse, CompanyProfile } from "@sec-intel-app/shared";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required.");
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
