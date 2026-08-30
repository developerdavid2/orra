import { redisEnv } from "@orra/redis/client";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { baseServerEnv, sentryEnv } from "./server";

export const gatewayEnv = createEnv({
  server: {
    ...baseServerEnv,
    ...redisEnv,
    ...sentryEnv,
    PORT: z.coerce.number().default(4000),
    TRUSTED_ORIGINS: z.string().min(1),
    USER_SERVICE_URL: z.url(),
    PAYMENT_SERVICE_URL: z.url(),
    AI_SERVICE_URL: z.url(),
    NOTIFICATION_SERVICE_URL: z.url(),
    POLAR_ACCESS_TOKEN: z.string().optional(),
    POLAR_SERVER: z.enum(["sandbox", "production"]),
  },
  runtimeEnv: process.env,
});
