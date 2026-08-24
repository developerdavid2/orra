"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@orra/ui/components/dialog";
import { Button } from "@orra/ui/components/button";
import {
  Bell,
  Shield,
  CheckCircle2,
  AlertCircle,
  Settings2,
} from "lucide-react";
import { cn } from "@orra/ui/lib/utils";

interface PermissionDialogProps {
  open: boolean;
  isRequesting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "default" | "denied";
  message?: string;
}

export function PermissionDialog({
  open,
  isRequesting,
  onConfirm,
  onCancel,
  variant = "default",
  message,
}: PermissionDialogProps) {
  if (variant === "denied") {
    return (
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={cn(
                "flex items-center justify-center rounded-full bg-destructive/10 p-3",
                "text-destructive",
              )}
            >
              <AlertCircle className="size-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                Notifications blocked
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                You previously blocked notifications. To enable them, please
                allow notifications in your browser settings.
              </DialogDescription>
            </div>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <p className="flex items-center gap-2">
              <span>1. Click the</span>
              <Settings2 />
              <span>next to the address bar</span>
            </p>
            <p>
              2. Toggle{" "}
              <span className="font-semibold text-main">Notifications </span>
              on to "Allow"
            </p>
            <p>3. Refresh this page</p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Not now
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                onCancel();
                // Attempt to open browser settings (works in some browsers)
                if (window.navigator && "permissions" in window.navigator) {
                  // This won't work cross-browser but worth trying
                }
              }}
              className="w-full sm:w-auto"
            >
              Open settings manually
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex items-center gap-3 mb-2">
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-primary/10 p-3",
              "text-primary",
            )}
          >
            <Bell className="size-6" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold">
              Enable push notifications?
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              We'll only send important alerts about your finances.
            </DialogDescription>
          </div>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            <span>Transaction alerts & security warnings</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            <span>Budget limits & spending insights</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-green-500 shrink-0" />
            <span>Works even when app is closed</span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          A browser prompt will appear next — please choose "Allow".
        </p>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isRequesting}
            className="w-full sm:w-auto"
          >
            Not now
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isRequesting}
            className="w-full sm:w-auto"
          >
            {isRequesting ? (
              <>
                <Shield className="size-4 mr-2 animate-spin" />
                Requesting permission...
              </>
            ) : (
              "Allow notifications"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
