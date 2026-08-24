"use client";

import { useState } from "react";
import { useNotificationPreferences } from "@/modules/settings/pages/notifications/hooks/queries/use-notification-preferences";
import { useUpdateNotificationPreferences } from "@/modules/settings/pages/notifications/hooks/queries/use-update-notification-preferences";
import { useNotificationPermission } from "@/modules/notifications/hooks/mutations/use-notification-permission";
import { useDeviceRegistration } from "@/modules/notifications/hooks/queries/use-device-registration";
import { PushNotificationsSection } from "./push-notifications-section";
import { EmailNotificationsSection } from "./email-notifications-section";
import { AlertTypesSection } from "./alert-types-section";
import { PermissionDialog } from "@/modules/notifications/ui/components/permission-dialog";
import type { AlertPreferenceKey } from "../../constants";
import { Card, CardContent, CardHeader } from "@orra/ui/components/card";
import { Skeleton } from "@orra/ui/components/skeleton";

export function NotificationSettingsContent() {
  const { data: preferences } = useNotificationPreferences();
  const { hasToken, isLoading: registrationLoading } = useDeviceRegistration();

  const pushMutation = useUpdateNotificationPreferences([
    "updatePreferences",
    "push",
  ]);
  const emailMutation = useUpdateNotificationPreferences([
    "updatePreferences",
    "email",
  ]);

  // Alert types: single mutation instance, but section handles per-toggle state
  const alertMutation = useUpdateNotificationPreferences([
    "updatePreferences",
    "alert",
  ]);

  const {
    permission,
    isSupported,
    isRequesting,
    requestPermission,
    unregister,
    isRegistered,
  } = useNotificationPermission();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [dialogVariant, setDialogVariant] = useState<"default" | "denied">("default");

  if (!preferences) return null;

  // Computed states based on token + permission
  // REGISTERED: hasToken && permission === 'granted'
  // UNREGISTERED_DEFAULT: !hasToken && permission === 'default'
  // UNREGISTERED_DENIED: !hasToken && permission === 'denied'
  // PERMISSION_REVOKED: hasToken && permission === 'denied'
  const isPermissionDenied = permission === "denied";
  const isUnregistered = !hasToken;
  const isRevoked = hasToken && isPermissionDenied;

  const handlePushToggle = async (checked: boolean) => {
    if (checked) {
      // Trying to enable
      if (!isSupported) return;
      
      if (isPermissionDenied) {
        // Permission denied - show denied variant dialog
        setDialogVariant("denied");
        setShowPermissionDialog(true);
        return;
      }
      
      // Permission is default or granted - try to request
      setDialogVariant("default");
      setShowPermissionDialog(true);
      return;
    } else {
      // Trying to disable - unregister
      await unregister();
    }
  };

  const handleDialogConfirm = async () => {
    setShowPermissionDialog(false);
    const token = await requestPermission();
    if (!token) return;
    // pushMutation.mutate({ pushEnabled: true }); // requestPermission already does this
  };

  const handleDialogCancel = () => {
    setShowPermissionDialog(false);
  };

  // Return a promise so AlertTypesSection can track individual toggle state
  const handleAlertToggle = (
    key: AlertPreferenceKey,
    checked: boolean,
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      alertMutation.mutate(
        { [key]: checked },
        {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        },
      );
    });
  };

  const handleEmailToggle = (checked: boolean) => {
    emailMutation.mutate({ emailEnabled: checked });
  };

  // Determine toggle state and disabled state
  // Use actual preference for toggle state, not derived isRegistered
  const toggleChecked = preferences.pushEnabled ?? false;
  const toggleDisabled = !isSupported || pushMutation.isPending || registrationLoading;

  return (
    <div className="space-y-6">
      <PushNotificationsSection
        pushEnabled={toggleChecked}
        permission={permission}
        isSupported={isSupported}
        isLoading={toggleDisabled}
        onToggle={handlePushToggle}
        isRegistered={isRegistered}
        isPermissionDenied={isPermissionDenied}
        isRevoked={isRevoked}
      />

      <AlertTypesSection
        preferences={{
          transactionAlerts: preferences.transactionAlerts,
          accountAlerts: preferences.accountAlerts,
          insightsAlerts: preferences.insightsAlerts,
          coachAlerts: preferences.coachAlerts,
          budgetAlerts: preferences.budgetAlerts,
          splitNotifs: preferences.splitNotifs,
          vaultUpdates: preferences.vaultUpdates,
          weeklyReport: preferences.weeklyReport,
        }}
        onToggle={handleAlertToggle}
      />

      <EmailNotificationsSection
        emailEnabled={preferences.emailEnabled}
        isLoading={emailMutation.isPending}
        onToggle={handleEmailToggle}
      />

      <PermissionDialog
        open={showPermissionDialog}
        isRequesting={isRequesting}
        onConfirm={handleDialogConfirm}
        onCancel={() => setShowPermissionDialog(false)}
        variant={dialogVariant}
      />
    </div>
  );
}
export function NotificationSettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Push notifications card skeleton */}
      <Card className="bg-card dark:drop-shadow-md">
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-72" />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 rounded-3xl border border-border bg-main-tint p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-80" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert preferences card skeleton */}
      <Card className="bg-card dark:drop-shadow-md">
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-96" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-main-tint p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-72" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}