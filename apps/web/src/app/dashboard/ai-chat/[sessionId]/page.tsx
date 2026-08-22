// app/ai-chat/[sessionId]/page.tsx
import { CHAT_SESSION_MESSAGES } from "@/modules/chats/constants";
import {
  ChatConversationSkeleton,
  ChatFreshSessionFallback,
} from "@/modules/chats/ui/components/chat-conversation-area";
import { ChatIdView } from "@/modules/chats/ui/views/chat-id-view";
import {
  HydrateClient,
  prefetch,
  prefetchInfinite,
  trpc,
} from "@/trpc/trpc-server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface PageProps {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{
    initialMessage?: string;
    mode?: string;
    model?: string;
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { sessionId } = await params;
  const { initialMessage, mode, model } = await searchParams;

  prefetch(trpc.ai.coach.sessionById.queryOptions({ sessionId, limit: 50 }));
  prefetch(
    trpc.ai.coach.getMessages.infiniteQueryOptions(
      { sessionId, limit: CHAT_SESSION_MESSAGES },
      { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
    ),
  );

  return (
    <HydrateClient>
      <Suspense
        fallback={
          initialMessage ? (
            <ChatFreshSessionFallback message={initialMessage} />
          ) : (
            <ChatConversationSkeleton />
          )
        }
      >
        <ErrorBoundary fallback={<p>Error</p>}>
          <ChatIdView
            sessionId={sessionId}
            initialMessage={initialMessage}
            initialMode={mode === "act" ? "act" : mode === "plan" ? "plan" : undefined}
            initialModel={model}
          />
        </ErrorBoundary>
      </Suspense>
    </HydrateClient>
  );
}
