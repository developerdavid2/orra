"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function useCheckout() {
  return useMutation({
    mutationFn: async (productId: string) => {
      await authClient.checkout({ products: [productId] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout",
      );
    },
  });
}