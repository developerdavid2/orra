// ChatSessionShell.tsx
"use client";

import { cn } from "@orra/ui/lib/utils";
import type { ReactNode } from "react";
import { ChatInput } from "./chat-input";
import type { ChatMode } from "../../hooks/use-ai-chat";
import type { SupportedChatModelId } from "@orra/types";

interface ChatSessionShellProps {
  children: ReactNode;
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
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
  mode,
  onModeChange,
  model,
  onModelChange,
  footerOverride,
}: ChatSessionShellProps) {
  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col mx-auto">
      {/* Messages — scrollable, with bottom padding for footer clearance */}
      <div className="no-scrollbar space-y-4 flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-4xl mx-auto w-full">{children}</div>
      </div>

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
