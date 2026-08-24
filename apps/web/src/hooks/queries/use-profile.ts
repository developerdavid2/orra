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
    // Cached for the hard-load gate; sign-out clears the whole query cache
    // and profile edits invalidate via invalidateProfile.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    profile: profile ?? null,
    isLoading,
    isError,
  };
}
