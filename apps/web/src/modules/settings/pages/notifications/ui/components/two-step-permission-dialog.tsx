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
import { Bell, Shield, CheckCircle2 } from "lucide-react";
import { cn } from "@orra/ui/lib/utils";

interface TwoStepPermissionDialogProps {
  open: boolean;
  isRequesting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TwoStepPermissionDialog({
  open,
  isRequesting,
  onConfirm,
  onCancel,
}: TwoStepPermissionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "flex items-center justify-center rounded-full bg-primary/10 p-3",
            "text-primary"
          )}>
            <Bell className="size-6" />
          </div>
          <div>
            <DialogTitle className="text-lg font-semibold">Enable push notifications?</DialogTitle>
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