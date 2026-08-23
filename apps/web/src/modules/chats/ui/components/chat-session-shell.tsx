// ChatSessionShell.tsx
"use client";

import { cn } from "@orra/ui/lib/utils";
import type { ReactNode } from "react";
import { ChatInput } from "./chat-input";
import type { ChatMode } from "../../hooks/use-ai-chat";
import type { SupportedChatModelId } from "@orra/types";
import type { ChatStatus } from "ai";

interface ChatSessionShellProps {
  children: ReactNode;
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onStop?: () => void;
  status?: ChatStatus;
  mode?: ChatMode;
  onModeChange?: (mode: ChatMode) => void;
  model?: SupportedChatModelId;
  onModelChange?: (model: SupportedChatModelId) => void;
  footerOverride?: ReactNode;
}

export function ChatSessionShell({
  children,
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
  status,
  mode,
  onModeChange,
  model,
  onModelChange,
  footerOverride,
}: ChatSessionShellProps) {
  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col mx-auto">
      {/* Messages — flex frame only; the child (Conversation) owns scrolling */}
      <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>

      {/* Footer — anchored to the shell, stays inside the resizable panel */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t bg-background/95 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto w-full p-4">
          {footerOverride ?? (
            <ChatInput
              variant="compact"
              input={input}
              isLoading={isLoading}
              onInputChange={onInputChange}
              onSubmit={onSubmit}
              onStop={onStop}
              streamStatus={status}
              mode={mode}
              onModeChange={onModeChange}
              model={model}
              onModelChange={onModelChange}
            />
          )}
        </div>
      </div>
    </div>
  );
}
