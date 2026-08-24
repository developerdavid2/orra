import { NotificationsView } from "@/modules/notifications/ui/views/notifications-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/trpc-server";
import { NOTIFICATION_CATEGORY } from "@orra/types";
import { Suspense } from "react";

import { LoadingSkeleton } from "./loading-skeleton";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    status?: string;
    limit?: string;
  }>;
}

const Page = ({ searchParams }: PageProps) => (
  <Suspense fallback={<LoadingSkeleton />}>
    <AsyncPage searchParams={searchParams} />
  </Suspense>
);

export default Page;

async function AsyncPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const parsePositiveInt = (value: string | undefined, fallback: number) => {
    const n = Number.parseInt(value ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const category = params.category;
  const normalizedCategory =
    category &&
    NOTIFICATION_CATEGORY.includes(
      category as (typeof NOTIFICATION_CATEGORY)[number],
    )
      ? (category as (typeof NOTIFICATION_CATEGORY)[number])
      : "all";

  const status =
    params.status === "read" || params.status === "unread"
      ? params.status
      : "all";

  const limit = Math.min(parsePositiveInt(params.limit, 20), 50);

  await Promise.all([
    prefetch(
      trpc.notifications.appNotifications.list.infiniteQueryOptions(
        {
          limit,
          search: params.search?.trim() || undefined,
          category: normalizedCategory,
          status,
        },
        {
          getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        },
      ),
    ),
  ]);

  return (
    <HydrateClient>
      <NotificationsView />
    </HydrateClient>
  );
}
