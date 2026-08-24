import { gatewayEnv } from "@orra/env/gateway";
import type { Express, NextFunction, Request, Response } from "express";
import proxy from "express-http-proxy";
import { createProxyMiddleware } from "http-proxy-middleware";
import { logger } from "../utils/logger";

// ── Error handler
const proxyError = (err: Error, res: Response, _next: NextFunction) => {
  logger.error(`Proxy error: ${err.message}`);
  if (res.headersSent) {
    res.end();
    return;
  }
  res.status(502).json({ success: false, message: "Service unavailable" });
};

// ── Header decorators
// Used for protected routes — injects verified user id so downstream
const withUserId = (proxyReqOpts: any, srcReq: Request) => {
  proxyReqOpts.headers ??= {};
  proxyReqOpts.headers["content-type"] = "application/json";
  proxyReqOpts.headers["origin"] = gatewayEnv.TRUSTED_ORIGINS;
  proxyReqOpts.headers["x-internal-source"] = "api-gateway";

  // Enforce lowercase lookups for proxy mapping safety
  const userId = srcReq.headers["x-user-id"] || (srcReq as any).user?.id;
  const userEmail =
    srcReq.headers["x-user-email"] || (srcReq as any).user?.email;
  const userName = srcReq.headers["x-user-name"] || (srcReq as any).user?.name;
  const planTier =
    srcReq.headers["x-user-plan-tier"] || (srcReq as any).user?.planTier;

  if (userId) proxyReqOpts.headers["x-user-id"] = String(userId);
  if (userEmail) proxyReqOpts.headers["x-user-email"] = String(userEmail);
  if (userName) proxyReqOpts.headers["x-user-name"] = String(userName);
  if (planTier) proxyReqOpts.headers["x-user-plan-tier"] = String(planTier);

  // Ensure cookies are correctly passed down so Better Auth fallback works
  proxyReqOpts.headers["cookie"] = srcReq.headers.cookie ?? "";

  // Forward original host information so downstream Better Auth doesn't fail origin check
  proxyReqOpts.headers["x-forwarded-host"] =
    srcReq.headers["x-forwarded-host"] || srcReq.headers["host"] || "";
  proxyReqOpts.headers["x-forwarded-proto"] =
    srcReq.headers["x-forwarded-proto"] || "https";

  return proxyReqOpts;
};

