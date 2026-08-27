import { aiServiceEnv } from "@orra/env/ai-service";
import { initSentryServer } from "@orra/sentry";

initSentryServer({
  dsn: aiServiceEnv.SENTRY_DSN!,
  environment: aiServiceEnv.SENTRY_ENV || "development",
  serviceName: "ai-service",
  tracesSampleRate: aiServiceEnv.SENTRY_TRACES_SAMPLE_RATE ?? 0.2,
  profilesSampleRate: aiServiceEnv.SENTRY_PROFILES_SAMPLE_RATE ?? 0.1,
  debug: aiServiceEnv.SENTRY_DEBUG ?? false,
  release: process.env.APP_VERSION,
});