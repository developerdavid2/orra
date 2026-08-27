import "dotenv/config";

import { userServiceEnv } from "@orra/env/user-service";
import { initSentryServer } from "@orra/sentry";

initSentryServer({
  dsn: userServiceEnv.SENTRY_DSN!,
  environment: userServiceEnv.SENTRY_ENV || "development",
  serviceName: "user-service",
  tracesSampleRate: userServiceEnv.SENTRY_TRACES_SAMPLE_RATE ?? 0.2,
  profilesSampleRate: userServiceEnv.SENTRY_PROFILES_SAMPLE_RATE ?? 0.1,
  debug: userServiceEnv.SENTRY_DEBUG ?? false,
  release: process.env.APP_VERSION,
});