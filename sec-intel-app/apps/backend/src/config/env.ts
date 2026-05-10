import { config } from "dotenv";
import { z } from "zod";

config();

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SEC_USER_AGENT: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  PORT: z.coerce.number().int().positive().default(4000)
});

export type Env = z.infer<typeof EnvSchema>;

export const env: Env = EnvSchema.parse(process.env);

