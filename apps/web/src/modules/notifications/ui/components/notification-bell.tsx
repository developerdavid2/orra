"use client";

import { cn } from "@orra/ui/lib/utils";
import { Bell, X, BellDot } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUnreadCountNotifications } from "../../hooks/queries/use-unread-count-notifications";
import { NotificationDropdown } from "./notification-dropdown";
import { usePrefetchNotifications } from "../../hooks/queries/use-notifications";
import { useDeviceRegistration } from "../../hooks/queries/use-device-registration";
import { useNotificationPermission } from "../../hooks/mutations/use-notification-permission";
import { PermissionDialog } from "./permission-dialog";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prefetchedRef = useRef(false);
  const { hasToken } = useDeviceRegistration();
  const {
    permission,
    isRegistered,
    isPermissionDenied,
    isRevoked,
    requestPermission,
  } = useNotificationPermission();

  const { data: serverCount = 0 } = useUnreadCountNotifications();
  const prefetchNotifications = usePrefetchNotifications();

  // Optimistic bump — incremented instantly on push, reset when
  // the server count catches up (i.e. after invalidation refetch)
  const [optimisticDelta, setOptimisticDelta] = useState(0);
  const prevServerCount = useRef(serverCount);

  // When the server count changes (refetch resolved), reset the delta
  useEffect(() => {
    if (serverCount !== prevServerCount.current) {
      prevServerCount.current = serverCount;
      setOptimisticDelta(0);
    }
  }, [serverCount]);

  // Listen for instant push from the SSE hook
  useEffect(() => {
    const handler = () => setOptimisticDelta((d) => d + 1);
    window.addEventListener("inapp-notification", handler);
    return () => window.removeEventListener("inapp-notification", handler);
  }, []);

  const unreadCount = serverCount + optimisticDelta;

  // Mark as mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prefetch on hover so dropdown opens instantly
  const handleMouseEnter = () => {
    if (!prefetchedRef.current) {
      prefetchedRef.current = true;
      prefetchNotifications({
        limit: 10,
        search: "",
        category: "all",
        status: "all",
      });
    }
  };

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Handle dialog confirm - actually requests permission
  const handleDialogConfirm = async () => {
    setShowPermissionDialog(false);
    await requestPermission();
  };

  // Handle dialog cancel - just close dialog
  const handleDialogCancel = () => {
    setShowPermissionDialog(false);
  };

  // Dismiss banner from dropdown
  const handleDismissBanner = () => {
    setDismissedBanner(true);
  };

  // Open permission dialog from dropdown - closes dropdown, opens dialog
  const handleOpenPermissionDialog = () => {
    setOpen(false);
    setShowPermissionDialog(true);
  };

  const shouldShowPulsatingBadge = mounted && !isRegistered && !dismissedBanner;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={handleMouseEnter}
        className={cn(
          "relative p-2 w-full rounded-lg transition-colors flex gap-x-2",
          "hover:bg-accent hover:text-accent-foreground",
          open && "bg-accent text-accent-foreground",
        )}
      >
        {shouldShowPulsatingBadge && (
          <span className="rounded-full h-4 w-4 bg-primary animate-[pulse_2s_ease-out_infinite]" />
        )}
        <div className="relative flex-1 pr-2">
          <Bell className="size-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive dark:bg-red-500 px-1 text-[10px] font-bold text-gray-200">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </button>

      {open && (
        <NotificationDropdown
          onClose={() => setOpen(false)}
          onOpenPermissionDialog={handleOpenPermissionDialog}
          onDismissBanner={handleDismissBanner}
          dismissedBanner={dismissedBanner}
          shouldShowPulsatingBadge={shouldShowPulsatingBadge}
        />
      )}

      <PermissionDialog
        open={showPermissionDialog}
        isRequesting={false}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
        variant={isPermissionDenied || isRevoked ? "denied" : "default"}
      />
    </div>
  );
}
