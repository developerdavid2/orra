import { createExpressApp } from "@orra/config/express-config";
import { gatewayEnv } from "@orra/env/gateway";
import { setupExpressErrorHandler } from "@orra/sentry";
import { authMiddleware } from "./middleware/auth.middleware";
import { errorHandler } from "./middleware/error.middleware";
import { requestLogger } from "./middleware/logger.middleware";
import {
  authRateLimit,
  globalRateLimit,
  plaidRateLimit,
} from "./middleware/rate-limit.middleware";
import {
  mountAiSdkChatStreamProxy,
  mountProxies,
  mountUploadThingProxy,
} from "./proxy";

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
app.use(globalRateLimit);

app.use("/v1/auth", authRateLimit);
app.use("/v1/trpc/payments.plaid", plaidRateLimit);

app.use(authMiddleware);
mountProxies(app);

setupExpressErrorHandler(app);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 api-gateway-service running on http://localhost:${PORT}`);
});

export default app;
