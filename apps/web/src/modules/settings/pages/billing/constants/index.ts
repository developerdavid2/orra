import { PLAN_LIMITS, type PlanPeriod } from "@orra/types";

export type PlanSlug = "free" | "pro" | "team";
export type BillingPeriod = PlanPeriod;

export interface Plan {
  slug: PlanSlug;
  name: string;
  description: string;
  pricing: Record<
    "monthly" | "yearly",
    { label: string; price: string; suffix: string }
  >;
  monthly: string;
  monthlySuffix: string;
  yearly: string;
  yearlySuffix: string;
  yearlyEffective: string;
  yearlyBadge: string;
  features: string[];
}

export const PLAN_ORDER: PlanSlug[] = ["free", "pro", "team"];

export const PLAN_RANK: Record<PlanSlug, number> = {
  free: 0,
  pro: 1,
  team: 2,
};
