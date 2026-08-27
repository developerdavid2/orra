import * as Sentry from "@sentry/nextjs";
import { webEnv } from "@orra/env/web";

if (webEnv.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: webEnv.NEXT_PUBLIC_SENTRY_DSN,
    environment: webEnv.NEXT_PUBLIC_SENTRY_ENV || "development",
    tracesSampleRate: webEnv.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
    debug: webEnv.NEXT_PUBLIC_SENTRY_DEBUG ?? false,
  });
}
