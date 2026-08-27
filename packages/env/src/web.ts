import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";
import { sentryEnv, webSentryEnv } from "./sentry";

export const webEnv = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(1).optional(),
    SERVER_URL: z.url(),
    ...sentryEnv,
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.url(),
    NEXT_PUBLIC_SERVER_URL: z.url(),
    NEXT_PUBLIC_AUTH_BASE_PATH: z.string().min(1),
    ...webSentryEnv,
  },
  runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_AUTH_BASE_PATH: process.env.NEXT_PUBLIC_AUTH_BASE_PATH,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    SERVER_URL: process.env.SERVER_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ENV: process.env.SENTRY_ENV,
    SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE,
    SENTRY_PROFILES_SAMPLE_RATE: process.env.SENTRY_PROFILES_SAMPLE_RATE,
    SENTRY_DEBUG: process.env.SENTRY_DEBUG,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SENTRY_ENV: process.env.NEXT_PUBLIC_SENTRY_ENV,
    NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE,
    NEXT_PUBLIC_SENTRY_DEBUG: process.env.NEXT_PUBLIC_SENTRY_DEBUG,
  },
});
