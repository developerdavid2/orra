import * as Sentry from "@sentry/nextjs";
import { webEnv } from "@orra/env/web";

if (webEnv.SENTRY_DSN) {
  Sentry.init({
    dsn: webEnv.SENTRY_DSN,
    environment: webEnv.SENTRY_ENV || "development",
    tracesSampleRate: webEnv.SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
    debug: webEnv.SENTRY_DEBUG ?? false,
  });
}
