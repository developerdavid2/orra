import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { baseServerEnv, sentryEnv } from "./server";

export const aiServiceEnv = createEnv({
  server: {
    ...baseServerEnv,
    ...sentryEnv,
    PORT: z.coerce.number().default(4003),
    GROQ_API_KEY: z.string().optional(),
    OPENROUTER_API_KEY: z.string().optional(),
    AI_GATEWAY_API_KEY: z.string().optional(),
  },
  runtimeEnv: process.env,
});
