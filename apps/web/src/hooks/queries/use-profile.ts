"use client";

import { useTRPC } from "@/trpc/trpc-client";
import { useQuery } from "@tanstack/react-query";

export function useProfile() {
  const trpc = useTRPC();
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    ...trpc.users.profile.me.queryOptions(),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  return {
    profile: profile ?? null,
    isLoading,
    isError,
  };
}
