import * as Sentry from "@sentry/node";
import type { Express } from "express";

let isInitialized = false;

export interface SentryServerConfig {
  dsn: string;
  environment: string;
  serviceName: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  debug?: boolean;
  release?: string;
}

export function initSentryServer(config: {
  dsn: string;
  environment: string;
  serviceName: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  debug?: boolean;
  release?: string;
}): void {
  if (isInitialized) {
    console.warn("[Sentry] Already initialized, skipping re-initialization");
    return;
  }

  if (!config.dsn) {
    console.warn("[Sentry] No DSN provided, skipping initialization");
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    initialScope: {
      tags: {
        service: config.serviceName,
      },
    },
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    profilesSampleRate: config.profilesSampleRate ?? 0.1,
    debug: config.debug ?? false,
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    beforeSend(event) {
      if (process.env.NODE_ENV === "development") {
        return event;
      }
      return scrubEvent(event);
    },
    ignoreErrors: [
      "ECONNRESET",
      "ETIMEDOUT",
      "ENOTFOUND",
      "ECONNREFUSED",
      "Request aborted",
      "socket hang up",
    ],
  });

  isInitialized = true;
  console.log(
    `[Sentry] Initialized for ${config.serviceName} in ${config.environment}`,
  );
}

export function setSentryUser(
  user: { id: string; email?: string; username?: string } | null,
): void {
  if (user) {
    Sentry.setUser(user);
  } else {
    Sentry.setUser(null);
  }
}

export function setSentryTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

export function setSentryContext(
  key: string,
  context: Record<string, any>,
): void {
  Sentry.setContext(key, context);
}

export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: "debug" | "info" | "warning" | "error";
  data?: Record<string, any>;
}): void {
  Sentry.addBreadcrumb(breadcrumb);
}

export function captureException(
  error: Error,
  context?: Record<string, any>,
): string {
  return Sentry.captureException(error, { extra: context });
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
): string {
  return Sentry.captureMessage(message, level);
}

export function flush(timeout?: number): Promise<boolean> {
  return Sentry.flush(timeout ?? 2000);
}

function scrubEvent(event: any): any {
  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "authorization",
    "cookie",
    "credit_card",
    "ssn",
    "api_key",
    "access_token",
    "refresh_token",
  ];

  const scrub = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(scrub);

    const scrubbed: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some((k) => lowerKey.includes(k));
      scrubbed[key] = isSensitive ? "[REDACTED]" : scrub(value);
    }
    return scrubbed;
  };

  if (event.exception?.values) {
    event.exception.values = event.exception.values.map((v: any) => ({
      ...v,
      value: v.value ? "[REDACTED]" : v.value,
    }));
  }

  if (event.request) event.request = scrub(event.request);
  if (event.extra) event.extra = scrub(event.extra);
  if (event.contexts) event.contexts = scrub(event.contexts);

  return event;
}

export function setupExpressErrorHandler(app: Express): void {
  Sentry.setupExpressErrorHandler(app);
}

export { scrubEvent };
