import { pool } from "./lib/database.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = await createApp();

try {
  await app.listen({
    host: "0.0.0.0",
    port: env.PORT
  });
} catch (error) {
  app.log.error(error);
  await pool.end();
  process.exit(1);
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await app.close();
    await pool.end();
    process.exit(0);
  });
}

