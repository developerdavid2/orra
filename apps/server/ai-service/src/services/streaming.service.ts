import { db } from "@orra/db";
import { chatMessages } from "@orra/db/schema";
import {
  CONTEXT_TOOL_SCOPE,
  DEFAULT_CHAT_MODEL_ID,
  getToolContracts,
  type StreamChatRequest,
  type StreamChatResponse,
  type ToolMode,
} from "@orra/types";
import {
  convertToModelMessages,
  streamText,
  validateUIMessages,
  type InferUITools,
  type LanguageModelUsage,
  type UIMessage,
} from "ai";
import { and, eq } from "drizzle-orm";
import type { Response } from "express";
import { fetchContext } from "../context";
import { getModelById } from "../lib/ai-provider";
import { buildSystemPrompt } from "../lib/prompt";
import { buildTools } from "../tools";
import { AICoachService } from "./coach.service";

const MAX_HISTORY_MESSAGES = 15;

type RuntimeTools = ReturnType<typeof buildTools>;

type ChatMessageMetadata = {
  mode?: ToolMode;
  model?: string;
  durationMs?: number;
  usage?: LanguageModelUsage;
};

export type OrraUIMessage = UIMessage<
  ChatMessageMetadata,
  never,
  InferUITools<RuntimeTools>
>;

function pickTools<T extends Record<string, unknown>, K extends keyof T>(
  tools: T,
  keys: readonly K[],
): Pick<T, K> {
  const allowed = new Set<keyof T>(keys);
  return Object.fromEntries(
    Object.entries(tools).filter(([name]) => allowed.has(name as keyof T)),
  ) as Pick<T, K>;
}

function scopedTools<T extends Record<string, unknown>>(
  allTools: T,
  contextType: string,
) {
  const allowed = (CONTEXT_TOOL_SCOPE[contextType] ?? []) as (keyof T)[];
  return pickTools(allTools, allowed);
}

function hasPendingToolCalls(message: OrraUIMessage) {
  return message.parts.some((part) => {
    if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
      const state = (part as { state?: string }).state;
      return state !== "output-available" && state !== "output-error";
    }
    return false;
  });
}

export async function fetchMessageHistory(
  sessionId: string,
  userId: string,
): Promise<OrraUIMessage[]> {
  const history = await db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
    })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.sessionId, sessionId),
        eq(chatMessages.userId, userId),
      ),
    )
    .orderBy(chatMessages.createdAt)
    .limit(MAX_HISTORY_MESSAGES);

  return history.map((msg): OrraUIMessage => {
    let parts: OrraUIMessage["parts"];

    try {
      const parsed = JSON.parse(msg.content);
      parts = Array.isArray(parsed)
        ? parsed
        : [{ type: "text", text: String(msg.content) }];
    } catch {
      parts = [{ type: "text", text: String(msg.content) }];
    }

    return {
      id: msg.id,
      role: msg.role as "user" | "assistant",
      parts,
    };
  });
}

