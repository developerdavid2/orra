"use client";

import { Button } from "@orra/ui/components/button";
import { Spinner } from "@orra/ui/components/spinner";
import { cn } from "@orra/ui/lib/utils";
import {
  Archive,
  ChevronRight,
  MessageCircle,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { INSIGHTS_TYPE_LABELS, INSIGHTS_TYPE_STYLES } from "../../constants";
import type { Insight } from "../../types";

export type InsightCardVariant = "compact" | "full";

interface InsightCardProps {
  insight: Insight;
  variant?: InsightCardVariant;
  onDismiss: (id: string) => Promise<void>;
  onRestore?: (id: string) => Promise<void>;
  onChat: (id: string) => void;
  onOpen: (id: string) => void;
  isDismissing: (id: string) => boolean;
  isRestoring: (id: string) => boolean;
  isFocused?: boolean;
}

export const InsightCard = ({
  insight,
  variant = "compact",
  onDismiss,
  onRestore,
  onChat,
  onOpen,
  isDismissing,
  isRestoring,
  isFocused,
}: InsightCardProps) => {
  const isUnread = !insight.readAt;
  const isDismissed = !!insight.dismissedAt;
  const isFull = variant === "full";

  // Check pending state for THIS insight only
  const dismissing = isDismissing(insight.id);
  const restoring = isRestoring(insight.id);
  const isPending = dismissing || restoring;

  return (
    <div
      role="button"
      className={cn(
        "group relative flex flex-col items-start text-left transition-colors cursor-pointer w-full",
        isFull ? "gap-3 px-6 py-5" : "gap-2 px-5 py-4",
        "hover:bg-accent",
        isUnread && "bg-accent/30",
        isDismissed && "opacity-60",
        isPending && "pointer-events-none opacity-50",
      )}
      onClick={() => !isPending && onOpen(insight.id)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (!isPending && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onOpen(insight.id);
        }
      }}
    >
      {/* Unread indicator */}
      {isUnread && !isPending && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary" />
      )}

      {/* Pending spinner overlay */}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
          <Spinner className="size-5  text-muted-foreground" />
        </div>
      )}

      {/* Header: badge + actions */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              INSIGHTS_TYPE_STYLES[
                insight.type as keyof typeof INSIGHTS_TYPE_STYLES
              ] ?? "bg-muted text-muted-foreground",
            )}
          >
            {INSIGHTS_TYPE_LABELS[
              insight.type as keyof typeof INSIGHTS_TYPE_LABELS
            ] ?? insight.type}
          </span>
          {isUnread && (
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
          )}
          {insight.severity && (
            <span className="text-[10px] text-muted-foreground capitalize hidden sm:inline">
              {insight.severity}
            </span>
          )}
        </div>

        {/* COMPACT: Icon-only actions */}
        {!isFull && !isDismissed && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChat(insight.id);
              }}
              disabled={isPending}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
              aria-label="Chat"
            >
              <MessageCircle className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(insight.id);
              }}
              disabled={dismissing}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
              aria-label="Dismiss"
            >
              {dismissing ? (
                <Spinner className="size-3.5 " />
              ) : (
                <X className="size-3.5" />
              )}
            </button>
          </div>
        )}

        {/* COMPACT: Restore */}
        {!isFull && isDismissed && onRestore && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(insight.id);
              }}
              disabled={restoring}
              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
              aria-label="Restore"
            >
              {restoring ? (
                <Spinner className="size-3.5 " />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className={cn(
          "text-sm text-foreground",
          isUnread ? "font-semibold" : "font-medium",
        )}
      >
        {insight.title}
      </h3>

      {/* Description */}
      <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
        {insight.description}
      </p>

      {/* Timestamp */}
      <p className="text-xs text-muted-foreground/70 mt-1">
        Generated: {formatDateTime(insight.generatedAt)}
      </p>

      {/* FULL: Prominent CTAs */}
      {isFull && (
        <div className="flex items-center gap-2 mt-1">
          {!isDismissed ? (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onChat(insight.id);
                }}
                disabled={isPending}
              >
                <MessageCircle className="size-3.5" />
                Chat about this
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(insight.id);
                }}
                disabled={dismissing}
              >
                {dismissing ? (
                  <Spinner className="size-3.5 " />
                ) : (
                  <Archive className="size-3.5" />
                )}
                {dismissing ? "Dismissing..." : "Dismiss"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1.5 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onRestore?.(insight.id);
              }}
              disabled={restoring}
            >
              {restoring ? (
                <Spinner className="size-3.5 " />
              ) : (
                <RotateCcw className="size-3.5" />
              )}
              {restoring ? "Restoring..." : "Restore"}
            </Button>
          )}
        </div>
      )}

      {/* COMPACT: Mobile chat link */}
      {!isFull && !isDismissed && (
        <div className="flex items-center gap-2 mt-0.5 sm:hidden">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChat(insight.id);
            }}
            disabled={isPending}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary disabled:opacity-40"
          >
            <Sparkles className="size-3" />
            Chat
            <ChevronRight className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-8 text-center">
      <div className="rounded-full bg-muted p-3 mb-3">
        <Sparkles className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">
        No insights yet
      </p>
      <p className="text-xs text-muted-foreground max-w-50">
        Insights are generated automatically as you spend. Connect your bank
        account to get started.
      </p>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-border">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2 px-5 py-4 animate-pulse">
          <div className="flex items-start justify-between gap-2">
            <div className="h-4 w-20 rounded-full bg-accent" />
            <div className="h-4 w-4 rounded bg-accent" />
          </div>
          <div className="h-4 w-3/4 rounded bg-accent" />
          <div className="h-3 w-full rounded bg-accent" />
          <div className="h-3 w-2/3 rounded bg-accent" />
        </div>
      ))}
    </div>
  );
}
