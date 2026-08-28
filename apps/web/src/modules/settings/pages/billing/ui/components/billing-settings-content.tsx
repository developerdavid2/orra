"use client";

import { Tabs, TabsList, TabsTrigger } from "@orra/ui/components/tabs";
import { useState } from "react";
import { PLAN_RANK, PLANS, type BillingPeriod, type PlanSlug } from "../../constants";
import { useBillingPlans } from "../../hooks/queries/use-billing-plans";
import { useBillingStatus } from "../../hooks/queries/use-billing-status";
import { useCheckout } from "../../hooks/mutations/use-checkout";
import { CurrentPlanCard } from "./current-plan-card";
import { ManageBillingCard } from "./manage-billing-card";
import { PlanCard } from "./plan-card";

const BILLING_PERIODS: { value: BillingPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export function BillingSettingsContent() {
  const { data: status } = useBillingStatus();
  const { data: plans = [] } = useBillingPlans();
  const checkout = useCheckout();
  const planTier = status.planTier as PlanSlug;
  const [period, setPeriod] = useState<BillingPeriod>("monthly");

  return (
    <div className="space-y-6">
      <CurrentPlanCard
        planTier={planTier}
        quota={status.quota}
        insights={status.insights}
        period={status.period}
      />

      <div className="flex flex-col gap-2">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as BillingPeriod)}>
          <TabsList className="h-9">
            {BILLING_PERIODS.map((p) => (
              <TabsTrigger key={p.value} value={p.value} className="px-4">
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {period === "yearly" && (
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Save 17% · 2 months free when billed yearly
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = plan.slug === planTier;
          const isUpgrade = PLAN_RANK[plan.slug] > PLAN_RANK[planTier];
          const product = plans.find(
            (p) => p.tier === plan.slug && p.period === period,
          );
          const isUpgrading = checkout.isPending && checkout.variables === product?.productId;

          return (
            <PlanCard
              key={plan.slug}
              plan={plan}
              period={period}
              isCurrent={isCurrent}
              isUpgrading={isUpgrading}
              upgradeDisabled={!status.polarConfigured}
              onUpgrade={
                isCurrent || !isUpgrade || !product
                  ? undefined
                  : () => checkout.mutate(product.productId)
              }
            />
          );
        })}
      </div>

      {status.polarConfigured && planTier !== "free" && <ManageBillingCard />}
    </div>
  );
}