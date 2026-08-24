"use client";

import { InfiniteScroll } from "@/components/infinite-scroll";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@orra/ui/components/ai-elements/conversation";
import { Avatar, AvatarFallback } from "@orra/ui/components/avatar";
import { Button } from "@orra/ui/components/button";
import { Skeleton } from "@orra/ui/components/skeleton";
import { AlertCircle, ArchiveRestore, Bot } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { CHAT_SESSION_MESSAGES } from "../../constants";
import { useUnarchiveSession } from "../../hooks/mutations/use-unarchive-session";
import { useMessages } from "../../hooks/queries/use-messages";
import { useSessionDetails } from "../../hooks/queries/use-session-details";
import { useAIChat, type ChatMode } from "../../hooks/use-ai-chat";
import { dbMessageToChatMessage } from "../../lib/message-parts";
import { ChatContextPill } from "./chat-context-pill";
import { ChatInput } from "./chat-input";
import { ChatSessionShell } from "./chat-session-shell";
import { ChatStreamMessage } from "./chat-stream-message";
import type { SupportedChatModelId } from "@orra/types";
import { ChatTypingIndicator } from "./chat-typing-indicator";
import { cn } from "@orra/ui/lib/utils";

interface Props {
  sessionId: string;
  initialMessage?: string;
  initialMode?: ChatMode;
  initialModel?: SupportedChatModelId;
}

export function ChatConversationArea({
  sessionId,
  initialMessage,
  initialMode,
  initialModel,
}: Props) {
  const { sessionData } = useSessionDetails(sessionId);
  const archivedAt = sessionData?.session.archivedAt;
  const isArchived = archivedAt !== null && archivedAt !== undefined;

  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(sessionId, CHAT_SESSION_MESSAGES);

  const {
    messages: streamingMessages,
    input,
    handleInputChange,
    handleSubmit,
    sendMessage,
    stop,
    isLoading,
    status,
    mode,
    setMode,
    model,
    setModel,
  } = useAIChat({ sessionId, initialMode, initialModel });

  const unarchiveSession = useUnarchiveSession();

  const persistedMessages =
    messagesData?.pages
      .slice()
      .reverse()
      .flatMap((page) => page.items) ?? [];

  const streamingIds = new Set(streamingMessages.map((message) => message.id));

  const autoSentInitialFor = useRef<string | null>(null);
  useEffect(() => {
    if (!initialMessage) return;
    if (autoSentInitialFor.current === sessionId) return;
    if (persistedMessages.length > 0) return;
    autoSentInitialFor.current = sessionId;
    sendMessage(initialMessage);
  }, [initialMessage, sessionId, persistedMessages.length, sendMessage]);

  const handleUnarchive = () => {
    unarchiveSession.mutate(
      { sessionId },
      {
        onSuccess: () => toast.success("Conversation unarchived"),
        onError: () => toast.error("Failed to unarchive"),
      },
    );
  };

  if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <AlertCircle className="size-5 text-destructive" />
          <p className="text-sm text-muted-foreground">
            Invalid session. Please refresh and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="truncate text-sm font-semibold">
            {sessionData?.session.title ?? "Chat"}
          </h2>
          {sessionData?.session.contextType !== "general" && (
            <ChatContextPill sessionId={sessionId} />
          )}
        </div>
      </header>

      <ChatSessionShell
        input={input}
        isLoading={isLoading}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onStop={stop}
        status={status}
        mode={mode}
        onModeChange={setMode}
        model={model}
        onModelChange={setModel}
        footerOverride={
          isArchived ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-muted-foreground text-center">
                This conversation is archived. To continue, please unarchive it
                first.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnarchive}
                disabled={unarchiveSession.isPending}
                className="gap-2"
              >
                {unarchiveSession.isPending ? (
                  <span className="size-4 rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ArchiveRestore className="size-4" />
                )}
                Unarchive
              </Button>
            </div>
          ) : undefined
        }
      >
        <Conversation className="min-h-0 w-full mb-42">
          <ConversationContent className="max-w-4xl mx-auto w-full p-4 space-y-4">
            <InfiniteScroll
              hasNextPage={hasNextPage ?? false}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              isManual={false}
              hideEndMessage
              isLoading={false}
            />

            {persistedMessages
              .filter((message) => !streamingIds.has(message.id))
              .map((message) => (
                <ChatStreamMessage
                  key={message.id}
                  message={dbMessageToChatMessage(message)}
                  isLast={false}
                  isStreaming={false}
                  sendMessage={sendMessage}
                />
              ))}
            {!isArchived &&
              streamingMessages.map((message, index) => (
                <ChatStreamMessage
                  key={message.id}
                  message={message}
                  isLast={index === streamingMessages.length - 1}
                  isStreaming={isLoading}
                  sendMessage={sendMessage}
                />
              ))}

            {isLoading &&
              streamingMessages[streamingMessages.length - 1]?.role ===
                "user" && <ChatTypingIndicator />}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </ChatSessionShell>
    </div>
  );
}
function SkeletonMessageRow({
  width,
  isUser,
}: {
  width: number;
  isUser: boolean;
}) {
  return (
    <div
      className={cn("flex gap-3", isUser && "flex-row-reverse justify-start")}
    >
      {isUser ? (
        <Skeleton className="size-8 shrink-0 rounded-full bg-gray-200/70 dark:bg-accent" />
      ) : (
        <Skeleton className="size-8 shrink-0 rounded-full bg-primary/20" />
      )}
      <div
        className={cn(
          "flex-1 space-y-2",
          isUser ? "flex flex-col items-end" : "max-w-[60%]",
        )}
      >
        <Skeleton
          className="h-12 bg-gray-200/70 dark:bg-accent"
          style={{ width: `${width}%`, maxWidth: isUser ? "60%" : "100%" }}
        />
      </div>
    </div>
  );
}

