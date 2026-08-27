import * as Sentry from "@sentry/node";
import type { SpanOptions } from "./types";

export function startSpan<T>(
  options: SpanOptions,
  callback: (span: Sentry.Span) => T,
): T {
  return Sentry.startSpan(
    {
      name: options.name,
      op: options.op || "function",
      attributes: options.attributes,
      parentSpan: options.parentSpan,
    },
    callback,
  );
}

export function endSpan(span: any, error?: Error): void {
  if (!span) return;
  if (error) {
    span.setStatus({ code: 2, message: error.message });
    span.recordException(error);
  } else {
    span.setStatus({ code: 0 });
  }
  span.end();
}

export async function withSpan<T>(
  name: string,
  fn: (span: any) => Promise<T>,
  options?: Partial<SpanOptions>,
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: "function",
      attributes: options?.attributes,
      parentSpan: options?.parentSpan,
    },
    async (span) => {
      try {
        return await fn(span);
      } catch (error) {
        throw error;
      }
    },
  );
}

export function traced<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  options?: Partial<SpanOptions>,
): T {
  return (async (...args: any[]) => {
    return Sentry.startSpan(
      {
        name,
        op: options?.op || "function",
        attributes: options?.attributes,
        parentSpan: options?.parentSpan,
      },
      async () => fn(...args),
    );
  }) as T;
}

export function addSpanAttributes(
  attributes: Record<string, string | number | boolean>,
): void {
  const span = Sentry.getActiveSpan();
  if (span) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }
}

export function setSpanStatus(
  span: any,
  status: "ok" | "error",
  message?: string,
): void {
  if (!span) return;
  if (status === "ok") {
    span.setStatus({ code: 0 });
  } else {
    span.setStatus({ code: 2, message });
  }
}

export function getActiveSpan(): any {
  return Sentry.getActiveSpan();
}
export function continueTrace(
  headers: Record<string, string>,
  name: string,
  callback: () => Promise<any>,
): Promise<any> {
  return Sentry.continueTrace(
    { sentryTrace: headers["sentry-trace"], baggage: headers.baggage },
    () =>
      Sentry.startSpan({ name }, async (span) => {
        try {
          const result = await callback();
          span.setStatus({ code: 0 });
          span.end();
          return result;
        } catch (error) {
          span.setStatus({
            code: 2,
            message: error instanceof Error ? error.message : String(error),
          });
          span.end();
          throw error;
        }
      }),
  );
}

export function continueTraceFromHeaders(
  sentryTrace: string | undefined,
  baggage: string | undefined,
): any {
  if (!sentryTrace) return null;

  return Sentry.continueTrace({ sentryTrace, baggage }, () =>
    Sentry.startSpan({ name: "continued-trace" }, (span) => span),
  );
}
