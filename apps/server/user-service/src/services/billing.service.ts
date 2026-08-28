import { db } from "@orra/db";
import { aiUsage } from "@orra/db";
import { PLAN_LIMITS } from "@orra/types";
import type {
  BillingStatus,
  PlanPeriod,
  PlanProduct,
  PlanTier,
} from "@orra/types";
import type { ServiceResult } from "@orra/types";
import type { Product } from "@polar-sh/sdk/models/components/product.js";
import { and, eq } from "drizzle-orm";
import { polarApi } from "../lib/auth";

const TIER_BY_METADATA = (product: Product): "pro" | "team" | null => {
  const raw = product.metadata?.["orra_tier"];
  return raw === "pro" || raw === "team" ? raw : null;
};

const TIER_BY_NAME = (product: Product): "pro" | "team" | null => {
  const name = product.name.toLowerCase();
  return name.includes("team") ? "team" : name.includes("pro") ? "pro" : null;
};

function periodOf(interval?: string | null): PlanPeriod {
  return interval === "year" ? "yearly" : "monthly";
}

const PRODUCT_CACHE = new Map<string, { products: Product[]; at: number }>();
const PRODUCT_CACHE_TTL = 5 * 60 * 1000;

async function getProducts(): Promise<Product[]> {
  const cached = PRODUCT_CACHE.get("all");
  if (cached && Date.now() - cached.at < PRODUCT_CACHE_TTL) {
    return cached.products;
  }
  const products = (await polarApi.listProducts()) ?? [];
  PRODUCT_CACHE.set("all", { products, at: Date.now() });
  return products;
}

function tierForProduct(product: Product): "pro" | "team" {
  return TIER_BY_METADATA(product) ?? TIER_BY_NAME(product) ?? "pro";
}

export const BillingService = {
  async status(userId: string): Promise<ServiceResult<BillingStatus>> {
    try {
      const customerState = await polarApi.getCustomerState(userId);
      const active = customerState?.activeSubscriptions?.[0];

      let planTier: PlanTier = "free";
      let period: PlanPeriod | null = null;
      let subscriptionId: string | null = null;
      let currentPeriodEnd: string | null = null;

      if (active) {
        const products = await getProducts();
        const product =
          products.find((p) => p.id === active.productId) ??
          (await polarApi.getProduct(active.productId));
        if (product) {
          planTier = tierForProduct(product);
        }
        period = periodOf(active.recurringInterval);
        subscriptionId = active.id;
        currentPeriodEnd = active.currentPeriodEnd
          ? new Date(active.currentPeriodEnd).toISOString()
          : null;
      }

      const now = new Date();
      const [usage] = await db
        .select({
          queryCount: aiUsage.queryCount,
          insightCount: aiUsage.insightCount,
        })
        .from(aiUsage)
        .where(
          and(
            eq(aiUsage.userId, userId),
            eq(aiUsage.month, now.getMonth() + 1),
            eq(aiUsage.year, now.getFullYear()),
          ),
        )
        .limit(1);

      return {
        success: true,
        data: {
          polarConfigured: polarApi.isConfigured,
          planTier,
          period,
          subscriptionId,
          currentPeriodEnd,
          quota: {
            used: usage?.queryCount ?? 0,
            limit: PLAN_LIMITS[planTier].queries,
          },
          insights: {
            used: usage?.insightCount ?? 0,
            limit: PLAN_LIMITS[planTier].insights,
          },
        },
      };
    } catch (err) {
      console.error("[BillingService.status]", err);
      return {
        success: false,
        error: "Failed to fetch billing status",
        code: "DB_ERROR",
      };
    }
  },

  async plans(): Promise<ServiceResult<PlanProduct[]>> {
    try {
      const products = await getProducts();
      const plans: PlanProduct[] = [];

      for (const product of products) {
        const tier = tierForProduct(product);
        const price = product.prices?.[0] as
          | { amount?: number; currency?: string }
          | undefined;
        const rawInterval = "recurringInterval" in (price ?? {})
          ? (
              price as unknown as {
                recurringInterval?: "month" | "year";
              }
            ).recurringInterval
          : undefined;
        const period = periodOf(rawInterval ?? "month");

        plans.push({
          productId: product.id,
          name: product.name,
          slug: tier,
          tier,
          period,
          priceLabel: `$${price?.amount ?? 0}${period === "yearly" ? " / year" : " / month"}`,
        });
      }

      return { success: true, data: plans };
    } catch (err) {
      console.error("[BillingService.plans]", err);
      return {
        success: false,
        error: "Failed to fetch plans",
        code: "DB_ERROR",
      };
    }
  },
};