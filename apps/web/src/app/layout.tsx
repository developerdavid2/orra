// apps/web/src/app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import Providers from "@/components/providers";
import { SentryErrorBoundary } from '@orra/sentry/error-boundary';
import * as Sentry from '@sentry/nextjs';
import "../index.css";

const fontNexa = localFont({
  src: [
    { path: "./fonts/Nexa-Thin.woff2", weight: "100", style: "normal" },
    { path: "./fonts/Nexa-Light.woff2", weight: "200", style: "normal" },
    { path: "./fonts/Nexa-Book.woff2", weight: "300", style: "normal" },
    { path: "./fonts/Nexa-Regular.woff2", weight: "400", style: "italic" },
    { path: "./fonts/Nexa-Bold.woff2", weight: "500", style: "normal" },
    { path: "./fonts/Nexa-Heavy.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Nexa-BoldItalic.woff2", weight: "700", style: "italic" },
    { path: "./fonts/Nexa-Black.woff2", weight: "800", style: "normal" },
    { path: "./fonts/Nexa-XBold.woff2", weight: "900", style: "normal" },
    { path: "./fonts/Nexa-XBoldItalic.woff2", weight: "900", style: "italic" },
  ],
  variable: "--font-nexa",
  display: "swap",
  preload: true,
});

// Primary Rostex Font (Regular & Oblique)
const fontRostex = localFont({
  src: [
    { path: "./fonts/Rostex-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Rostex-Oblique.otf", weight: "400", style: "italic" },
  ],
  variable: "--font-rostex",
  display: "swap",
  preload: true,
});

// Separate Font Variable specifically for Outline variants
const fontRostexOutline = localFont({
  src: [
    { path: "./fonts/Rostex-Outline.otf", weight: "400", style: "normal" },
    {
      path: "./fonts/Rostex-Oblique-Outline.otf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-rostex-outline",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "orra",
  description: "orra",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${fontNexa.variable} ${fontRostex.variable} ${fontRostexOutline.variable} antialiased`}
      >
        <SentryErrorBoundary
          fallback={<div className="flex min-h-screen items-center justify-center p-4"><p>Something went wrong. Please refresh the page.</p></div>}
          showDialog={process.env.NODE_ENV === 'production'}
        >
          <Providers>
            <div className="grid grid-rows-[auto_1fr] h-svh">{children}</div>
          </Providers>
        </SentryErrorBoundary>
      </body>
    </html>
  );
}