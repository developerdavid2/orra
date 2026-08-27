export const sensitiveKeys = [
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
  "private_key",
  "privatekey",
];

export function scrubEvent(event: any): any {
  if (!event) return event;

  const scrub = (obj: any): any => {
    if (!obj || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(scrub);

    const scrubbed: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = sensitiveKeys.some(
        (k) =>
          k.toLowerCase() === lowerKey || lowerKey.includes(k.toLowerCase()),
      );
      scrubbed[key] = isSensitive ? "[REDACTED]" : scrub(value);
    }
    return scrubbed;
  };

  const scrubbedEvent = { ...event };

  if (event.exception?.values) {
    scrubbedEvent.exception = {
      ...event.exception,
      values: event.exception.values.map((v: any) => {
        const newV = { ...v, value: v.value ? "[REDACTED]" : v.value };
        if (v.stacktrace) {
          newV.stacktrace = {
            ...v.stacktrace,
            frames: v.stacktrace.frames?.map((frame: any) => ({
              ...frame,
              vars: frame.vars ? scrub(frame.vars) : undefined,
            })),
          };
        }
        return newV;
      }),
    };
  }

  if (event.request) scrubbedEvent.request = scrub(event.request);
  if (event.extra) scrubbedEvent.extra = scrub(event.extra);
  if (event.contexts) {
    const scrubbedContexts: Record<string, any> = {};
    for (const [key, value] of Object.entries(event.contexts)) {
      scrubbedContexts[key] = scrub(value);
    }
    scrubbedEvent.contexts = scrubbedContexts;
  }
  if (event.breadcrumbs) scrubbedEvent.breadcrumbs = scrub(event.breadcrumbs);
  if (event.user) {
    scrubbedEvent.user = {
      ...event.user,
      email: event.user.email ? "[REDACTED]" : undefined,
      ip_address: undefined,
    };
  }
  return scrubbedEvent;
}

const sentryFilters = {
  developmentFilter: (event: any) => {
    if (process.env.NODE_ENV === "development") return null;
    return event;
  },
  healthCheckFilter: (event: any) => {
    const url = event.request?.url || "";
    if (
      url.includes("/health") ||
      url.includes("/ready") ||
      url.includes("/live")
    )
      return null;
    return event;
  },
  clientErrorFilter: (event: any) => {
    const val = event.exception?.values?.[0]?.value || "";
    const isClientError = [401, 403, 404].some((code) =>
      val.includes(String(code)),
    );
    if (isClientError) return null;
    return event;
  },
  combinedFilter: (event: any) => {
    let filtered = event;
    filtered = sentryFilters.developmentFilter(filtered);
    if (!filtered) return null;
    filtered = sentryFilters.healthCheckFilter(filtered);
    if (!filtered) return null;
    filtered = sentryFilters.clientErrorFilter(filtered);
    if (!filtered) return null;
    return filtered;
  },
};

export { sentryFilters };

export const beforeSend = (event: any): any => {
  const filtered = sentryFilters.combinedFilter(event);
  if (!filtered) return null;
  return scrubEvent(event);
};

export const sentryEventProcessor = (event: any): any => {
  if (!event.tags) event.tags = {};
  event.tags.service_version = process.env.APP_VERSION || "unknown";
  event.tags.node_env = process.env.NODE_ENV || "unknown";
  return event;
};
