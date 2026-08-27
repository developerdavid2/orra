import { beforeEach, describe, expect, mock, test } from "bun:test";

const capturedExceptions: unknown[] = [];
const setStatusCalls: { code: number; message?: string }[] = [];

mock.module("@sentry/node", () => ({
  startSpan: (_opts: unknown, callback: (span: unknown) => unknown) => {
    const span = {
      setStatus: (status: { code: number; message?: string }) => {
        setStatusCalls.push(status);
      },
      recordException: () => {},
    };
    return callback(span);
  },
  captureException: (error: unknown) => {
    capturedExceptions.push(error);
    return "mock-event-id";
  },
  setContext: () => {},
}));

const { sentryTRPCMiddleware } = await import("./trpc");

beforeEach(() => {
  capturedExceptions.length = 0;
  setStatusCalls.length = 0;
});

describe("sentryTRPCMiddleware", () => {
  test("captures the error when a procedure returns a failed result", async () => {
    const middleware = sentryTRPCMiddleware();
    const boom = new Error("boom");

    const result = await middleware({
      next: async () => ({ ok: false, error: boom }),
      path: "payments.accounts.list",
      type: "query",
    });

    expect(result).toEqual({ ok: false, error: boom });
    expect(capturedExceptions).toContain(boom);
    expect(setStatusCalls.at(-1)).toEqual({
      code: 2,
      message: "TRPC error",
    });
  });

  test("keeps the ok result and does not capture on success", async () => {
    const middleware = sentryTRPCMiddleware();
    const data = { balance: 42 };

    const result = await middleware({
      next: async () => ({ ok: true, data }),
      path: "payments.accounts.list",
      type: "query",
    });

    expect(result).toEqual({ ok: true, data });
    expect(capturedExceptions).toHaveLength(0);
    expect(setStatusCalls.at(-1)).toEqual({ code: 1, message: undefined });
  });

  test("still captures and rethrows a thrown error from next", async () => {
    const middleware = sentryTRPCMiddleware();
    const boom = new Error("boom");

    await expect(
      middleware({
        next: async () => {
          throw boom;
        },
        path: "ai.coach.streamChat",
        type: "mutation",
      }),
    ).rejects.toBe(boom);

    expect(capturedExceptions).toContain(boom);
  });
});