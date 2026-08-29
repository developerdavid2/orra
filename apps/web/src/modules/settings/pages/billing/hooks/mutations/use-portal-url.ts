"use client";

import { useTRPC } from "@/trpc/trpc-client";
import { useMutation } from "@tanstack/react-query";

export function usePortalUrl() {
  const trpc = useTRPC();
  return useMutation(trpc.users.billing.portalUrl.mutationOptions());
}
