import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { baseServerEnv, sentryEnv } from "./server";

export const notificationsServiceEnv = createEnv({
  server: {
    ...baseServerEnv,
    ...sentryEnv,
    PORT: z.coerce.number().default(4004),
    FCM_SERVICE_ACCOUNT: z.string().min(1),
    REDIS_URL: z.string().min(1),
  },
  runtimeEnv: process.env,
});
