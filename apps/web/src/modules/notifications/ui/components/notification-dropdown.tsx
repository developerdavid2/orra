"use client";

import { Show } from "@/components/show";
import { formatGroupLabel, getDateGroup, groupByDate } from "@/lib/utils";
import type { AppNotification } from "@orra/types";
import { Skeleton } from "@orra/ui/components/skeleton";
import { cn } from "@orra/ui/lib/utils";
import { ArrowRight, Bell, Check, Settings, BellDot, X } from "lucide-react";
import Link from "next/link";
import { useMarkAllRead } from "../../hooks/mutations/use-mark-all-read-notifications";
import { useNotifications } from "../../hooks/queries/use-notifications";
import { NotificationItem } from "./notification-item";
import { useNotificationPermission } from "../../hooks/mutations/use-notification-permission";
import { useDeviceRegistration } from "../../hooks/queries/use-device-registration";

interface NotificationDropdownProps {
  onClose: () => void;
  onOpenPermissionDialog: () => void;
  onDismissBanner: () => void;
  dismissedBanner: boolean;
  shouldShowPulsatingBadge: boolean;
}

export function NotificationDropdown({
  onClose,
  onOpenPermissionDialog,
  onDismissBanner,
  dismissedBanner,
  shouldShowPulsatingBadge,
}: NotificationDropdownProps) {
  const {
    data: notificationsData,
    isLoading,
    isFetching,
  } = useNotifications({
    limit: 10,
    category: "all",
    status: "all",
    search: "",
  });
  const markAllRead = useMarkAllRead();

  const { hasToken } = useDeviceRegistration();

  const notifications =
    notificationsData?.pages?.flatMap((page) => page.items) ?? [];

  const grouped = groupByDate(notifications, (n: AppNotification) =>
    getDateGroup(new Date(n.createdAt)),
  );

  const hasUnread = notifications.some((n) => !n.isRead);
  const isPending = isLoading || isFetching;

  const isRegisteredState = hasToken;

  return (
    <div className="absolute right-0 top-full mt-2.5 w-105 z-200">
      {/* Glassmorphism container */}
      <div
        className={cn(
          "rounded-2xl overflow-hidden",
          "bg-white/70 dark:bg-[#1B1A22]/70",
          "backdrop-blur-[20px] backdrop-saturate-180",
          "border border-white/30 dark:border-white/8",
          "shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/20 dark:border-white/6">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-1">
            {hasUnread && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg",
                  "hover:bg-white/50 dark:hover:bg-white/10 transition-colors",
                  "text-muted-foreground hover:text-foreground",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <Check className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
            <Link
              href="/dashboard/settings/notifications"
              onClick={onClose}
              className={cn(
                "p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors",
                "text-muted-foreground hover:text-foreground",
              )}
              title="Notification Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Permission Banner - WhatsApp style */}
        {!dismissedBanner && shouldShowPulsatingBadge && (
          <div className="border-b border-primary/20 bg-primary/5 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <BellDot className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Push notifications are off
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You won't receive alerts when the app is closed.
                </p>
              </div>
              <button
                onClick={onOpenPermissionDialog}
                className="flex-shrink-0 font-medium text-sm underline underline-offset-2 text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
              >
                Turn on
              </button>
              <button
                onClick={onDismissBanner}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 ml-2"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="max-h-110 overflow-y-auto scrollbar-thin">
          {isPending ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3.5 w-full max-w-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Show
              when={!notifications.length}
              fallback={Object.entries(grouped).map(([group, items]) => (
                <div key={group}>
                  <div className="px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 bg-white/30 dark:bg-white/3">
                    {formatGroupLabel(group as any)}
                  </div>
                  {(items as AppNotification[]).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={onClose}
                      variant="compact"
                    />
                  ))}
                </div>
              ))}
            >
              <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                <div className="p-4 rounded-full bg-white/40 dark:bg-white/5 mb-4">
                  <Bell className="h-8 w-8 opacity-30" />
                </div>
                <p className="text-sm font-medium">No notifications yet</p>
                <p className="text-xs mt-1 opacity-50">
                  We will notify you when something happens
                </p>
              </div>
            </Show>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-white/20 dark:border-white/6 px-5 py-3">
            <Link
              href="/dashboard/notifications"
              onClick={onClose}
              className={cn(
                "flex items-center justify-center gap-2 text-sm font-medium",
                "text-main hover:underline transition-colors",
              )}
            >
              View All Notifications
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