function SkeletonMessages() {
  const rows = [
    { width: 50, isUser: false },
    { width: 40, isUser: true },
    { width: 30, isUser: false },
    { width: 20, isUser: true },
    { width: 70, isUser: false },
    { width: 20, isUser: true },
  ];

  return (
    <div className="no-scrollbar flex-1 space-y-10 overflow-y-auto p-4 mb-42">
      <div className="max-w-4xl mx-auto w-full space-y-12">
        {rows.map((row, i) => (
          <SkeletonMessageRow key={i} width={row.width} isUser={row.isUser} />
        ))}
      </div>
    </div>
  );
}

function DisabledFooter() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto w-full p-4 pointer-events-none opacity-50">
        <ChatInput
          variant="compact"
          input=""
          isLoading={false}
          onInputChange={() => {}}
          onSubmit={() => {}}
        />
      </div>
    </div>
  );
}

export function ChatConversationSkeleton() {
  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center border-b px-4 py-3">
        <Skeleton className="h-4 w-48" />
      </header>

      <div className="relative flex min-h-0 w-full flex-1 flex-col mx-auto">
        <SkeletonMessages />
        <DisabledFooter />
      </div>
    </div>
  );
}

export function ChatFreshSessionFallback({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="truncate text-sm font-semibold">&nbsp;</h2>
      </header>

      <div className="relative flex min-h-0 w-full flex-1 flex-col mx-auto">
        <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-4 pb-32">
          <div className="max-w-4xl mx-auto w-full space-y-4">
            <ChatStreamMessage
              message={{
                id: "fresh-session-pending-user",
                role: "user",
                parts: [{ type: "text", text: message }],
              }}
              isLast={false}
              isStreaming={false}
              sendMessage={() => {}}
            />
            <ChatTypingIndicator />
          </div>
        </div>
        <DisabledFooter />
      </div>
    </div>
  );
}
