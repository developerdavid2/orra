import { z } from "zod";
import { baseServerEnv, sentryEnv } from "./server";

const schema = z.object({
  ...baseServerEnv,
  ...sentryEnv,
  PORT: z.coerce.number().default(4001),
  PLAID_CLIENT_ID: z.string().min(1),
  PLAID_SECRET: z.string().min(1),
  PLAID_ENV: z.enum(["sandbox", "development", "production"]),
  ENCRYPTION_KEY: z.string().min(1),
  MONO_SECRET_KEY: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid payment-service env:", parsed.error.flatten());
  process.exit(1);
}

export const paymentServiceEnv = parsed.data;
