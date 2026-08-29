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

const TIER_BY_METADATA = (product: Product): PlanTier | null => {
  const raw = product.metadata?.["orra_tier"];
  if (raw === "free" || raw === "pro" || raw === "team") return raw;
  return null;
};

const TIER_BY_NAME = (product: Product): PlanTier | null => {
  const name = product.name.toLowerCase();
  if (name.includes("team")) return "team";
  if (name.includes("pro")) return "pro";
  if (name.includes("free")) return "free";
  return null;
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

function tierForProduct(product: Product): PlanTier {
  return TIER_BY_METADATA(product) ?? TIER_BY_NAME(product) ?? "pro";
}

function highlightedOf(product: Product): boolean {
  return product.metadata?.["highlighted"] === true;
}

function featuresOf(product: Product): string[] {
  return (product.benefits ?? [])
    .map((b) => (b as { description?: string }).description)
    .filter((d): d is string => Boolean(d));
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
      let currentProductId: string | null = null;

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
        currentProductId = active.productId;
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
          currentProductId,
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
        if (!tier) continue;

        const price = product.prices?.[0] as
          | {
              amount?: number;
              priceAmount?: number;
              recurringInterval?: string | null;
              currency?: string;
            }
          | undefined;

        const rawInterval =
          product.recurringInterval ?? price?.recurringInterval ?? "month";
        const period = periodOf(rawInterval);
        const cents = price?.priceAmount ?? price?.amount ?? 0;
        const priceAmount = cents / 100; // Polar amounts are in cents
        const currency = price?.currency ?? "USD";

        const formatter = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        });
        const priceLabel =
          priceAmount === 0
            ? "$0 forever"
            : `${formatter.format(priceAmount)}${period === "yearly" ? " / year" : " / month"}`;

        plans.push({
          productId: product.id,
          name: product.name,
          slug: tier,
          tier,
          period,
          priceLabel,
          price: priceAmount,
          highlighted: highlightedOf(product),
          features: featuresOf(product),
          description: product.description ?? "",
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

  async checkoutUrl(
    userId: string,
    productId: string,
  ): Promise<ServiceResult<{ url: string }>> {
    const result = await polarApi.createCheckout(userId, productId);
    if (!result) {
      return {
        success: false,
        error: "Failed to start checkout",
        code: "DB_ERROR",
      };
    }
    return { success: true, data: result };
  },

  async portalUrl(userId: string): Promise<ServiceResult<{ url: string }>> {
    const result = await polarApi.createCustomerPortalSession(userId);
    if (!result) {
      return {
        success: false,
        error: "Failed to load billing portal",
        code: "DB_ERROR",
      };
    }
    return { success: true, data: result };
  },
};
