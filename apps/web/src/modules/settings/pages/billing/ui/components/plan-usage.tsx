"use client";

import { Badge } from "@orra/ui/components/badge";
import { cn } from "@orra/ui/lib/utils";

interface PlanUsageProps {
  used: number;
  limit: number;
  label: string;
  reachedLabel?: string;
}

export function PlanUsage({ used, limit, label, reachedLabel }: PlanUsageProps) {
  const percent = Math.min(100, Math.round((used / limit) * 100));
  const reached = used >= limit;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {reached && <Badge variant="destructive">Limit reached</Badge>}
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            reached
              ? "bg-destructive"
              : "bg-emerald-500 dark:bg-emerald-400",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>

      {reached && reachedLabel && (
        <p className="text-xs text-muted-foreground">{reachedLabel}</p>
      )}
    </div>
  );
}