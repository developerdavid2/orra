import { CHAT_SESSIONS_LIMIT } from "@/modules/chats/constants";
import { ChatsView } from "@/modules/chats/ui/views/chats-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/trpc-server";
import { Suspense } from "react";

import { LoadingSkeleton } from "./loading-skeleton";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    topic?: string;
    includeArchived?: string;
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

  // Only prefetch the sessions list - usage loads client-side
  await Promise.all([
    prefetch(
      trpc.ai.coach.sessions.infiniteQueryOptions(
        {
          search: params.search ?? undefined,
          topic:
            (params.topic as
              | "budgeting"
              | "spending"
              | "savings"
              | "general"
              | undefined) ?? undefined,
          includeArchived: params.includeArchived === "true",
          limit: CHAT_SESSIONS_LIMIT,
        },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
      ),
    ),
  ]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <SessionsContent
        search={params.search ?? undefined}
        topic={
          (params.topic as
            | "budgeting"
            | "spending"
            | "savings"
            | "general"
            | undefined) ?? undefined
        }
        includeArchived={params.includeArchived === "true"}
      />
    </Suspense>
  );
}

async function SessionsContent({
  search,
  topic,
  includeArchived,
}: {
  search?: string;
  topic?: "budgeting" | "spending" | "savings" | "general";
  includeArchived: boolean;
}) {
  return (
    <HydrateClient>
      <ChatsView />
    </HydrateClient>
  );
}
