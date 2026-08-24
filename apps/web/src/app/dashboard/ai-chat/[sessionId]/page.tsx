import { CHAT_SESSION_MESSAGES } from "@/modules/chats/constants";
import {
  ChatConversationSkeleton,
  ChatFreshSessionFallback,
} from "@/modules/chats/ui/components/chat-conversation-area";
import { ChatIdView } from "@/modules/chats/ui/views/chat-id-view";
import {
  HydrateClient,
  prefetch,
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

const Page = ({ params, searchParams }: PageProps) => (
  // params/searchParams resolve instantly, so the payload streams right away
  // and this boundary takes over from loading.tsx — no ancestor skeleton.
  <Suspense fallback={<ChatConversationSkeleton />}>
    <ChatSessionRoute params={params} searchParams={searchParams} />
  </Suspense>
);

export default Page;

async function ChatSessionRoute({ params, searchParams }: PageProps) {
  const { sessionId } = await params;
  const { initialMessage, mode, model } = await searchParams;

  return (
    <Suspense
      key={sessionId}
      fallback={
        initialMessage ? (
          <ChatFreshSessionFallback message={initialMessage} />
        ) : (
          <ChatConversationSkeleton />
        )
      }
    >
      <SessionContent
        sessionId={sessionId}
        initialMessage={initialMessage}
        mode={mode}
        model={model}
      />
    </Suspense>
  );
}

async function SessionContent({
  sessionId,
  initialMessage,
  mode,
  model,
}: {
  sessionId: string;
  initialMessage?: string;
  mode?: string;
  model?: string;
}) {
  await Promise.all([
    prefetch(trpc.ai.coach.sessionById.queryOptions({ sessionId, limit: 50 })),
    prefetch(
      trpc.ai.coach.getMessages.infiniteQueryOptions(
        { sessionId, limit: CHAT_SESSION_MESSAGES },
        { getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined },
      ),
    ),
  ]);

  return (
    <HydrateClient>
      <ErrorBoundary fallback={<p>Error</p>}>
        <ChatIdView
          sessionId={sessionId}
          initialMessage={initialMessage}
          initialMode={
            mode === "act" ? "act" : mode === "plan" ? "plan" : undefined
          }
          initialModel={model}
        />
      </ErrorBoundary>
    </HydrateClient>
  );
}
