import { Pool, type PoolClient, type QueryResultRow } from "pg";

import { env } from "../config/env.js";

function shouldUseSsl(databaseUrl: string): boolean {
  return !/(localhost|127\.0\.0\.1)/i.test(databaseUrl);
}

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: shouldUseSsl(env.DATABASE_URL) ? { rejectUnauthorized: false } : undefined
});

export async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const result = await pool.query<T>(text, values);
  return result.rows;
}

export async function withTransaction<T>(
  work: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

