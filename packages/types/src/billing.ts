export type PlanTier = "free" | "pro" | "team";
export type PlanPeriod = "monthly" | "yearly";

export const PLAN_LIMITS: Record<
  PlanTier,
  { queries: number; insights: number }
> = {
  free: { queries: 20, insights: 0 },
  pro: { queries: 300, insights: 10 },
  team: { queries: 2_000, insights: 50 },
};

export interface BillingStatus {
  polarConfigured: boolean;
  planTier: PlanTier;
  period: PlanPeriod | null;
  subscriptionId: string | null;
  currentPeriodEnd: string | null;
  currentProductId: string | null;
  quota: { used: number; limit: number };
  insights: { used: number; limit: number };
}

export interface PlanProduct {
  productId: string;
  name: string;
  slug: string;
  tier: PlanTier;
  period: PlanPeriod;
  priceLabel: string;
  price: number;
  description: string;
  highlighted: boolean;
  features: string[];
}
