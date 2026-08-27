import { initSentryServer } from "@orra/sentry";

initSentryServer({
  dsn: process.env.SENTRY_DSN!,
  environment: process.env.SENTRY_ENV || "development",
  serviceName: "payment-service",
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
  debug: process.env.SENTRY_DEBUG === "true",
  release: process.env.APP_VERSION,
});