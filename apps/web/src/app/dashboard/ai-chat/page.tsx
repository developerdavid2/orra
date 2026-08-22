import { CHAT_SESSIONS_LIMIT } from "@/modules/chats/constants";
import { ChatsView } from "@/modules/chats/ui/views/chats-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/trpc-server";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    topic?: string;
    includeArchived?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

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
  );

  prefetch(trpc.ai.coach.usage.queryOptions());

  return (
    <HydrateClient>
      <ChatsView />
    </HydrateClient>
  );
}
