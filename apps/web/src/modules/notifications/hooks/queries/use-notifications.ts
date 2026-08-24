import { useTRPC } from "@/trpc/trpc-client";
import type { NotificationsFilterInput } from "@orra/types";
import { useInfiniteQuery, useQueryClient, QueryClient } from "@tanstack/react-query";

export function useNotifications(input: NotificationsFilterInput) {
  const trpc = useTRPC();
  return useInfiniteQuery(
    trpc.notifications.appNotifications.list.infiniteQueryOptions(input, {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }),
  );
}

// Non-hook version for use in event handlers
export function createPrefetchNotifications(queryClient: QueryClient, trpc: ReturnType<typeof useTRPC>) {
  return (input: NotificationsFilterInput) => {
    queryClient.prefetchInfiniteQuery(
      trpc.notifications.appNotifications.list.infiniteQueryOptions(input, {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }),
    );
  };
}

// Hook version for components
export function usePrefetchNotifications() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return createPrefetchNotifications(queryClient, trpc);
}
