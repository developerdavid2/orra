import { createExpressApp } from "@orra/config/express-config";
import { aiServiceEnv } from "@orra/env/ai-service";
import { initSentryServer } from "@orra/sentry";
import * as trpcExpress from "@trpc/server/adapters/express";
import { aiRouter } from "./routers";
import { chatStreamHandler } from "./routers/chat-stream.router";
import { createContext } from "./trpc/context";

const PORT = Number(aiServiceEnv.PORT) || 4003;

initSentryServer({
  dsn: aiServiceEnv.SENTRY_DSN!,
  environment: aiServiceEnv.SENTRY_ENV || "development",
  serviceName: "ai-service",
  tracesSampleRate: aiServiceEnv.SENTRY_TRACES_SAMPLE_RATE ?? 0.2,
  profilesSampleRate: aiServiceEnv.SENTRY_PROFILES_SAMPLE_RATE ?? 0.1,
  debug: aiServiceEnv.SENTRY_DEBUG ?? false,
  release: process.env.APP_VERSION,
});

const app = createExpressApp({ serviceName: "ai-service", port: PORT });

app.post("/chat/stream", chatStreamHandler);

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: aiRouter,
    createContext,
    onError({ path, error }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[tRPC ai-service] error on /${path}:`, error.message);
      }
    },
  }),
);

app.listen(PORT, () => {
  console.log(`🤖 ai-service running on http://localhost:${PORT}`);
});

export default app;
