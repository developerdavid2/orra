"use client";

import { useChat as useAiChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type InferUITools,
  lastAssistantMessageIsCompleteWithToolCalls,
  type LanguageModelUsage,
  type UIMessage,
} from "ai";
import {
  DEFAULT_CHAT_MODEL_ID,
  findSupportedChatModel,
  type SupportedChatModelId,
  type ToolContracts,
  type ToolMode,
} from "@orra/types";
import { webEnv } from "@orra/env/web";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { normalizeChatMessages } from "../lib/message-parts";

export type { ChatMessage } from "../lib/message-parts";

// ============================================================================
// NightCode pattern: Type chain from ToolContracts → InferUITools → ChatTools
// ============================================================================

type ChatTools = {
  [Name in keyof InferUITools<ToolContracts>]: {
    input: InferUITools<ToolContracts>[Name]["input"];
    output: unknown;
  };
};

export type ChatMessageMetadata = {
  mode?: ToolMode;
  model?: SupportedChatModelId | string;
  durationMs?: number;
  usage?: LanguageModelUsage;
};

export type Message = UIMessage<ChatMessageMetadata, never, ChatTools>;

export type ChatMode = ToolMode;

export function useAIChat({
  sessionId,
  initialMode,
  initialModel,
}: {
  sessionId: string;
  initialMode?: ToolMode;
  initialModel?: SupportedChatModelId | string;
}) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>(initialMode ?? "plan");
  const [model, setModel] = useState<SupportedChatModelId>(
    // Old chats/URLs can carry decommissioned model ids (e.g. Groq shut down
    // llama-3.3-70b-versatile on 08/16/26) — only accept ids still registered.
    initialModel && findSupportedChatModel(initialModel)
      ? (initialModel as SupportedChatModelId)
      : DEFAULT_CHAT_MODEL_ID,
  );
  const prevSessionId = useRef(sessionId);

  const isLocal = window.location.hostname === "localhost";
  const url = isLocal
    ? `${webEnv.NEXT_PUBLIC_SERVER_URL}/v1/ai/chat/stream`
    : `/api/stream/chat`;

  const transport = useMemo(() => {
    return new DefaultChatTransport<Message>({
      api: url,
      credentials: "include",
      prepareSendMessagesRequest({ messages }) {
        const message = messages[messages.length - 1];
        if (!message) throw new Error("No message to send");

        return {
          body: {
            sessionId,
            messages,
            mode: message.metadata?.mode ?? mode,
            model: message.metadata?.model ?? model,
          },
        };
      },
    });
  }, [sessionId, url, mode, model]);

  const chat = useAiChat<Message>({
    id: sessionId,
    transport,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  useEffect(() => {
    if (prevSessionId.current !== sessionId) {
      prevSessionId.current = sessionId;
      chat.setMessages([]);
      setInput("");
    }
  }, [chat, sessionId]);

  useEffect(() => {
    if (chat.error) {
      console.error("[useAIChat] stream error:", chat.error);
      toast.error("Something went wrong", {
        description: "We couldn't finish that response. Please try again.",
      });
    }
  }, [chat.error]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    chat.sendMessage({
      text: trimmed,
      metadata: {
        mode,
        model,
      },
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  const hasPendingToolCall = chat.messages.some(
    (m) =>
      m.role === "assistant" &&
      m.parts?.some((p) => {
        if (typeof p.type !== "string" || !p.type.startsWith("tool-"))
          return false;
        const state = (p as any).state;
        return state !== "output-available" && state !== "output-error";
      }),
  );

  return {
    messages: normalizeChatMessages(chat.messages),
    input,
    handleInputChange,
    handleSubmit,
    isLoading:
      chat.status === "streaming" ||
      chat.status === "submitted" ||
      hasPendingToolCall,
    error: chat.error,
    setMessages: chat.setMessages,
    status: chat.status,
    sendMessage,
    stop: chat.stop,
    mode,
    setMode,
    model,
    setModel,
  };
}
