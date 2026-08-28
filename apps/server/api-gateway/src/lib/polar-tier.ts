import { gatewayEnv } from "@orra/env/gateway";
import { getRedisClient } from "@orra/redis/client";
import { Polar } from "@polar-sh/sdk";

const redis = getRedisClient(gatewayEnv.REDIS_URL);
const CACHE_TTL_SECONDS = 90;
const PRODUCTS_TTL = 5 * 60 * 1000;
const CACHE_KEY_PREFIX = "polar:tier:";

type Tier = "free" | "pro" | "team";

let polarClient: Polar | null = null;
let productsCache: { items: Map<string, unknown>; at: number } | null = null;

function client(): Polar | null {
  if (!gatewayEnv.POLAR_ACCESS_TOKEN) {
    return null;
  }
  if (!polarClient) {
    polarClient = new Polar({
      accessToken: gatewayEnv.POLAR_ACCESS_TOKEN,
      server: gatewayEnv.POLAR_SERVER,
    });
  }
  return polarClient;
}

async function getProductsByMetadata(): Promise<Map<string, unknown>> {
  if (productsCache && Date.now() - productsCache.at < PRODUCTS_TTL) {
    return productsCache.items;
  }

  const items = new Map<string, unknown>();
  try {
    const pages = await client()!.products.list({
      isArchived: false,
      isRecurring: true,
      sorting: ["price_amount"],
    });
    for await (const page of pages) {
      const pageItems =
        (page as unknown as { result?: { items?: Array<{ id: string }> } })
          .result?.items ?? [];
      for (const item of pageItems) {
        items.set(item.id, item);
      }
    }
  } catch (err) {
    console.error("[gateway.polar] products.list failed", err);
  }

  productsCache = { items, at: Date.now() };
  return items;
}

async function tierFromPolar(userId: string): Promise<Tier> {
  const c = client();
  if (!c) {
    return "free";
  }

  let tier: Tier = "free";
  try {
    const state = await c.customers.getStateExternal({ externalId: userId });
    const active = state?.activeSubscriptions?.[0];
    if (active) {
      const products = await getProductsByMetadata();
      const product = (products.get(active.productId) as
        | { metadata?: Record<string, unknown> }
        | undefined);
      const raw = product?.metadata?.["orra_tier"];
      tier = raw === "pro" || raw === "team" ? raw : "free";
    }
  } catch {
    tier = "free";
  }
  return tier;
}

export async function resolvePlanTier(userId: string): Promise<Tier> {
  const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached === "free" || cached === "pro" || cached === "team") {
      return cached as Tier;
    }
  } catch {}

  const tier = await tierFromPolar(userId);

  try {
    await redis.set(cacheKey, tier, "EX", CACHE_TTL_SECONDS);
  } catch {}
  return tier;
}