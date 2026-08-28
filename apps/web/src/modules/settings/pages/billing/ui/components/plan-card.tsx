"use client";

import { Badge } from "@orra/ui/components/badge";
import { Button } from "@orra/ui/components/button";
import { Card, CardContent, CardHeader } from "@orra/ui/components/card";
import { cn } from "@orra/ui/lib/utils";
import { Check, Loader } from "lucide-react";
import type { Plan, BillingPeriod } from "../../constants";

interface PlanCardProps {
  plan: Plan;
  period: BillingPeriod;
  isCurrent?: boolean;
  onUpgrade?: () => void;
  isUpgrading?: boolean;
  upgradeDisabled?: boolean;
  upgradeLabel?: string;
}

export function PlanCard({
  plan,
  period,
  isCurrent = false,
  onUpgrade,
  isUpgrading = false,
  upgradeDisabled = false,
  upgradeLabel,
}: PlanCardProps) {
  const pricing = plan.pricing[period];
  const yearly = period === "yearly";

  return (
    <Card
      className={cn(
        "flex flex-col bg-card",
        isCurrent && "border-primary/40 ring-1 ring-primary/30",
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-semibold">{plan.name}</p>
          {isCurrent ? (
            <Badge>Current plan</Badge>
          ) : (
            yearly &&
            plan.yearlyBadge && (
              <Badge
                variant="secondary"
                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                {plan.yearlyBadge}
              </Badge>
            )
          )}
        </div>

        <p className="text-sm text-muted-foreground">{plan.description}</p>

        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
            {pricing.price}
          </span>
          <span className="text-xs text-muted-foreground">
            {pricing.suffix}
          </span>
        </div>

        {yearly && plan.yearlyEffective && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {plan.yearlyEffective} when billed yearly
          </p>
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5 pt-0">
        <ul className="space-y-2">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>

        {onUpgrade && (
          <div className="mt-auto">
            <Button
              onClick={onUpgrade}
              disabled={isUpgrading || upgradeDisabled}
              variant={plan.slug === "pro" ? "default" : "outline"}
              className="w-full"
            >
              {isUpgrading && <Loader className="size-4 animate-spin" />}
              {isUpgrading
                ? "Redirecting..."
                : (upgradeLabel ?? `Upgrade to ${plan.name}`)}
            </Button>

            {upgradeDisabled && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Billing is coming soon
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
