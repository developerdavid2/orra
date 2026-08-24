"use client";

import {
  MessageContent,
  MessageResponse,
} from "@orra/ui/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@orra/ui/components/ai-elements/reasoning";
import { Avatar, AvatarFallback } from "@orra/ui/components/avatar";
import { cn } from "@orra/ui/lib/utils";
import { format } from "date-fns";
import { Bot, Check, Copy } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "../../hooks/use-ai-chat";
import type { TextPart } from "../../lib/message-parts";
import { ChatMessageItem } from "./chat-message-item";
import { ChatToolPart } from "./chat-tool-part";

function formatTimestamp(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return format(date, sameYear ? "MMM d, h:mm a" : "MMM d, yyyy, h:mm a");
}

function MessageMetaRow({
  align,
  timestamp,
  copyText,
  className,
}: {
  align: "start" | "end";
  timestamp?: Date | string | null;
  copyText?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const canCopy = !!copyText && copyText.trim().length > 0;
  const onCopy = async () => {
    if (!canCopy) return;
    await navigator.clipboard.writeText(copyText!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-1",
        align === "end" ? "justify-end" : "justify-start",
        className,
      )}
    >
      {timestamp ? (
        <span className="text-[10px] text-muted-foreground">
          {formatTimestamp(timestamp)}
        </span>
      ) : null}
      {canCopy ? (
        <button
          type="button"
          onClick={onCopy}
          aria-label={copied ? "Copied" : "Copy message"}
          className="text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        </button>
      ) : null}
    </div>
  );
}

interface ChatStreamMessageProps {
  message: ChatMessage;
  isLast: boolean;
  isStreaming: boolean;
  sendMessage: (text: string) => void;
}

export function ChatStreamMessage({
  message,
  isLast,
  isStreaming,
  sendMessage,
}: ChatStreamMessageProps) {
  if (message.role === "user") {
    const text = message.parts
      .filter(
        (part): part is { type: "text"; text: string } => part.type === "text",
      )
      .map((part) => part.text)
      .join("");

    return (
      <div className="flex flex-col items-end">
        <ChatMessageItem
          message={{
            id: message.id,
            role: "user",
            content: text,
            createdAt: new Date(),
            sessionId: "",
            userId: "",
            tokensUsed: null,
            metadata: null,
          }}
        />
        <MessageMetaRow
          align="end"
          timestamp={message.createdAt ?? new Date()}
          copyText={text}
          className="mt-2 pr-11"
        />
      </div>
    );
  }

  const lastPartIndex = message.parts.length - 1;
  const lastPart = message.parts[lastPartIndex];

  const hasVisibleContent = message.parts.some((part) => {
    if (part.type === "text") return part.text.trim().length > 0;
    if (part.type === "reasoning") return true;
    return (
      (typeof part.type === "string" && part.type.startsWith("tool-")) ||
      "toolName" in part
    );
  });
  const showWaitingPlaceholder = isStreaming && !hasVisibleContent;
  const assistantText = message.parts
    .filter((part): part is TextPart => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();

  return (
    <div className="flex gap-3">
      <Avatar className="size-8 shrink-0 bg-muted">
        <AvatarFallback>
          <Bot className="size-4" />
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 max-w-[80%] flex-1 space-y-2">
        {showWaitingPlaceholder && (
          <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-1 w-fit">
            <span className="size-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:0ms]" />
            <span className="size-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:150ms]" />
            <span className="size-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:300ms]" />
          </div>
        )}
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            return (
              <MessageContent
                key={`${message.id}-${index}`}
                className={cn(
                  "w-fit rounded-2xl bg-sidebar px-4 py-3 text-foreground",
                )}
              >
                <MessageResponse>{part.text}</MessageResponse>
              </MessageContent>
            );
          }

          if (part.type === "reasoning") {
            const isReasoningStreaming =
              isLast &&
              isStreaming &&
              index === lastPartIndex &&
              lastPart?.type === "reasoning";
            // Stays rendered once finished — Reasoning auto-collapses when
            // isStreaming flips false, so the bubble never goes blank.
            return (
              <Reasoning
                key={`${message.id}-${index}`}
                className="w-full"
                isStreaming={isReasoningStreaming}
              >
                <ReasoningTrigger />
                <ReasoningContent>{part.text}</ReasoningContent>
              </Reasoning>
            );
          }

          if ("toolName" in part) {
            return (
              <ChatToolPart
                key={`${message.id}-${index}`}
                part={part}
                sendMessage={sendMessage}
              />
            );
          }

          return null;
        })}
        {isStreaming &&
          isLast &&
          hasVisibleContent &&
          !showWaitingPlaceholder && (
            <div className="flex items-center gap-1.5 px-1 py-0.5 w-fit">
              <span className="size-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:0ms]" />
              <span className="size-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:150ms]" />
              <span className="size-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:300ms]" />
            </div>
          )}
        {assistantText.length > 0 && (
          <MessageMetaRow
            align="start"
            timestamp={message.createdAt ?? new Date()}
            copyText={assistantText}
          />
        )}
      </div>
    </div>
  );
}
