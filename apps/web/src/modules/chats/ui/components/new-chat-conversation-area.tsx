"use client";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { contextSuggestions } from "../../constants";
import type { ChatMode } from "../../hooks/use-ai-chat";
import type { SupportedChatModelId } from "@orra/types";
import { DEFAULT_CHAT_MODEL_ID } from "@orra/types";
import { ChatInput } from "./chat-input";
import { ChatSuggestions } from "./chat-suggestions";

export const NewChatConversationArea = () => {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("plan");
  const [model, setModel] = useState<SupportedChatModelId>(
    DEFAULT_CHAT_MODEL_ID,
  );
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isNavigating) return;

    setIsNavigating(true);
    const message = input.trim();

    router.push(
      `/dashboard/ai-chat/new?initialMessage=${encodeURIComponent(message)}&mode=${mode}&model=${model}` as Route,
    );
  }, [input, mode, model, isNavigating, router]);

  return (
    <div className="w-full space-y-4">
      <ChatSuggestions
        suggestions={contextSuggestions.general}
        onSuggestionClick={(text) => setInput(text)}
      />
      <ChatInput
        input={input}
        isLoading={isNavigating}
        onInputChange={(e) => setInput(e.target.value)}
        onSubmit={handleSubmit}
        mode={mode}
        onModeChange={setMode}
        model={model}
        onModelChange={setModel}
      />
    </div>
  );
};
