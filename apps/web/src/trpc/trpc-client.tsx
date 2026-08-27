"use client";

import type { AppRouter } from "@orra/api-gateway/router";
import { webEnv } from "@orra/env/web";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpLink,
  httpSubscriptionLink,
  loggerLink,
  splitLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";
import * as Sentry from '@sentry/nextjs';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === "undefined") return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function getTRPCUrl(): string {
  // Server-side — always use direct URL
  if (typeof window === "undefined") {
    return `${webEnv.NEXT_PUBLIC_SERVER_URL}/v1/trpc`;
  }
  // Client-side — use rewrite in production, direct in local dev
  if (window.location.hostname === "localhost") {
    return `${webEnv.NEXT_PUBLIC_SERVER_URL}/v1/trpc`;
  }
  // Production/staging — go through Vercel rewrite (same origin, cookie works)
  return `/api/trpc`;
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        loggerLink({
          enabled: (opts) => opts.direction === "down",
          logger: (opts) => {
            if (opts.direction !== "down") return;

            const result = opts.result;
            let error: unknown = null;
            if (result instanceof Error) {
              error = result;
            } else {
              const inner = (result as { result?: { error?: unknown } }).result;
              if (inner?.error) error = inner.error;
            }
            if (!error) return;

            const message =
              error instanceof Error
                ? error.message
                : typeof (error as { message?: unknown }).message === "string"
                  ? (error as { message: string }).message
                  : String(error);

            Sentry.captureException(error, {
              tags: {
                trpcPath: opts.path,
                trpcType: opts.type,
              },
              extra: { trpcError: message },
            });
          },
        }),
        splitLink({
          condition: (op) => op.type === "subscription",
          true: httpSubscriptionLink({
            url: getTRPCUrl(),
            transformer: superjson,
            eventSourceOptions: {
              withCredentials: true,
            },
          }),
          false: httpLink({
            transformer: superjson,
            url: getTRPCUrl(),
            fetch(url, options) {
              return fetch(url, { ...options, credentials: "include" });
            },
          }),
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}