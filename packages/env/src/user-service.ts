import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import { baseServerEnv, authEnv, sentryEnv } from "./server";

export const userServiceEnv = createEnv({
  server: {
    ...baseServerEnv,
    ...authEnv,
    ...sentryEnv,
    AUTH_PUBLIC_URL: z.url(),
    PORT: z.coerce.number().default(4001),
    TRUSTED_ORIGINS: z.string().min(1),
    UPLOADTHING_TOKEN: z.string().min(1),
    SMTP_HOST: z.string().min(1),
    SMTP_PORT: z.coerce.number().default(587),
    SMTP_USER: z.email(),
    SMTP_PASS: z.string().min(1),
  },
  runtimeEnv: process.env,
});
