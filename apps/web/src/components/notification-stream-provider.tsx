"use client";

import { useDeviceRegistration } from "@/modules/notifications/hooks/queries/use-device-registration";
import { useNotificationPermission } from "@/modules/notifications/hooks/mutations/use-notification-permission";
import { useNotificationStream } from "@/modules/notifications/hooks/queries/use-notifications-stream";
import { getFirebaseMessaging } from "@/lib/notification-config";
import { onMessage } from "firebase/messaging";
import { useEffect } from "react";
import { toast } from "sonner";

export function NotificationStreamProvider() {
  const { hasToken } = useDeviceRegistration();
  const { permission, requestPermission } = useNotificationPermission();

  useNotificationStream();

  // Single FCM message listener for background notifications
  // Only shows toast when app is in background (document.hidden)
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let cancelled = false;

    getFirebaseMessaging().then((messaging) => {
      if (cancelled || !messaging) return;
      unsub = onMessage(messaging, (payload) => {
        // Only show toast for background notifications
        // Foreground notifications are handled by SSE via inapp-notification event
        if (document.hidden) {
          window.dispatchEvent(
            new CustomEvent("push-notification", { detail: payload }),
          );
          const { title, body } = payload.notification ?? {};
          toast.info(title ?? "New notification", {
            description: body,
            duration: 8000,
          });
        } else {
          // For foreground, just dispatch the event for any listeners
          window.dispatchEvent(
            new CustomEvent("push-notification", { detail: payload }),
          );
        }
      });
    });

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  // Smart auto-prompt on login: only if no token and not denied
  useEffect(() => {
    if (!hasToken && permission === "default" && "Notification" in window) {
      const timer = setTimeout(() => {
        requestPermission();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasToken, permission, requestPermission]);

  return null;
}