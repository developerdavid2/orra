"use client";

import { Button } from "@orra/ui/components/button";
import { Card, CardContent, CardHeader } from "@orra/ui/components/card";
import { Loader } from "lucide-react";
import { toast } from "sonner";
import { usePortalUrl } from "../../hooks/mutations/use-portal-url";

export function ManageBillingCard() {
  const portalUrl = usePortalUrl();

  const handleClick = () => {
    const newTab = window.open("", "_blank");

    portalUrl.mutate(undefined, {
      onSuccess: (data) => {
        if (newTab) {
          newTab.location.href = data.url;
          newTab.opener = null;
        }
      },
      onError: (err) => {
        newTab?.close();
        toast.error(
          err instanceof Error ? err.message : "Failed to open customer portal",
        );
      },
    });
  };

  return (
    <Card>
      <CardHeader className="pb-0">
        <p className="text-sm font-semibold text-foreground">Manage billing</p>
        <p className="text-xs text-muted-foreground">
          Update payment methods and download invoices from your customer
          portal.
        </p>
      </CardHeader>

      <CardContent className="pt-4">
        <Button
          variant="outline"
          onClick={handleClick}
          disabled={portalUrl.isPending}
        >
          {portalUrl.isPending && <Loader className="size-4 animate-spin" />}
          {portalUrl.isPending ? "Opening portal..." : "Open customer portal"}
        </Button>
      </CardContent>
    </Card>
  );
}
