import { ConnectedBanksView } from "@/modules/settings/pages/connected-banks/ui/views/connected-banks-view";
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
    prefetch(trpc.payments.plaid.getConnectedBanks.queryOptions()),
    prefetch(trpc.payments.accounts.listAll.queryOptions({ isManual: false })),
  ]);

  return (
    <HydrateClient>
      <ConnectedBanksView />
    </HydrateClient>
  );
}
