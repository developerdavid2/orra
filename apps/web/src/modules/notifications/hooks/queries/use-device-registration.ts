import { useTRPC } from "@/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";

export function useDeviceRegistration() {
  const trpc = useTRPC();

  const { data, isLoading, refetch } = useQuery(
    trpc.notifications.appNotifications.hasActiveDeviceToken.queryOptions(),
  );

  return {
    hasToken: data?.hasToken ?? false,
    tokenCount: data?.tokenCount ?? 0,
    isLoading,
    refetch,
  };
}