function trpcNamespaceProxy(app: Express) {
  const NAMESPACE_MAP: Record<string, string> = {
    users: gatewayEnv.USER_SERVICE_URL,
    payments: gatewayEnv.PAYMENT_SERVICE_URL,
    ai: gatewayEnv.AI_SERVICE_URL,
    notifications: gatewayEnv.NOTIFICATION_SERVICE_URL,
  };

  app.use("/v1/trpc", (req: Request, res: Response, next: NextFunction) => {
    const rawPath = req.url.split("?")[0]?.replace(/^\//, "") ?? "";
    const firstProcedure = rawPath.split(",")[0] ?? "";
    const namespace = firstProcedure.split(".")[0] ?? "";
    const isNotificationSubscription =
      namespace === "notifications" &&
      firstProcedure === "notifications.appNotifications.onNew";
    const isAiChatSubscription =
      namespace === "ai" && firstProcedure === "ai.coach.streamChat";

    if (isNotificationSubscription || isAiChatSubscription) {
      return next();
    }

    const targetURL = NAMESPACE_MAP[namespace];

    if (!targetURL) {
      res.status(404).json({
        success: false,
        message: `Unknown tRPC namespace: "${namespace}"`,
      });
      return;
    }

    logger.info(`[tRPC proxy] ${req.method} ${namespace} → ${targetURL}`);

    proxy(targetURL, {
      proxyErrorHandler: proxyError,
      timeout: 35000,
      proxyReqPathResolver: (r) => {
        const url = new URL(`http://x${r.url}`);
        const stripped = url.pathname
          .replace(/^\//, "")
          .split(",")
          .map((proc) =>
            proc.startsWith(`${namespace}.`)
              ? proc.slice(namespace.length + 1)
              : proc,
          )
          .join(",");

        const query = url.search;
        return `/trpc/${stripped}${query}`;
      },
      proxyReqOptDecorator: withUserId,
      userResHeaderDecorator: (
        headers,
        _userReq,
        _userRes,
        _proxyReq,
        proxyRes,
      ) => {
        const setCookie = proxyRes.headers["set-cookie"];
        if (setCookie) {
          const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
          headers["set-cookie"] = cookies.map((cookie) =>
            cookie
              .replace(/;\s*Domain=[^;]*/gi, "")
              .replace(/;\s*SameSite=Lax/gi, "; SameSite=None")
              .concat("; Partitioned"),
          );
        }
        return headers;
      },
      userResDecorator: (_proxyRes, proxyResData) => {
        logger.info(`[tRPC proxy] response from ${namespace}-service`);
        return proxyResData;
      },
    })(req, res, next);
  });
}

export function mountAiSdkChatStreamProxy(app: Express) {
  app.use(
    "/v1/ai/chat/stream",
    createProxyMiddleware({
      target: gatewayEnv.AI_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: (path) => {
        const queryIndex = path.indexOf("?");
        const query = queryIndex >= 0 ? path.slice(queryIndex) : "";
        return `/chat/stream${query}`;
      },
      selfHandleResponse: false,
      on: {
        proxyReq: (proxyReq, req) => {
          proxyReq.setHeader("x-internal-source", "api-gateway");
          proxyReq.setHeader("cookie", (req as Request).headers.cookie ?? "");
          const userId = (req as Request).headers["x-user-id"];
          const userEmail = (req as Request).headers["x-user-email"];
          const userName = (req as Request).headers["x-user-name"];
          if (userId) proxyReq.setHeader("x-user-id", userId);
          if (userEmail) proxyReq.setHeader("x-user-email", userEmail);
          if (userName) proxyReq.setHeader("x-user-name", userName);
          proxyReq.setHeader("x-accel-buffering", "no");
          proxyReq.setHeader("accept", "text/event-stream");
          proxyReq.on("error", () => {});
        },
        proxyRes: (proxyRes, req, res) => {
          proxyRes.headers["x-accel-buffering"] = "no";
          (res as Response).setHeader("x-accel-buffering", "no");
          if (!(res as Response).getHeader("cache-control")) {
            (res as Response).setHeader(
              "cache-control",
              "no-cache, no-transform",
            );
          }
          (req as Request).socket?.on("error", () => {});
          proxyRes.on("error", () => {});
        },
        error: (err, _req, res) => {
          logger.error(`[ai-sdk-chat proxy] error: ${err.message}`);
          const response = res as Response;
          if (response.headersSent) {
            response.end();
            return;
          }
          (res as Response)
            .status(502)
            .json({ error: "AI SDK stream service unavailable" });
        },
      },
    }),
  );
}

export function mountNotificationStreamProxy(app: Express) {
  app.use(
    "/v1/trpc/notifications.appNotifications.onNew",
    createProxyMiddleware({
      target: gatewayEnv.NOTIFICATION_SERVICE_URL,
      changeOrigin: true,
      ws: true,
      pathRewrite: (path) => {
        const queryIndex = path.indexOf("?");
        const query = queryIndex >= 0 ? path.slice(queryIndex) : "";
        return `/trpc/appNotifications.onNew${query}`;
      },
      selfHandleResponse: false,
      on: {
        proxyReq: (proxyReq, req) => {
          proxyReq.setHeader("x-internal-source", "api-gateway");
          proxyReq.setHeader("cookie", (req as Request).headers.cookie ?? "");
          // Disable buffering on the upstream request
          proxyReq.setHeader("x-accel-buffering", "no");
          const userId = (req as Request).headers["x-user-id"];
          const userEmail = (req as Request).headers["x-user-email"];
          const userName = (req as Request).headers["x-user-name"];
          if (userId) proxyReq.setHeader("x-user-id", userId);
          if (userEmail) proxyReq.setHeader("x-user-email", userEmail);
          if (userName) proxyReq.setHeader("x-user-name", userName);
          // A client that navigates away resets the SSE socket — swallow it
          proxyReq.on("error", () => {});
        },
        proxyRes: (proxyRes, req, res) => {
          // Force streaming response
          proxyRes.headers["x-accel-buffering"] = "no";
          (res as Response).setHeader("x-accel-buffering", "no");
          // Guard both ends so an SSE disconnect can't throw ECONNRESET
          (req as Request).socket?.on("error", () => {});
          proxyRes.on("error", () => {});
        },
        error: (err, _req, res) => {
          // ECONNRESET here is a normal SSE client disconnect, not a failure
          if ((err as NodeJS.ErrnoException).code === "ECONNRESET") {
            logger.debug?.(`[notifications proxy] client disconnected`);
            return;
          }
          logger.error(`[notifications proxy] error: ${err.message}`);
          const response = res as Response;
          if (response.headersSent) {
            response.end();
            return;
          }
          (res as Response)
            .status(502)
            .json({ error: "Notification service unavailable" });
        },
      },
    }),
  );
}

export function mountUploadThingProxy(app: Express) {
  app.use(
    "/v1/uploadthing",
    createProxyMiddleware({
      target: gatewayEnv.USER_SERVICE_URL,
      changeOrigin: true,
      pathRewrite: (path) => {
        const [, query] = path.split("?");
        return `/api/uploadthing${query ? `?${query}` : ""}`;
      },
      on: {
        error: (err, _req, res) => {
          logger.error(`[uploadthing proxy] error: ${err.message}`);
          const response = res as Response;
          if (response.headersSent) {
            response.end();
            return;
          }
          (res as Response)
            .status(502)
            .json({ success: false, message: "Upload service unavailable" });
        },
      },
    }),
  );
}
export function mountProxies(app: Express) {
  mountNotificationStreamProxy(app);

  // In mountProxies — auth proxy
  app.use(
    "/v1/auth",
    proxy(gatewayEnv.USER_SERVICE_URL, {
      proxyErrorHandler: proxyError,
      proxyReqPathResolver: (req) => `/api/auth${req.url}`,
      proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers ??= {};
        proxyReqOpts.headers["Content-Type"] = "application/json";
        proxyReqOpts.headers["x-internal-source"] = "api-gateway";
        proxyReqOpts.headers["x-forwarded-host"] =
          srcReq.headers["x-forwarded-host"] ?? srcReq.headers["host"] ?? "";
        proxyReqOpts.headers["x-forwarded-proto"] =
          (srcReq.headers["x-forwarded-proto"] as string) ?? "https";
        proxyReqOpts.headers["cookie"] = srcReq.headers.cookie ?? "";
        return proxyReqOpts;
      },

      userResHeaderDecorator: (
        headers,
        _userReq,
        _userRes,
        _proxyReq,
        proxyRes,
      ) => {
        const setCookie = proxyRes.headers["set-cookie"];
        if (setCookie) {
          const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
          headers["set-cookie"] = cookies.map((cookie) =>
            cookie
              .replace(/;\s*Domain=[^;]*/gi, "")
              .replace(/;\s*SameSite=Lax/gi, "; SameSite=None")
              .concat("; Partitioned"),
          );
        }
        return headers;
      },
      userResDecorator: (_proxyRes, proxyResData) => {
        logger.info("[proxy] response from user-service /auth");
        return proxyResData;
      },
    }),
  );

  trpcNamespaceProxy(app);
}
