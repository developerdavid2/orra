"use client";
import { useTRPC } from "@/trpc/trpc-client";
import { useSuspenseQuery } from "@tanstack/react-query";

export function useBillingPlans() {
  const trpc = useTRPC();
  return useSuspenseQuery({
    ...trpc.users.billing.plans.queryOptions(),
    refetchOnMount: "always",
  });
}