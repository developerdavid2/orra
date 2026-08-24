import type { ToolPart } from "../ui/components/chat-tool-part";

export type TextPart = { type: "text"; text: string };
export type ReasoningPart = { type: "reasoning"; text: string };
export type ChatMessagePart = TextPart | ReasoningPart | ToolPart;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: ChatMessagePart[];
  createdAt?: Date | string | null;
};

// AI SDK tool-part states map 1:1 onto our ToolPart state union.
const TOOL_STATES = new Set([
  "input-streaming",
  "input-available",
  "approval-requested",
  "approval-responded",
  "output-available",
  "output-error",
  "output-denied",
]);

type RawPart = Record<string, unknown>;

function normalizePart(part: RawPart): ChatMessagePart[] {
  if (part.type === "text") {
    return [{ type: "text", text: (part.text as string) ?? "" }];
  }

  // Reasoning parts (only forwarded by the server when reasoning is sent).
  if (part.type === "reasoning") {
    return [{ type: "reasoning", text: (part.text as string) ?? "" }];
  }

  // AI SDK tool parts: type is "tool-{name}"
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    const tp = part as {
      toolName?: string;
      state?: string;
      input?: unknown;
      args?: unknown;
      output?: unknown;
      result?: unknown;
      errorText?: string;
      approval?: { id: string; approved?: boolean } | null;
    };

    // Map AI SDK state → our ToolPart state
    let state: ToolPart["state"];
    if (tp.state && TOOL_STATES.has(tp.state)) {
      state = tp.state as ToolPart["state"];
    } else {
      // Fallback for any other state
      state = tp.output !== undefined ? "output-available" : "input-available";
    }

    return [
      {
        toolName:
          (tp.toolName as string) ?? String(part.type).replace("tool-", ""),
        state,
        input: tp.input ?? tp.args,
        output: tp.output ?? tp.result,
        errorText: tp.errorText,
        approval: tp.approval ?? null,
      },
    ];
  }

  return [];
}

export function normalizeParts(parts: RawPart[]): ChatMessagePart[] {
  return parts.flatMap(normalizePart);
}

/** Normalize live useChat messages (AI SDK v6 UIMessage parts). */
export function normalizeChatMessages(
  messages: Array<{
    id: string;
    role: string;
    parts?: RawPart[];
  }>,
): ChatMessage[] {
  return messages.map((message) => ({
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    parts: normalizeParts(message.parts ?? []),
    createdAt:
      (message as { createdAt?: Date | string | null }).createdAt ?? null,
  }));
}

/**
 * Convert a persisted DB message into a ChatMessage.
 *
 * New messages store the UIMessage parts as JSON in `content`; those are
 * parsed back into parts so tool outputs/charts render again. Legacy messages
 * store plain text in `content` (with optional `metadata.toolResults`), which
 * we fall back to.
 */
export function dbMessageToChatMessage(message: {
  id: string;
  role: string;
  content: string;
  metadata?: string | null;
  createdAt?: Date | string | null;
}): ChatMessage {
  let parts: ChatMessagePart[] | null = null;
  try {
    const parsed = JSON.parse(message.content);
    if (Array.isArray(parsed)) {
      parts = normalizeParts(parsed as RawPart[]);
    }
  } catch {
    parts = null;
  }

  if (parts === null) {
    parts = [{ type: "text", text: message.content }];
    try {
      const metadata = message.metadata ? JSON.parse(message.metadata) : null;
      const toolResults = metadata?.toolResults;
      if (Array.isArray(toolResults)) {
        parts.push(
          ...toolResults.map((tr) => ({
            type: "tool" as const,
            toolName: String(tr.toolName ?? "unknown"),
            state: "output-available" as const,
            output: tr.result,
          })),
        );
      }
    } catch {}
  }

  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    parts,
    createdAt: message.createdAt ?? null,
  };
}
