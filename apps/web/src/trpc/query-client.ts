import {
  QueryCache,
  QueryClient,
  MutationCache,
  defaultShouldDehydrateQuery,
} from "@tanstack/react-query";
import { TRPCClientError } from "@trpc/client";
import superjson from "superjson";

function isUnauthorized(error: unknown): boolean {
  return (
    error instanceof TRPCClientError &&
    (error.data?.code === "UNAUTHORIZED" || error.data?.httpStatus === 401)
  );
}

function isOnAuthPage(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.pathname.startsWith("/auth");
}

function redirectToSignIn() {
  if (typeof window === "undefined") return;
  if (isOnAuthPage()) return;
  const current = window.location.pathname + window.location.search;
  window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(current)}`;
}

export function makeQueryClient() {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error) => {
        if (isUnauthorized(error)) redirectToSignIn();
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        if (isUnauthorized(error)) redirectToSignIn();
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        serializeData: superjson.serialize,
        shouldDehydrateQuery: (query) => {
          if (query.state.status === "error") return false;
          return (
            defaultShouldDehydrateQuery(query) ||
            query.state.status === "pending"
          );
        },
        shouldDehydrateMutation: () => false,
      },
      hydrate: {
        deserializeData: superjson.deserialize,
      },
    },
  });
}
