import { getFirebaseMessaging } from "@/lib/notification-config";
import { useDeviceRegistration } from "@/modules/notifications/hooks/queries/use-device-registration";
import { useUpdateNotificationPreferences } from "@/modules/settings/pages/notifications/hooks/queries/use-update-notification-preferences";
import { deleteToken, getToken, type Messaging } from "firebase/messaging";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useRegisterDevice } from "./use-register-device";

export function useNotificationPermission() {
  const { hasToken, refetch: refetchRegistration } = useDeviceRegistration();

  const [permission, setPermission] =
    useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [messaging, setMessaging] = useState<Messaging | null>(null);

  const registerDevice = useRegisterDevice();
  const pushMutation = useUpdateNotificationPreferences([
    "updatePreferences",
    "push",
  ]);

  // Computed: true only when we have a token AND native permission granted
  const isRegistered = hasToken && permission === "granted";

  // Sync permission state from native on mount
  useEffect(() => {
    if (!("Notification" in window)) {
      setIsSupported(false);
      return;
    }

    getFirebaseMessaging().then((instance) => {
      if (!instance) {
        setIsSupported(false);
        return;
      }
      setMessaging(instance);
      setPermission(Notification.permission);
    });
  }, []);

  // Listen for permission changes via visibility/focus events (no polling)
  useEffect(() => {
    if (!("Notification" in window)) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const currentPerm = Notification.permission;
        if (currentPerm !== permission) {
          setPermission(currentPerm);
        }
        // Refetch registration status on focus (token might have been revoked)
        refetchRegistration();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [permission, refetchRegistration]);

  const requestPermission = useCallback(async () => {
    if (!messaging) return null;
    setIsRequesting(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        toast.error("Notification permission denied");
        refetchRegistration();
        return null;
      }

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!;
      if (!vapidKey) {
        console.error("[requestPermission] VAPID key not configured");
        toast.error("Push notifications not configured");
        refetchRegistration();
        return null;
      }

      const token = await getToken(messaging, { vapidKey });
      if (!token) {
        toast.error("Failed to get push token");
        refetchRegistration();
        return null;
      }

      await registerDevice.mutateAsync({
        token,
        platform: "web",
        deviceName: navigator.userAgent.slice(0, 100),
      });
      pushMutation.mutate({ pushEnabled: true });
      toast.success("Push notifications enabled!");
      refetchRegistration();
      return token;
    } catch (err) {
      console.error("[requestPermission]", err);
      // Brave-specific error handling
      const isBrave = navigator.userAgent.includes("Brave");
      if (
        isBrave &&
        err instanceof Error &&
        err.message.includes("push service")
      ) {
        toast.error(
          "Brave blocks push notifications by default. Please allow notifications in Brave settings (brave://settings/content/notifications) and disable Shields for this site.",
        );
      } else {
        toast.error("Failed to enable push notifications");
      }
      refetchRegistration();
      return null;
    } finally {
      setIsRequesting(false);
    }
  }, [
    messaging,
    registerDevice.mutateAsync,
    pushMutation,
    refetchRegistration,
  ]);

  const unregister = useCallback(async () => {
    if (!messaging) return;
    await deleteToken(messaging);
    setPermission("default");
    pushMutation.mutate({ pushEnabled: false });
    refetchRegistration();
  }, [messaging, pushMutation, refetchRegistration]);

  return {
    permission,
    isSupported,
    isRequesting,
    hasToken,
    isRegistered,
    isPermissionDenied: permission === "denied",
    isRevoked: hasToken && permission === "denied",
    requestPermission,
    unregister,
  } as const;
}
