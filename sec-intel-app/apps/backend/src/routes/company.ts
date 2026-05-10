import type { FastifyInstance } from "fastify";
import { SecIntelService } from "../lib/service.js";

export async function registerCompanyRoutes(app: FastifyInstance): Promise<void> {
  const service = new SecIntelService();

  app.get("/api/company/:ticker", async (request) => {
    const params = request.params as { ticker: string };
    const query = (request.query ?? {}) as { refresh?: string };
    const refresh = query.refresh === "1" || query.refresh === "true";
    return service.getCompany(params.ticker, refresh);
  });
}
