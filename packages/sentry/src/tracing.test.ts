import { beforeEach, describe, expect, mock, test } from "bun:test";

const startSpanCalls: { name?: string; parentSpan?: unknown }[] = [];

mock.module("@sentry/node", () => ({
  startSpan: (opts: { name?: string; parentSpan?: unknown }, callback: (span: unknown) => unknown) => {
    startSpanCalls.push({ name: opts?.name, parentSpan: opts?.parentSpan });
    const span = {};
    return callback(span);
  },
  captureException: () => "mock-event-id",
  setContext: () => {},
}));

const { startSpan, withSpan, traced } = await import("./tracing");

beforeEach(() => {
  startSpanCalls.length = 0;
});

describe("tracing wrappers forward parentSpan", () => {
  test("startSpan forwards parentSpan", () => {
    const parent = {};
    const result = startSpan({ name: "started", parentSpan: parent }, () => "done");

    expect(result).toBe("done");
    expect(startSpanCalls.at(-1)).toEqual({ name: "started", parentSpan: parent });
  });

  test("withSpan forwards parentSpan", async () => {
    const parent = {};
    const result = await withSpan("with", async () => "ok", {
      op: "custom",
      parentSpan: parent,
    });

    expect(result).toBe("ok");
    expect(startSpanCalls.at(-1)).toEqual({ name: "with", parentSpan: parent });
  });

  test("traced forwards parentSpan", async () => {
    const parent = {};
    const fn = traced("traced", async () => "ok", { parentSpan: parent });
    const result = await fn();

    expect(result).toBe("ok");
    expect(startSpanCalls.at(-1)).toEqual({ name: "traced", parentSpan: parent });
  });
});