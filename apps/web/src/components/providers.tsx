"use client";

import { TRPCReactProvider } from "@/trpc/trpc-client";
import { Toaster } from "@orra/ui/components/sonner";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect } from "react";
import { ThemeProvider } from "./theme-provider";
import { initSentryClient } from '@/lib/sentry/client';
import { webEnv } from '@orra/env/web';

export default function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((reg) => console.log("[SW] registered:", reg.scope))
        .catch((err) => console.error("[SW] registration failed:", err));
    }
  }, []);

  // Initialize Sentry client-side
  useEffect(() => {
    initSentryClient({
      dsn: webEnv.NEXT_PUBLIC_SENTRY_DSN,
      environment: webEnv.NEXT_PUBLIC_SENTRY_ENV || 'development',
      tracesSampleRate: webEnv.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1,
      profilesSampleRate: webEnv.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE ?? 0.1,
      debug: webEnv.NEXT_PUBLIC_SENTRY_DEBUG ?? false,
    });
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