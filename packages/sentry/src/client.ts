import * as Sentry from "@sentry/nextjs";

let isClientInitialized = false;

declare global {
  interface Window {
    Sentry?: any;
  }
}

export function initSentryClient(config: {
  dsn: string;
  environment: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  debug?: boolean;
  release?: string;
}): void {
  if (isClientInitialized) {
    console.warn("[Sentry] Client already initialized");
    return;
  }

  if (!config.dsn) {
    console.warn("[Sentry] No DSN provided, skipping client initialization");
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    tracesSampleRate: config.tracesSampleRate ?? 0.1,
    profilesSampleRate: config.profilesSampleRate ?? 0.1,
    debug: config.debug ?? false,
    integrations: [
      Sentry.browserTracingIntegration?.(),
      Sentry.replayIntegration?.({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ].filter(Boolean),
    beforeSend(event) {
      if (process.env.NODE_ENV === "development") {
        return null;
      }
      return scrubEvent(event);
    },
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "Network request failed",
      "hydration",
    ],
  });

  isClientInitialized = true;
  console.log("[Sentry] Client initialized");
}

export function setSentryUser(
  user: { id: string; email?: string; username?: string } | null,
): void {
  if (typeof window !== "undefined") {
    if (user) {
      Sentry.setUser(user);
    } else {
      Sentry.setUser(null);
    }
  }
}

export function setSentryTags(tags: Record<string, string>): void {
  if (typeof window !== "undefined") {
    Sentry.setTags(tags);
  }
}

export function captureException(
  error: Error,
  context?: Record<string, any>,
): string {
  if (typeof window !== "undefined") {
    return Sentry.captureException(error, { extra: context });
  }
  return "";
}

export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info",
): string {
  if (typeof window !== "undefined") {
    return Sentry.captureMessage(message, level);
  }
  return "";
}

export function addBreadcrumb(breadcrumb: {
  category: string;
  message: string;
  level?: "debug" | "info" | "warning" | "error";
  data?: Record<string, any>;
}): void {
  if (typeof window !== "undefined") {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

export function flush(timeout?: number): Promise<boolean> {
  if (typeof window !== "undefined") {
    return Sentry.flush(timeout ?? 2000);
  }
  return Promise.resolve(true);
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

export { scrubEvent };
