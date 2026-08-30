"use client";

import { Tabs, TabsList, TabsTrigger } from "@orra/ui/components/tabs";
import { useState } from "react";
import { toast } from "sonner";
import { PLAN_ORDER, type BillingPeriod, type PlanSlug } from "../../constants";
import { useBillingPlans } from "../../hooks/queries/use-billing-plans";
import { useBillingStatus } from "../../hooks/queries/use-billing-status";
import { useCheckoutUrl } from "../../hooks/mutations/use-checkout-url";
import { usePortalUrl } from "../../hooks/mutations/use-portal-url";
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
  const planTier = status.planTier as PlanSlug;
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const checkoutUrl = useCheckoutUrl();
  const portalUrl = usePortalUrl();

  const currentPlanMeta =
    plans.find((p) => p.productId === status.currentProductId) ??
    plans.find((p) => p.tier === planTier && p.period === "monthly");

  function openCheckout(productId: string) {
    const newTab = window.open("", "_blank");
    setPendingId(productId);
    checkoutUrl.mutate(
      { productId },
      {
        onSuccess: (data) => {
          if (newTab) {
            newTab.location.href = data.url;
            newTab.opener = null;
          }
        },
        onError: (err) => {
          newTab?.close();
          toast.error(
            err instanceof Error ? err.message : "Failed to start checkout",
          );
        },
        onSettled: () => setPendingId(null),
      },
    );
  }

  function openPortal() {
    const newTab = window.open("", "_blank");
    setPendingId("portal");
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
      onSettled: () => setPendingId(null),
    });
  }

  return (
    <div className="space-y-6">
      <CurrentPlanCard
        name={currentPlanMeta?.name ?? planTier}
        description={currentPlanMeta?.description ?? ""}
        priceLabel={currentPlanMeta?.priceLabel ?? "$0 forever"}
        planTier={planTier}
        quota={status.quota}
        insights={status.insights}
        period={status.period}
      />

      <div className="flex items-center justify-between gap-2">
        <Tabs
          value={period}
          onValueChange={(v) => setPeriod(v as BillingPeriod)}
          className="rounded-2xl overflow-hidden border border-muted bg-card shadow"
        >
          <TabsList className="h-9 bg-accent">
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
        <PlanCard
          name="Free"
          description="The essentials to understand your finances"
          features={plans.find((p) => p.tier === "free")?.features ?? []}
          priceLabel="$0 forever"
          isCurrent={planTier === "free"}
          highlighted={false}
        />

        {PLAN_ORDER.filter((s) => s !== "free").map((slug) => {
          const product = plans.find(
            (p) => p.tier === slug && p.period === period,
          );
          if (!product) return null;

          const isCurrent = product.productId === status.currentProductId;
          const isCheckout = !isCurrent;

          return (
            <PlanCard
              key={slug}
              name={product.name}
              description={product.description}
              features={product.features}
              priceLabel={product.priceLabel}
              isCurrent={isCurrent}
              onUpgrade={
                isCurrent
                  ? undefined
                  : isCheckout
                    ? () => openCheckout(product.productId)
                    : openPortal
              }
              isUpgrading={
                pendingId === (isCheckout ? product.productId : "portal")
              }
              upgradeDisabled={!status.polarConfigured}
              upgradeLabel={
                isCheckout ? `Upgrade to ${product.name}` : "Manage in portal"
              }
              highlighted={slug === "pro"}
            />
          );
        })}
      </div>

      {status.polarConfigured && planTier !== "free" && <ManageBillingCard />}
    </div>
  );
}
