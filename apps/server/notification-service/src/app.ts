import { createExpressApp } from "@orra/config/express-config";
import { notificationsServiceEnv } from "@orra/env/notifications";
import { initSentryServer } from "@orra/sentry";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { notificationsRouter } from "./routers";
import { startNotificationWorker } from "./services/bullmq.service";
import { createContext } from "./trpc/context";

const PORT = Number(notificationsServiceEnv.PORT) || 4004;

// Initialize Sentry for Notification Service
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

const app = createExpressApp({
  serviceName: "notification-service",
  port: PORT,
});

app.use("/trpc/appNotifications.onNew", (req, res, next) => {
  res.setHeader("x-accel-buffering", "no");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  req.socket.on("error", () => {});
  res.on("error", () => {});
  next();
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: notificationsRouter,
    createContext,
  }),
);

app.listen(PORT, () => {
  console.log(`🔔 notification-service on http://localhost:${PORT}`);
  startNotificationWorker();
});

export default app;
