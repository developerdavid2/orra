"use client";

import { Badge } from "@orra/ui/components/badge";
import { Card, CardContent, CardHeader } from "@orra/ui/components/card";
import { Crown } from "lucide-react";
import { PLANS, type PlanSlug } from "../../constants";
import { PlanUsage } from "./plan-usage";

interface Quota {
  used: number;
  limit: number;
}

interface CurrentPlanCardProps {
  planTier: PlanSlug;
  quota: Quota;
  insights: Quota;
  period: "monthly" | "yearly" | null;
}

export function CurrentPlanCard({
  planTier,
  quota,
  insights,
  period,
}: CurrentPlanCardProps) {
  const plan = PLANS.find((p) => p.slug === planTier) ?? PLANS[0];
  const isFree = planTier === "free";

  return (
    <Card>
      <CardHeader className="pb-0">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-accent">
            <Crown className="size-4 text-muted-foreground" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-foreground">
                Current plan
              </p>
              <Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Active
              </Badge>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              {plan.description}
            </p>
          </div>

          <div className="text-right">
            <p className="text-lg font-semibold tracking-tight">
              {plan.name}
              {!isFree && period ? ` · ${period}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {isFree ? `${plan.monthly} ${plan.monthlySuffix}` : ""}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <PlanUsage
          used={quota.used}
          limit={quota.limit}
          label={`${quota.used} / ${quota.limit} AI queries this month`}
          reachedLabel="You have reached your monthly query limit. Upgrade for more."
        />

        {isFree ? (
          <p className="text-sm text-muted-foreground">
            AI Insights — included in Pro &amp; Team
          </p>
        ) : (
          <PlanUsage
            used={insights.used}
            limit={insights.limit}
            label={`${insights.used} / ${insights.limit} AI Insights this month`}
            reachedLabel="You have reached your monthly AI Insights limit."
          />
        )}
      </CardContent>
    </Card>
  );
}
