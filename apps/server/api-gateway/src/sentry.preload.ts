import { gatewayEnv } from "@orra/env/gateway";
import { initSentryServer } from "@orra/sentry";

initSentryServer({
  dsn: gatewayEnv.SENTRY_DSN!,
  environment: gatewayEnv.SENTRY_ENV || "development",
  serviceName: "api-gateway",
  tracesSampleRate: gatewayEnv.SENTRY_TRACES_SAMPLE_RATE ?? 0.2,
  profilesSampleRate: gatewayEnv.SENTRY_PROFILES_SAMPLE_RATE ?? 0.1,
  debug: gatewayEnv.SENTRY_DEBUG ?? false,
  release: process.env.APP_VERSION,
});