import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { DEFAULT_FILING_LIMIT, normalizeTickerInput } from "@sec-intel-app/shared";

import { SecIntelService } from "../lib/service.js";

const FilingsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(50).default(DEFAULT_FILING_LIMIT),
  forms: z.string().optional(),
  refresh: z.string().optional()
});

function parseForms(forms?: string): string[] | undefined {
  if (!forms) {
    return undefined;
  }

  const parsed = forms
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);

  return parsed.length ? parsed : undefined;
}

export async function registerFilingsRoutes(app: FastifyInstance): Promise<void> {
  const service = new SecIntelService();

  app.get("/api/filings/:ticker", async (request) => {
    const params = request.params as { ticker: string };
    const query = FilingsQuerySchema.parse(request.query ?? {});
    const response = await service.getFilings(
      normalizeTickerInput(params.ticker),
      query.limit,
      parseForms(query.forms),
      query.refresh === "1" || query.refresh === "true"
    );

    return response;
  });
}
