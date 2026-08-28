"use client";

import { Button } from "@orra/ui/components/button";
import { Card, CardContent, CardHeader } from "@orra/ui/components/card";
import { Loader } from "lucide-react";
import { usePortal } from "../../hooks/mutations/use-portal";

export function ManageBillingCard() {
  const portal = usePortal();

  return (
    <Card>
      <CardHeader className="pb-0">
        <p className="text-sm font-semibold text-foreground">
          Manage billing
        </p>
        <p className="text-xs text-muted-foreground">
          Update payment methods and download invoices from your customer
          portal.
        </p>
      </CardHeader>

      <CardContent className="pt-4">
        <Button
          variant="outline"
          onClick={() => portal.mutate()}
          disabled={portal.isPending}
        >
          {portal.isPending && <Loader className="size-4 animate-spin" />}
          {portal.isPending ? "Opening portal..." : "Open customer portal"}
        </Button>
      </CardContent>
    </Card>
  );
}