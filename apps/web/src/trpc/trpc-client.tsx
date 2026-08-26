"use client";

import type { AppRouter } from "@orra/api-gateway/router";
import { webEnv } from "@orra/env/web";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import {
  createTRPCClient,
  httpLink,
  httpSubscriptionLink,
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
            async onError({ error, path, type }) {
              // Report tRPC errors to Sentry
              Sentry.captureException(error, {
                tags: {
                  trpcPath: path,
                  trpcType: type,
                },
                extra: {
                  trpcError: error instanceof Error ? error.message : String(error),
                },
              });
            },
            fetch(url, options) {
              return fetch(url, { ...options, credentials: "include" });
            },
          }),
        }),
      ],
    }),
  );
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
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
            async onError({ error, path, type }) {
              // Report tRPC errors to Sentry
              Sentry.captureException(error, {
                tags: {
                  trpcPath: path,
                  trpcType: type,
                },
                extra: {
                  trpcError: error instanceof Error ? error.message : String(error),
                },
              });
            },
            fetch(url, options) {
              return fetch(url, { ...options, credentials: "include" });
            },
          }),
        }),
      ],
    }),
  );
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
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
            async onError({ error, path, type }) {
              // Report tRPC errors to Sentry
              Sentry.captureException(error, {
                tags: {
                  trpcPath: path,
                  trpcType: type,
                },
                extra: {
                  trpcError: error instanceof Error ? error.message : String(error),
                },
              });
            },
            fetch(url, options) {
              return fetch(url, { ...options, credentials: "include" });
            },
          }),
        }),
      ],
    }),
  );
}

return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}