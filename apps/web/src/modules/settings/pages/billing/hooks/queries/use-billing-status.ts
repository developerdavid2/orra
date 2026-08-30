"use client";
import { useTRPC } from "@/trpc/trpc-client";
import { useSuspenseQuery } from "@tanstack/react-query";

export function useBillingStatus() {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.users.billing.status.queryOptions());
}
