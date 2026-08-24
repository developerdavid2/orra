import "server-only";

import type { AppRouter } from "@orra/api-gateway/router";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink, httpLink } from "@trpc/client";
import {
  createTRPCOptionsProxy,
  type TRPCInfiniteQueryOptions,
  type TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache } from "react";
import "server-only";
import superjson from "superjson";
import { makeQueryClient } from "./query-client";

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: createTRPCClient<AppRouter>({
    links: [
      httpLink({
        url: `${process.env.SERVER_URL}/v1/trpc`,
        transformer: superjson,
        async headers() {
          const h = await headers();
          const cookie = h.get("cookie") ?? "";
          const appUrl = new URL(
            process.env.NEXT_PUBLIC_APP_URL ?? "https://localhost:3001",
          );
          return {
            cookie,
            "x-forwarded-host": appUrl.host,
            "x-forwarded-proto": "https",
          };
        },
      }),
    ],
  }),
  queryClient: getQueryClient,
});
export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
): Promise<void> {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    return queryClient
      .prefetchInfiniteQuery(queryOptions as any)
      .catch(() => {});
  }
  return queryClient.prefetchQuery(queryOptions).catch(() => {
    queryClient.removeQueries({ queryKey: queryOptions.queryKey });
  });
}

export async function prefetchInfinite<
  T extends ReturnType<TRPCQueryOptions<any>>,
>(queryOptions: T) {
  const queryClient = getQueryClient();
  try {
    await queryClient.prefetchInfiniteQuery(queryOptions as any);
  } catch {
    queryClient.removeQueries({ queryKey: queryOptions.queryKey });
  }
}
