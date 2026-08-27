import { createExpressApp } from "@orra/config/express-config";
import { aiServiceEnv } from "@orra/env/ai-service";
import * as trpcExpress from "@trpc/server/adapters/express";
import { aiRouter } from "./routers";
import { chatStreamHandler } from "./routers/chat-stream.router";
import { createContext } from "./trpc/context";

const PORT = Number(aiServiceEnv.PORT) || 4003;

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
