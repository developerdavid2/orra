import { initSentryServer } from "@orra/sentry";
import type { FastifyInstance, FastifyServerOptions } from "fastify";
import { router } from "./routes.js";

initSentryServer({
  dsn: process.env.SENTRY_DSN!,
  environment: process.env.SENTRY_ENV || "development",
  serviceName: "payment-service",
  tracesSampleRate: 0.2,
  profilesSampleRate: 0.1,
  debug: process.env.SENTRY_DEBUG === "true",
  release: process.env.APP_VERSION,
});

async function app(instance: FastifyInstance, _: FastifyServerOptions) {
  instance.get("/", async () => {
    return { status: "alive", message: "Welcome to Payment Service Root" };
  });

  await instance.register(router, { prefix: "/" });
}

export default app;
