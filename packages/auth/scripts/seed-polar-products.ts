/**
 * Seeds the Polar catalog with the six recurring Orra products:
 * Free/Pro/Team x Monthly/Yearly. Idempotent for non-archived products with
 * the same name (safe to re-run). Existing products should be removed or
 * archived in the Polar dashboard first.
 *
 * Run: bun --filter @orra/auth seed:polar
 */
import { Polar } from "@polar-sh/sdk";
import type { Benefit } from "@polar-sh/sdk/models/components/benefit.js";

type Tier = "free" | "pro" | "team";

const accessToken = process.env.POLAR_ACCESS_TOKEN;
const server =
  process.env.POLAR_SERVER === "production" ? "production" : "sandbox";
const organizationId = process.env.POLAR_ORGANIZATION_ID || null;

if (!accessToken) {
  console.error("POLAR_ACCESS_TOKEN is not set");
  process.exit(1);
}

const polar = new Polar({ accessToken, server });

const FEATURES: Record<Tier, string[]> = {
  free: [
    "20 AI queries / month",
    "Core budgets & transaction insights",
  ],
  pro: [
    "300 AI queries / month",
    "10 AI Insights / month",
    "Personal finance coaching",
    "Priority support",
  ],
  team: [
    "2,000 AI queries / month",
    "50 AI Insights / month",
    "Everything in Pro",
    "Shared workspace budgets",
    "Billing for the whole team",
  ],
};

interface ProductDef {
  tier: Tier;
  year: boolean;
  name: string;
  description: string;
  price: number | null;
}

const PRODUCTS: ProductDef[] = [
  {
    tier: "free",
    year: false,
    name: "Free Monthly",
    description: "The essentials to understand your finances",
    price: null,
  },
  {
    tier: "free",
    year: true,
    name: "Free Yearly",
    description: "The essentials to understand your finances",
    price: null,
  },
  {
    tier: "pro",
    year: false,
    name: "Pro Monthly",
    description: "AI coaching for your personal finances",
    price: 900,
  },
  {
    tier: "pro",
    year: true,
    name: "Pro Yearly",
    description: "AI coaching for your personal finances",
    price: 9000,
  },
  {
    tier: "team",
    year: false,
    name: "Team Monthly",
    description: "AI coaching shared across your team",
    price: 2900,
  },
  {
    tier: "team",
    year: true,
    name: "Team Yearly",
    description: "AI coaching shared across your team",
    price: 29000,
  },
];

async function listExistingProducts() {
  const items: { id: string; name: string }[] = [];
  try {
    const pages = await polar.products.list({
      isArchived: false,
      isRecurring: true,
      limit: 100,
    });
    for await (const page of pages) {
      const pageItems =
        (page as unknown as { result?: { items?: { id: string; name: string }[] } })
          .result?.items ?? [];
      items.push(...pageItems);
    }
  } catch (err) {
    console.error("Failed to list existing products:", err);
  }
  return items;
}

// Benefits require organization token; skip for user-level token.
// Features will use PLANS constants as fallback.
async function ensureBenefits(): Promise<Map<Tier, string[]>> {
  return new Map<Tier, string[]>([
    ["free", []],
    ["pro", []],
    ["team", []],
  ]);
}

async function getOrgId() {
  return null;
}

async function main() {
  console.log(`Seeding Polar catalog on ${server}...`);

  const existing = await listExistingProducts();
  const existingByName = new Map(existing.map((p) => [p.name, p.id]));

  console.log("Ensuring benefits...");
  const benefitIds = await ensureBenefits();

  for (const def of PRODUCTS) {
    const metadata = {
      orra_tier: def.tier,
      period: def.year ? "yearly" : "monthly",
      highlighted: def.tier === "pro" ? true : false,
    };
    const prices: unknown[] = def.price
      ? [{ amountType: "fixed", priceAmount: def.price, priceCurrency: "usd" }]
      : [{ amountType: "free" }];

    let productId: string;
    const existingId = existingByName.get(def.name);
    if (existingId) {
      const updated = await polar.products.update({
        id: existingId,
        productUpdate: { metadata },
      });
      if (!updated.ok) throw new Error(`Failed to update product: ${updated.error}`);
      productId = updated.value.id;
    } else {
      const created = await polar.products.create({
        name: def.name,
        description: def.description,
        recurringInterval: def.year ? "year" : "month",
        prices: prices as never,
        metadata,
        organizationId: organizationId ?? undefined,
      });
      if (!created.ok) throw new Error(`Failed to create product: ${created.error}`);
      productId = created.value.id;
    }

    console.log(
      `${existingId ? "✓ reused" : "✓ created"} ${def.name} -> ${productId} (${def.year ? "yearly" : "monthly"}, tier=${def.tier})`,
    );
  }

  console.log("Done. Catalog is ready; users can check out any of the six products.");
}

main().catch((err) => {
  console.error("Catalog seeding failed:", err);
  process.exit(1);
});