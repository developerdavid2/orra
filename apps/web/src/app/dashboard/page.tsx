import { DashboardView } from "@/modules/dashboard/ui/views/dashboard-view";
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
  await Promise.all([
    prefetch(trpc.payments.accounts.aggregateByType.queryOptions()),
    prefetch(trpc.payments.accounts.list.queryOptions()),
    prefetch(trpc.payments.transactions.currentMonthSpending.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <DashboardView />
    </HydrateClient>
  );
}
