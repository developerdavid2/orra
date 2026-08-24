"use client";

import { SearchableCombobox } from "@/components/searchable-combobox";
import type { ToolMode } from "@orra/types";
import {
  DEFAULT_CHAT_MODEL_ID,
  SUPPORTED_CHAT_MODELS,
  type SupportedChatModelId,
} from "@orra/types";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@orra/ui/components/ai-elements/prompt-input";
import { cn } from "@orra/ui/lib/utils";
import { ArrowUp, Eye, Square, Wrench } from "lucide-react";
import { useMemo } from "react";
import type { ChatStatus } from "ai";

const MODE_OPTIONS: { value: ToolMode; label: string; icon: typeof Eye }[] = [
  { value: "plan", label: "Plan", icon: Eye },
  { value: "act", label: "Act", icon: Wrench },
];

const MODEL_OPTIONS = SUPPORTED_CHAT_MODELS.map((m) => ({
  label: m.id,
  value: m.id,
  sublabel: m.provider,
}));

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  onStop?: () => void;
  streamStatus?: ChatStatus;
  mode?: ToolMode;
  onModeChange?: (mode: ToolMode) => void;
  model?: SupportedChatModelId;
  onModelChange?: (model: SupportedChatModelId) => void;
  variant?: "default" | "compact";
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onStop,
  streamStatus,
  mode = "plan",
  onModeChange,
  model = DEFAULT_CHAT_MODEL_ID,
  onModelChange,
  variant = "default",
}: ChatInputProps) {
  const isSubmitDisabled = useMemo(() => {
    return !input?.trim() || isLoading;
  }, [input, isLoading]);

  const status = streamStatus ?? (isLoading ? ("streaming" as const) : ("ready" as const));

  const isCompact = variant === "compact";

  const modelSelector = (
    <SearchableCombobox
      options={MODEL_OPTIONS}
      value={model}
      onChange={(v) => onModelChange?.(v as SupportedChatModelId)}
      placeholder="Model"
      className={cn("flex-1 resize-none text-sm py-1.5")}
      contentClassName="w-82 lowercase"
    />
  );

  const modeToggle = (
    <div
      className={cn(
        "flex items-center rounded-md border bg-section-muted",
        isCompact ? "p-0.5" : "p-1",
      )}
    >
      {MODE_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isActive = mode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onModeChange?.(opt.value)}
            className={cn(
              "flex items-center gap-1 rounded font-medium transition-colors px-2 py-1 text-xs",
              isActive
                ? "bg-main-tint text-main shadow-sm"
                : "text-muted-foreground/60 hover:text-foreground",
            )}
          >
            <Icon className={cn(isCompact ? "size-2.5" : "size-3")} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  const submitButton = (
    <PromptInputSubmit
      disabled={isLoading ? false : isSubmitDisabled}
      status={status}
      onStop={onStop}
      className={cn("rounded-full", isCompact && "size-7")}
    >
      {isLoading ? (
        <Square className={cn("fill-current", isCompact ? "size-2.5" : "size-3")} />
      ) : (
        <ArrowUp className={cn(isCompact ? "size-3.5" : "size-4")} />
      )}
    </PromptInputSubmit>
  );

  return (
    <div className="w-full">
      <PromptInput onSubmit={(_message) => onSubmit()}>
        <PromptInputBody className={cn(isCompact && "p-2 gap-1")}>
          <PromptInputTextarea
            value={input}
            onChange={onInputChange}
            placeholder="Ask about your finances..."
            className="min-h-15 text-sm p-4"
          />
          {!isCompact && (
            <div className="flex items-center justify-between w-full p-2">
              {modeToggle}
              {submitButton}
            </div>
          )}
        </PromptInputBody>

        {/* Footer only for default variant */}
        {!isCompact ? (
          <PromptInputFooter className="border-t">
            <PromptInputTools>{modelSelector}</PromptInputTools>
          </PromptInputFooter>
        ) : (
          <PromptInputFooter>
            <PromptInputTools className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {modeToggle}
                {modelSelector}
              </div>
              {submitButton}
            </PromptInputTools>
          </PromptInputFooter>
        )}
      </PromptInput>
    </div>
  );
}
