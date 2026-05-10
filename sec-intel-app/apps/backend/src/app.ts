import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";

import { env } from "./config/env.js";
import { AppError } from "./lib/http.js";
import { registerAnalyzeRoutes } from "./routes/analyze.js";
import { registerCompanyRoutes } from "./routes/company.js";
import { registerFilingsRoutes } from "./routes/filings.js";

export async function createApp() {
  const app = Fastify({
    logger: true,
    requestTimeout: 60_000
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
  });

  await app.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute"
  });

  app.get("/health", async () => ({ status: "ok" }));

  await registerCompanyRoutes(app);
  await registerFilingsRoutes(app);
  await registerAnalyzeRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    if (error instanceof AppError) {
      reply.status(error.statusCode).send({
        error: error.message
      });
      return;
    }

    reply.status(500).send({
      error: "Internal server error."
    });
  });

  return app;
}
