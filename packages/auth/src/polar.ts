import type { CustomerState } from "@polar-sh/sdk/models/components/customerstate";
import type { Product } from "@polar-sh/sdk/models/components/product";
import { Polar } from "@polar-sh/sdk";
import type { AuthConfig } from "./index";

export type PolarApi = {
  isConfigured: boolean;
  getCustomerState(userId: string): Promise<CustomerState | null>;
  getProduct(productId: string): Promise<Product | null>;
  listProducts(): Promise<Product[] | null>;
};

const notConfigured: PolarApi = {
  isConfigured: false,
  async getCustomerState() {
    return null;
  },
  async getProduct() {
    return null;
  },
  async listProducts() {
    return null;
  },
};

export function buildPolarApi(config?: AuthConfig["polar"]): PolarApi {
  if (!config?.accessToken) {
    return notConfigured;
  }

  const client = new Polar({
    accessToken: config.accessToken,
    server: config.server ?? "sandbox",
  });

  return {
    isConfigured: true,

    async getCustomerState(userId) {
      try {
        return await client.customers.getStateExternal({ externalId: userId });
      } catch {
        return null;
      }
    },

    async getProduct(productId) {
      try {
        return await client.products.get({ id: productId });
      } catch {
        return null;
      }
    },

    async listProducts() {
      try {
        const pages = await client.products.list({
          isArchived: false,
          isRecurring: true,
          sorting: ["price_amount"],
        });
        const items: Product[] = [];
        for await (const page of pages) {
          const pageItems =
            (page as unknown as { result?: { items?: Product[] } }).result
              ?.items ?? [];
          items.push(...pageItems);
        }
        return items;
      } catch {
        return null;
      }
    },
  };
}