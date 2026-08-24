"use client";

import { Card, CardContent, CardHeader } from "@orra/ui/components/card";
import { Switch } from "@orra/ui/components/switch";
import { Shield, AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@orra/ui/lib/utils";

interface PushNotificationsSectionProps {
  pushEnabled: boolean;
  permission: NotificationPermission | "default" | "denied" | "granted";
  isSupported: boolean;
  isLoading: boolean;
  onToggle: (checked: boolean) => void;
  isRegistered: boolean;
  isPermissionDenied: boolean;
  isRevoked: boolean;
}

export function PushNotificationsSection({
  pushEnabled,
  permission,
  isSupported,
  isLoading,
  onToggle,
  isRegistered,
  isPermissionDenied,
  isRevoked,
}: PushNotificationsSectionProps) {
  return (
    <Card className="bg-card dark:drop-shadow-md">
      <CardHeader className="pb-0">
        <div className="flex flex-col gap-2">
          <p className="text-base font-semibold">Push notifications</p>
          <p className="text-sm text-muted-foreground">
            Enable browser push alerts for important account activity.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-main-tint p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Browser push notifications</p>
              <p className="text-sm text-muted-foreground">
                When enabled, you&apos;ll receive push alerts even when the app
                is not active.
              </p>
            </div>
            <Switch
              checked={pushEnabled}
              onCheckedChange={onToggle}
              disabled={!isSupported || isLoading}
            />
          </div>
          
          {/* Status messages based on state */}
          <div className="flex flex-col gap-1 text-sm">
            {!isSupported && (
              <p className={cn("flex items-center gap-1.5", "text-destructive")}>
                <AlertCircle className="size-3.5" />
                Push notifications are not supported in this browser.
              </p>
            )}
            
            {isRevoked && (
              <p className={cn("flex items-center gap-1.5", "text-amber-500")}>
                <AlertCircle className="size-3.5" />
                Permission was revoked in browser settings. 
                <a 
                  href="#" 
                  className="underline hover:text-amber-400"
                  onClick={(e) => e.preventDefault()}
                >
                  Re-enable in browser settings
                </a>
              </p>
            )}
            
            {isPermissionDenied && !isRevoked && (
              <p className={cn("flex items-center gap-1.5", "text-muted-foreground")}>
                <Shield className="size-3.5" />
                Notifications blocked. Enable in browser settings to use push notifications.
              </p>
            )}
            
            {isRegistered && (
              <p className={cn("flex items-center gap-1.5", "text-green-500")}>
                <Shield className="size-3.5" />
                Push notifications active — you&apos;ll receive alerts even when the app is closed.
              </p>
            )}
            
            {!isRegistered && !isPermissionDenied && !isRevoked && isSupported && (
              <p className={cn("flex items-center gap-1.5", "text-muted-foreground")}>
                <Shield className="size-3.5" />
                Click the toggle to enable push notifications.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}