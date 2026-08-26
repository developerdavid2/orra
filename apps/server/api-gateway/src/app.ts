import { createExpressApp } from "@orra/config/express-config";
import { gatewayEnv } from "@orra/env/gateway";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { requestLogger } from "./middleware/logger.middleware";
import { initSentryServer } from '@orra/sentry/server';
import {
  mountAiSdkChatStreamProxy,
  mountProxies,
  mountUploadThingProxy,
} from "./proxy";

const PORT = Number(gatewayEnv.PORT) || 4000;

// Initialize Sentry for API Gateway
initSentryServer({
  dsn: gatewayEnv.SENTRY_DSN!,
  environment: gatewayEnv.SENTRY_ENV || 'development',
  serviceName: 'api-gateway',
  tracesSampleRate: gatewayEnv.SENTRY_TRACES_SAMPLE_RATE ?? 0.2,
  profilesSampleRate: gatewayEnv.SENTRY_PROFILES_SAMPLE_RATE ?? 0.1,
  debug: gatewayEnv.SENTRY_DEBUG ?? false,
  release: process.env.APP_VERSION,
});

const PORT = Number(gatewayEnv.PORT) || 4000;

const app = createExpressApp({
  serviceName: "api-gateway-service",
  port: PORT,
  allowedOrigins: gatewayEnv.TRUSTED_ORIGINS,
  beforeBodyParser: (app) => {
    app.use("/v1/ai/chat/stream", authMiddleware);
    mountAiSdkChatStreamProxy(app);
    mountUploadThingProxy(app);
  },
});
app.use(requestLogger);

app.use(authMiddleware);
mountProxies(app);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 api-gateway-service running on http://localhost:${PORT}`);
});

export default app;