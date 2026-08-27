"use client";

import { ErrorBoundary } from "@sentry/react";
import type { FallbackRender } from "@sentry/react";

interface SentryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactElement;
  fallbackRender?: (props: {
    error: unknown;
    resetError: () => void;
  }) => React.ReactElement;
  onError?: (
    error: unknown,
    componentStack: string | undefined,
    eventId: string,
  ) => void;
  showDialog?: boolean;
}

export function SentryErrorBoundary({
  children,
  fallback,
  fallbackRender,
  onError,
  showDialog,
}: SentryErrorBoundaryProps) {
  const resolvedFallback: FallbackRender | React.ReactElement = fallbackRender
    ? ({ error, resetError }) => fallbackRender({ error, resetError })
    : (fallback ?? DefaultFallback);

  return (
    <ErrorBoundary
      fallback={resolvedFallback}
      onError={onError}
      showDialog={showDialog}
    >
      {children}
    </ErrorBoundary>
  );
}

function DefaultFallback({
  error,
  resetError,
}: {
  error: unknown;
  componentStack: string;
  eventId: string;
  resetError(): void;
}) {
  const message = error instanceof Error ? error.message : String(error);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "300px",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "4rem",
            height: "4rem",
            margin: "0 auto 1rem",
            borderRadius: "50%",
            backgroundColor: "#fee2e2",
          }}
        >
          <svg
            className="size-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2
          style={{ fontSize: "1.25rem", fontWeight: "600", marginTop: "1rem" }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            color: "#6b7280",
            marginTop: "0.5rem",
            fontSize: "0.875rem",
          }}
        >
          We've been notified and are looking into it.
        </p>
        <button
          onClick={resetError}
          style={{
            marginTop: "1.5rem",
            width: "100%",
            padding: "0.5rem 1rem",
            backgroundColor: "#3b82f6",
            color: "white",
            borderRadius: "0.375rem",
            fontWeight: "500",
          }}
        >
          Try again
        </button>
        <p style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: "1rem" }}>
          {message ? `Error reported to monitoring` : null}
        </p>
      </div>
    </div>
  );
}
