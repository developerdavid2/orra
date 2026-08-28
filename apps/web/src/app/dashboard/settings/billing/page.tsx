import { BillingSettingsView } from "@/modules/settings/pages/billing/ui/views/billing-settings-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/trpc-server";
import { Suspense } from "react";

import { LoadingSkeleton } from "./loading-skeleton";

const Page = () => (
  <Suspense fallback={<LoadingSkeleton />}>
    <AsyncPage />
  </Suspense>
);

export default Page;

async function AsyncPage() {
  await prefetch(trpc.users.billing.status.queryOptions());

  return (
    <HydrateClient>
      <BillingSettingsView />
    </HydrateClient>
  );
}