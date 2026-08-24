"use client";

import { useStartSession } from "@/modules/chats/hooks/mutations/use-start-session";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import type { ChatMode } from "../../hooks/use-ai-chat";
import { ChatSessionShell } from "./chat-session-shell";
import { ChatStreamMessage } from "./chat-stream-message";
import { ChatTypingIndicator } from "./chat-typing-indicator";

interface Props {
  initialMessage: string;
  mode: ChatMode;
  model: string;
}

export function NewChatContent({ initialMessage, mode, model }: Props) {
  const router = useRouter();
  const startSession = useStartSession();
  const hasCreated = useRef(false);

  useEffect(() => {
    if (hasCreated.current) return;
    if (!initialMessage.trim()) {
      router.replace("/dashboard/ai-chat" as Route);
      return;
    }
    hasCreated.current = true;

    (async () => {
      try {
        const session = await startSession.mutateAsync({
          contextType: "general",
          topic: "general",
          title: initialMessage.slice(0, 50),
        });

        router.replace(
          `/dashboard/ai-chat/${session.id}?initialMessage=${encodeURIComponent(initialMessage)}&mode=${mode}&model=${model}` as Route,
        );
      } catch (err) {
        console.error("[NewChatContent] failed after session creation", err);
        toast.error("Failed to create chat session");
        router.replace("/dashboard/ai-chat" as Route);
      }
    })();
  }, [initialMessage, mode, model, router, startSession]);

  if (!initialMessage.trim()) return null;

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="truncate text-sm font-semibold">&nbsp;</h2>
      </header>

      <ChatSessionShell
        input=""
        isLoading={true}
        onInputChange={() => {}}
        onSubmit={() => {}}
      >
        <div className="min-h-0 w-full mb-42">
          <div className="max-w-4xl mx-auto w-full p-4 space-y-4">
            <ChatStreamMessage
              message={{
                id: "optimistic-user",
                role: "user",
                parts: [{ type: "text", text: initialMessage }],
              }}
              isLast={false}
              isStreaming={false}
              sendMessage={() => {}}
            />
            <ChatTypingIndicator />
          </div>
        </div>
      </ChatSessionShell>
    </div>
  );
}
