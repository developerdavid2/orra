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

export const PLANS: Plan[] = [
  {
    slug: "free",
    name: "Free",
    description: "The essentials to understand your finances",
    pricing: {
      monthly: { label: "$0", price: "$0", suffix: "forever" },
      yearly: { label: "$0", price: "$0", suffix: "forever" },
    },
    monthly: "$0",
    monthlySuffix: "forever",
    yearly: "$0",
    yearlySuffix: "forever",
    yearlyEffective: "$0/mo",
    yearlyBadge: "",
    features: [
      `${PLAN_LIMITS.free.queries} AI queries / month`,
      "Core budgets & transaction insights",
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    description: "AI coaching for your personal finances",
    pricing: {
      monthly: { label: "$9", price: "$9", suffix: "/ month" },
      yearly: { label: "$90", price: "$90", suffix: "/ year" },
    },
    monthly: "$9",
    monthlySuffix: "/ month",
    yearly: "$90",
    yearlySuffix: "/ year",
    yearlyEffective: "$7.50/mo",
    yearlyBadge: "2 months free · Save 17%",
    features: [
      `${PLAN_LIMITS.pro.queries} AI queries / month`,
      `${PLAN_LIMITS.pro.insights} AI Insights / month`,
      "Personal finance coaching",
      "Priority support",
    ],
  },
  {
    slug: "team",
    name: "Team",
    description: "AI coaching shared across your team",
    pricing: {
      monthly: { label: "$29", price: "$29", suffix: "/ month" },
      yearly: { label: "$290", price: "$290", suffix: "/ year" },
    },
    monthly: "$29",
    monthlySuffix: "/ month",
    yearly: "$290",
    yearlySuffix: "/ year",
    yearlyEffective: "$24.17/mo",
    yearlyBadge: "Save 17%",
    features: [
      `${PLAN_LIMITS.team.queries} AI queries / month`,
      `${PLAN_LIMITS.team.insights} AI Insights / month`,
      "Everything in Pro",
      "Shared workspace budgets",
      "Billing for the whole team",
    ],
  },
];

export const PLAN_RANK: Record<PlanSlug, number> = {
  free: 0,
  pro: 1,
  team: 2,
};
