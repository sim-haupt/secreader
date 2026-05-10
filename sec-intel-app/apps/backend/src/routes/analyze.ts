import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { DEFAULT_FILING_LIMIT } from "@sec-intel-app/shared";

import { SecIntelService } from "../lib/service.js";

const AnalyzeBodySchema = z.object({
  ticker: z.string().min(1),
  limit: z.number().int().positive().max(50).optional().default(DEFAULT_FILING_LIMIT),
  refresh: z.boolean().optional().default(false)
});

export async function registerAnalyzeRoutes(app: FastifyInstance): Promise<void> {
  const service = new SecIntelService();

  app.post("/api/analyze", async (request) => {
    const body = AnalyzeBodySchema.parse(request.body);
    return service.analyzeTicker(body);
  });
}

