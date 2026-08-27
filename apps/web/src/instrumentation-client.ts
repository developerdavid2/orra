import * as Sentry from "@sentry/nextjs";
import { webEnv } from "@orra/env/web";
import { scrubEvent } from "@orra/sentry/client";

if (webEnv.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: webEnv.NEXT_PUBLIC_SENTRY_DSN,
    environment: webEnv.NEXT_PUBLIC_SENTRY_ENV || "development",
    tracesSampleRate: webEnv.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
    profilesSampleRate: webEnv.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE ?? 0.1,
    debug: webEnv.NEXT_PUBLIC_SENTRY_DEBUG ?? false,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend(event) {
      if (process.env.NODE_ENV === "development") {
        return event;
      }
      return scrubEvent(event);
    },
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "Network request failed",
      "hydration",
    ],
  });
}
