import { NotificationsSettingsView } from "@/modules/settings/pages/notifications/ui/views/notification-settings-view";
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
    prefetch(trpc.notifications.appNotifications.getPreferences.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <NotificationsSettingsView />
    </HydrateClient>
  );
}
