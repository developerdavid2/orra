"use client";

import { Button } from "@orra/ui/components/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

type PlanTier = "free" | "pro" | "team";

interface ChatQuotaBannerProps {
  planTier: PlanTier;
}

export function ChatQuotaBanner({ planTier }: ChatQuotaBannerProps) {
  const isFree = planTier === "free";
  const upgradeText = isFree ? "Upgrade to Pro" : "Manage billing";

  return (
    <div className="flex items-center gap-3 border-b border-border bg-amber-500/10 px-4 py-2.5">
      <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <p className="flex-1 text-xs text-amber-700 dark:text-amber-300">
        {isFree
          ? "You&apos;ve reached your free AI query limit for this month."
          : "You&apos;ve reached your AI query limit for this month."}
      </p>
      <Button
        asChild
        variant="link"
        className="h-auto px-0 text-xs font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-300"
      >
        <Link href="/dashboard/settings/billing">{upgradeText}</Link>
      </Button>
    </div>
  );
}