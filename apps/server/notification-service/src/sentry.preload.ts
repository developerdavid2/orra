import { notificationsServiceEnv } from "@orra/env/notifications";
import { initSentryServer } from "@orra/sentry";

initSentryServer({
  dsn: notificationsServiceEnv.SENTRY_DSN!,
  environment: notificationsServiceEnv.SENTRY_ENV || "development",
  serviceName: "notification-service",
  tracesSampleRate: notificationsServiceEnv.SENTRY_TRACES_SAMPLE_RATE ?? 0.2,
  profilesSampleRate:
    notificationsServiceEnv.SENTRY_PROFILES_SAMPLE_RATE ?? 0.1,
  debug: notificationsServiceEnv.SENTRY_DEBUG ?? false,
  release: process.env.APP_VERSION,
});
