"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function usePortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await authClient.customer.portal();
      if (res.error) {
        throw new Error(res.error.message ?? "Failed to open customer portal");
      }
      return res.data?.url ?? null;
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to open customer portal",
      );
    },
  });
}