export async function handleStreamChat(
  req: StreamChatRequest & { mode?: ToolMode; model?: string },
  res: Response,
): Promise<StreamChatResponse> {
  const {
    sessionId,
    userId,
    content,
    planTier = "free",
    mode = "plan",
    model: requestedModel,
  } = req;

  const startTime = Date.now();

  try {
    // 1. Session & quota
    const sessionResult = await AICoachService.getOrCreateSession(userId, {
      sessionId,
    });
    if (!sessionResult.success) {
      return {
        success: false,
        error: sessionResult.error,
        code: sessionResult.code,
      };
    }
    const resolvedSessionId = sessionResult.data.id;

    const quotaResult = await AICoachService.checkQuota(userId, planTier);
    if (!quotaResult.success) {
      return { success: false, error: quotaResult.error, code: "RATE_LIMITED" };
    }

    // 2. Fetch context & history BEFORE saving the new user message — the
    // freshly saved turn would otherwise show up in the history result AND
    // be appended below, handing the model (and UI stream) two copies of it.
    const contextType = sessionResult.data.contextType ?? "general";
    const { data: contextData, snapshot } = await fetchContext(
      userId,
      contextType,
      sessionResult.data.contextId,
    );

    const history: OrraUIMessage[] = await fetchMessageHistory(
      resolvedSessionId,
      userId,
    );

    // 3. Build + save the user message as a UIMessage (parts, not raw string)
    const userMessage: OrraUIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text: content }],
    };

    const saveUserResult = await AICoachService.saveMessage(
      resolvedSessionId,
      userId,
      "user",
      userMessage.parts,
    );
    if (!saveUserResult.success) {
      return {
        success: false,
        error: saveUserResult.error,
        code: "INTERNAL_SERVER_ERROR",
      };
    }

    // History ends with the previous assistant turn; the current user turn
    // is appended exactly once here.
    const originalMessages: OrraUIMessage[] = [...history, userMessage];

    const systemPrompt = buildSystemPrompt(contextData, contextType, mode);

    // 4. Resolve model: requested > global default. (No bare getModel() —
    // that function never existed; DEFAULT_CHAT_MODEL_ID is the fallback,
    // same role NightCode's DEFAULT_CHAT_MODEL_ID plays.)
    const resolvedModel = getModelById(requestedModel ?? DEFAULT_CHAT_MODEL_ID);

    // 5. Resolve tools: runtime tools = contracts + server-side execute
    // (NightCode ships bare contracts because its CLI executes locally via
    // onToolCall; Orra's data lives in Postgres, so the service executes).
    // Primary filter by mode, secondary defense by context scope.
    const allTools = buildTools({ userId });
    const contextTools = scopedTools(allTools, contextType);

    const modeToolNames = Object.keys(
      getToolContracts(mode),
    ) as (keyof typeof contextTools)[];
    const filteredTools = pickTools(contextTools, modeToolNames);

    // 6. Validate and convert messages — this is the step that was missing
    // before. validateUIMessages certifies `originalMessages` (which may
    // contain history saved under a different mode/context) against the
    // tools available for THIS request, before convertToModelMessages ever
    // sees them.
    const nextMessages = await validateUIMessages<OrraUIMessage>({
      messages: originalMessages,
      tools: filteredTools,
    });
    const modelMessages = await convertToModelMessages(nextMessages, {
      tools: filteredTools,
    });

    // 7. Stream AI response
    let completedUsage: LanguageModelUsage | null = null;

    const result = streamText({
      model: resolvedModel.model,
      system: systemPrompt,
      messages: modelMessages,
      tools: filteredTools,
      providerOptions: resolvedModel.providerOptions,
      maxRetries: 1, // a 429 on the free tier is account-wide; don't burn quota retrying
      stopWhen: ({ steps }) => steps.length >= 5,
      onFinish(event) {
        completedUsage = event.totalUsage;
      },
    });

    // Don't await the stream — let it run in the background even if the
    // client disconnects, so persistence below still completes.
    result.consumeStream();

    // 8. Return streaming response
    const uiStream = result.toUIMessageStreamResponse<OrraUIMessage>({
      originalMessages: nextMessages,
      messageMetadata({ part }) {
        if (part.type === "start") {
          return { mode, model: requestedModel ?? DEFAULT_CHAT_MODEL_ID };
        }
        if (part.type !== "finish") return undefined;
        return {
          mode,
          model: requestedModel ?? DEFAULT_CHAT_MODEL_ID,
          durationMs: Date.now() - startTime,
          ...(completedUsage ? { usage: completedUsage } : {}),
        };
      },
      async onFinish(event) {
        const isAborted = event.isAborted;

        // Interrupted streams still get persisted — users expect partial
        // answers after a refresh — but dangling tool parts are stripped so
        // reloaded history renders cleanly.
        const settledStates = new Set([
          "output-available",
          "output-error",
          "output-denied",
          "approval-responded",
        ]);
        const rawParts = event.responseMessage.parts;
        const parts = hasPendingToolCalls(event.responseMessage)
          ? rawParts.filter((part) => {
              const p = part as { type?: unknown; state?: unknown };
              const isToolPart =
                typeof p.type === "string" &&
                (p.type.startsWith("tool-") || p.type === "dynamic-tool");
              return !isToolPart || settledStates.has(String(p.state));
            })
          : rawParts;

        const hasContent = parts.some((part) => {
          const p = part as { type?: unknown; text?: unknown };
          if (p.type === "text") {
            return typeof p.text === "string" && p.text.trim().length > 0;
          }
          if (p.type === "reasoning") return true;
          return (
            typeof p.type === "string" &&
            (p.type.startsWith("tool-") || p.type === "dynamic-tool")
          );
        });
        if (!hasContent) return;

        const metadata = JSON.stringify({
          contextSnapshot: snapshot,
          mode,
          model: requestedModel ?? DEFAULT_CHAT_MODEL_ID,
          duration: Date.now() - startTime,
          ...(isAborted ? { aborted: true } : {}),
          ...(completedUsage ? { usage: completedUsage } : {}),
        });

        await AICoachService.saveMessage(
          resolvedSessionId,
          userId,
          "assistant",
          parts,
          undefined,
          metadata,
        );

        // Usage accounting — mirrors what NightCode calls ingestAiUsage(),
        // gated on `completedUsage`. free-tier cap enforced via checkQuota.
        try {
          await AICoachService.incrementAIUsage(
            userId,
            completedUsage?.totalTokens ?? 0,
          );
        } catch (err) {
          console.error("[handleStreamChat] usage increment failed:", err);
        }
      },
      onError(error) {
        console.error("[handleStreamChat] stream error:", error);
        // Client sees only a generic message; real details stay in server logs.
        return "Something went wrong. Try again."; // string, doesn't throw — keeps stream alive
      },
    });

    // 9. Pipe the Web ReadableStream into the Express response. Hono can
    // just `return` the Response and let the runtime own the stream
    // lifecycle; Express can't, so this manually pumps it — and cancels the
    // upstream stream if the client disconnects mid-flight.
    res.status(uiStream.status);
    uiStream.headers.forEach((value, key) => res.setHeader(key, value));

    if (!res.getHeader("cache-control")) {
      res.setHeader("Cache-Control", "no-cache, no-transform");
    }
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    if (uiStream.body) {
      const reader = uiStream.body.getReader();
      const onClose = () => {
        reader.cancel().catch(() => {});
      };
      res.on("close", onClose);

      try {
        const pump = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) return;
          try {
            res.write(value);
            // no-op unless compression middleware is ever added
            (res as unknown as { flush?: () => void }).flush?.();
          } catch {
            return; // write-after-disconnect: onClose cancels the read
          }
          return pump();
        };
        await pump();
      } finally {
        res.off("close", onClose);
        if (!res.writableEnded) res.end();
      }
    } else {
      res.end();
    }

    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error("[handleStreamChat]", err);

    // If streaming already started, headers are already sent — don't try to
    // send a second response, just close the connection.
    if (res.headersSent) {
      if (!res.writableEnded) res.end();
      return { success: true };
    }

    return {
      success: false,
      // Client sees only a generic message; real details stay in server logs.
      error: "Something went wrong. Try again.",
      code: "INTERNAL_SERVER_ERROR",
    };
  }
}
