"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function useCheckout() {
  return useMutation({
    mutationFn: async (productId: string) => {
      const res = await authClient.checkout({
        products: [productId],
        redirect: false,
      });
      if (res.error) {
        throw new Error(res.error.message ?? "Failed to start checkout");
      }
      const url = res.data?.url;
      if (!url) {
        throw new Error("Checkout session did not return a URL");
      }
      return url;
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to start checkout",
      );
    },
  });
}
