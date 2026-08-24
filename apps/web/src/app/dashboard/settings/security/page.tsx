import { SecuritySettingsView } from "@/modules/settings/pages/security/ui/views/security-settings-view";
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
    prefetch(trpc.users.security.getSessions.queryOptions()),
    prefetch(trpc.users.security.get2FAStatus.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <SecuritySettingsView />
    </HydrateClient>
  );
}
