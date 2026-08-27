"use client";

import { TRPCReactProvider } from "@/trpc/trpc-client";
import { Toaster } from "@orra/ui/components/sonner";
import { useEffect } from "react";
import { ThemeProvider } from "./theme-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((reg) => console.log("[SW] registered:", reg.scope))
        .catch((err) => console.error("[SW] registration failed:", err));
    }
  }, []);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <TRPCReactProvider>
        {children}
        {/* <ReactQueryDevtools /> */}
      </TRPCReactProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
