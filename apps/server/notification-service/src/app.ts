import { createExpressApp } from "@orra/config/express-config";
import { notificationsServiceEnv } from "@orra/env/notifications";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { notificationsRouter } from "./routers";
import { startNotificationWorker } from "./services/bullmq.service";
import { createContext } from "./trpc/context";

const PORT = Number(notificationsServiceEnv.PORT) || 4004;

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
