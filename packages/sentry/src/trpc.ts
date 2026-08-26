import * as Sentry from "@sentry/node";

export function sentryTRPCMiddleware() {
  return async function sentryMiddleware({ next, path, type }: any) {
    return Sentry.startSpan(
      {
        name: `tRPC ${type.toUpperCase()} ${path}`,
        op: "trpc",
        attributes: { trpc_path: path, trpc_type: type },
      },
      async (span) => {
        try {
          const result = await next();
          span.setStatus({
            code: result.ok ? 1 : 2,
            message: result.ok ? undefined : "TRPC error",
          });
          return result;
        } catch (error) {
          span.setStatus({
            code: 2,
            message: error instanceof Error ? error.message : String(error),
          });
          Sentry.captureException(error, {
            tags: { trpc_path: path, trpc_type: type },
            extra: {
              trpc_error:
                error instanceof Error ? error.message : String(error),
            },
          });
          throw error;
        }
      },
    );
  };
}

export function createTRPCWithSentry() {
  return {
    errorFormatter({ shape }: any) {
      return shape;
    },
  };
}

export function createSentryTRPCMiddleware() {
  return async function sentryMiddleware({
    next,
    path,
    type,
    ctx,
    input,
  }: {
    next: (opts?: any) => Promise<any>;
    path: string;
    type: "query" | "mutation" | "subscription";
    ctx: any;
    input: any;
  }) {
    if (input) {
      Sentry.setContext("trpc_input", input);
    }

    return Sentry.startSpan(
      {
        name: `tRPC ${type.toUpperCase()} ${path}`,
        op: "trpc",
        attributes: { trpc_path: path, trpc_type: type },
      },
      async (span) => {
        try {
          const result = await next({ ctx, input });
          span.setStatus({ code: 1 });
          return result;
        } catch (error) {
          span.setStatus({
            code: 2,
            message: error instanceof Error ? error.message : String(error),
          });
          Sentry.captureException(error, {
            tags: { trpc_path: path, trpc_type: type },
            extra: {
              trpc_error:
                error instanceof Error ? error.message : String(error),
              input,
            },
          });
          throw error;
        }
      },
    );
  };
}

export function createSentryErrorFormatter() {
  return (shape: any) => shape;
}

export function captureTRPCError(
  error: Error & { code?: string },
  path: string,
  type: "query" | "mutation" | "subscription",
  input?: any,
): void {
  const span = Sentry.getActiveSpan();
  if (span) {
    span.setStatus({ code: 2, message: error.message });
    span.recordException(error);
  }

  Sentry.captureException(error, {
    tags: { trpc_path: path, trpc_type: type },
    extra: {
      input,
      trpc_error_code: error.code,
      trpc_error_message: error.message,
    },
  });
}

export function addTRPCBreadcrumb(
  path: string,
  type: "query" | "mutation" | "subscription",
  status: "started" | "completed" | "error",
  duration?: number,
): void {
  Sentry.addBreadcrumb({
    category: "trpc",
    message: `tRPC ${type.toUpperCase()} ${path} ${status}`,
    level: status === "error" ? "error" : "info",
    data: { path, type, status, duration },
  });
}
