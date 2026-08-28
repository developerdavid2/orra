import {
  type AIUsageRecord,
  aiUsage,
  chatMessages,
  chatSessions,
  db,
} from "@orra/db";

import { PLAN_LIMITS } from "@orra/types";
import type {
  ChatMessage,
  ChatMessagesParamsInput,
  ChatSession,
  ChatSessionsFilterInput,
  PaginatedChatMessages,
  PaginatedChatSessions,
  PlanTier,
  ServiceResult,
  StartOrCreateChatSessionInput,
} from "@orra/types";
import type { UIMessage } from "ai";
import { and, desc, eq, isNull, like, or, sql } from "drizzle-orm";

function normalizePlanTier(
  planTier: string | null | undefined,
): PlanTier {
  return planTier === "free" || planTier === "pro" || planTier === "team"
    ? planTier
    : "free";
}

async function checkAIQuota(
  userId: string,
  planTier: string | null | undefined,
): Promise<ServiceResult<boolean>> {
  const tier = normalizePlanTier(planTier);
  const limit = PLAN_LIMITS[tier].queries;

  const now = new Date();
  const [usage] = await db
    .select({ queryCount: aiUsage.queryCount })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, userId),
        eq(aiUsage.month, now.getMonth() + 1),
        eq(aiUsage.year, now.getFullYear()),
      ),
    )
    .limit(1);

  if (!usage) {
    return { success: true, data: true };
  }

  if (usage.queryCount >= limit) {
    return {
      success: false,
      error: "AI query limit reached for your plan. Upgrade your plan for more queries.",
      code: "RATE_LIMITED",
    };
  }

  return { success: true, data: true };
}

async function checkInsightQuota(
  userId: string,
  planTier: string | null | undefined,
): Promise<ServiceResult<boolean>> {
  const tier = normalizePlanTier(planTier);
  const limit = PLAN_LIMITS[tier].insights;

  const now = new Date();
  const [usage] = await db
    .select({ insightCount: aiUsage.insightCount })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, userId),
        eq(aiUsage.month, now.getMonth() + 1),
        eq(aiUsage.year, now.getFullYear()),
      ),
    )
    .limit(1);

  if (!usage) {
    return { success: true, data: true };
  }

  if (usage.insightCount >= limit) {
    return {
      success: false,
      error: "AI insight limit reached for your plan. Upgrade your plan for more insights.",
      code: "RATE_LIMITED",
    };
  }

  return { success: true, data: true };
}

function generateTitle(
  contextType: string,
  contextId?: string,
  customTitle?: string,
): string {
  if (customTitle) return customTitle;
  if (contextType !== "general" && contextId) {
    return `Chat about ${contextType}`;
  }
  return "New conversation";
}

export const AICoachService = {
  async listSessions(
    userId: string,
    filters: ChatSessionsFilterInput,
  ): Promise<ServiceResult<PaginatedChatSessions>> {
    try {
      const { includeArchived, contextType, topic, search, limit, cursor } =
        filters;

      const conditions = [
        eq(chatSessions.userId, userId),
        eq(chatSessions.isActive, true),
      ];

      if (!includeArchived) {
        conditions.push(isNull(chatSessions.archivedAt));
      }

      if (contextType) {
        conditions.push(eq(chatSessions.contextType, contextType));
      }

      if (topic) {
        conditions.push(eq(chatSessions.topic, topic));
      }

      if (search) {
        conditions.push(like(chatSessions.title, `%${search}%`));
      }

      // Cursor-based pagination: decode cursor to get the ID
      if (cursor) {
        const cursorId = Buffer.from(cursor, "base64").toString("utf-8");
        const [cursorRow] = await db
          .select({ id: chatSessions.id, updatedAt: chatSessions.updatedAt })
          .from(chatSessions)
          .where(
            and(eq(chatSessions.id, cursorId), eq(chatSessions.userId, userId)),
          )
          .limit(1);

        if (cursorRow) {
          conditions.push(
            or(
              sql`${chatSessions.updatedAt} < ${cursorRow.updatedAt.toISOString()}`,
              and(
                sql`${chatSessions.updatedAt} = ${cursorRow.updatedAt.toISOString()}`,
                sql`${chatSessions.id} < ${cursorRow.id}`,
              ),
            )!,
          );
        }
      }

      const result = await db
        .select()
        .from(chatSessions)
        .where(and(...conditions))
        .orderBy(desc(chatSessions.updatedAt), desc(chatSessions.id))
        .limit(limit + 1);

      const hasMore = result.length > limit;
      const items = result.slice(0, limit);
      const nextCursor = hasMore
        ? Buffer.from(items[items.length - 1]!.id).toString("base64")
        : null;

      return {
        success: true,
        data: { items, nextCursor },
      };
    } catch (err) {
      console.error("[AICoachService.getSessions]", err);
      return {
        success: false,
        error: "Failed to fetch chat sessions",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async getOrCreateSession(
    userId: string,
    options: Partial<StartOrCreateChatSessionInput>,
  ): Promise<ServiceResult<ChatSession>> {
    console.log("[getOrCreateSession] received:", options);
    try {
      // 1. Try to find existing session by explicit ID
      if (options.sessionId) {
        const [existing] = await db
          .select()
          .from(chatSessions)
          .where(
            and(
              eq(chatSessions.id, options.sessionId),
              eq(chatSessions.userId, userId),
              eq(chatSessions.isActive, true),
            ),
          )
          .limit(1);

        if (existing) {
          return { success: true, data: existing };
        }

        return {
          success: false,
          error: "Session not found",
          code: "NOT_FOUND",
        };
      }

      // 2. For contextual sessions (not "general"), reuse an existing
      // non-archived session for the same context item instead of
      // creating a duplicate — keeps quota usage down and lets the user
      // pick up where they left off rather than fragmenting across
      // several sessions about the same budget/transaction/etc.
      const contextType = options.contextType ?? "general";
      if (contextType !== "general" && options.contextId) {
        const [existingForContext] = await db
          .select()
          .from(chatSessions)
          .where(
            and(
              eq(chatSessions.userId, userId),
              eq(chatSessions.isActive, true),
              eq(chatSessions.contextType, contextType),
              eq(chatSessions.contextId, options.contextId),
              isNull(chatSessions.archivedAt),
            ),
          )
          .orderBy(desc(chatSessions.updatedAt))
          .limit(1);

        if (existingForContext) {
          return { success: true, data: existingForContext };
        }
      }

      // 3. Create new session (general chats, or first-time context chats)
      const title = generateTitle(
        contextType,
        options.contextId,
        options.title,
      );

      const [newSession] = await db
        .insert(chatSessions)
        .values({
          userId,
          title,
          topic: options.topic ?? "general",
          contextType,
          contextId: options.contextId ?? null,
          isActive: true,
        })
        .returning();

      if (!newSession) {
        return {
          success: false,
          error: "Failed to create session",
          code: "INTERNAL_SERVER_ERROR",
        };
      }

      return { success: true, data: newSession };
    } catch (err) {
      console.error("[AICoachService.getOrCreateSession]", err);
      return {
        success: false,
        error: "Failed to get or create session",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async updateSessionTitle(
    sessionId: string,
    userId: string,
    title: string,
  ): Promise<ServiceResult<ChatSession>> {
    try {
      const [updated] = await db
        .update(chatSessions)
        .set({ title, updatedAt: new Date() })
        .where(
          and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)),
        )
        .returning();

      if (!updated) {
        return {
          success: false,
          error: "Session not found",
          code: "NOT_FOUND",
        };
      }

      return { success: true, data: updated };
    } catch (err) {
      console.error("[AICoachService.updateSessionTitle]", err);
      return {
        success: false,
        error: "Failed to update session title",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  // ── MESSAGES
  async getMessages(
    sessionId: string,
    userId: string,
    params: ChatMessagesParamsInput,
  ): Promise<ServiceResult<PaginatedChatMessages>> {
    const { limit, cursor } = params;
    try {
      const conditions = [
        eq(chatMessages.sessionId, sessionId),
        eq(chatMessages.userId, userId),
      ];
      // Verify session belongs to user
      const [session] = await db
        .select({ id: chatSessions.id })
        .from(chatSessions)
        .where(
          and(
            eq(chatSessions.id, sessionId),
            eq(chatSessions.userId, userId),
            eq(chatSessions.isActive, true),
          ),
        )
        .limit(1);

      if (!session) {
        return {
          success: false,
          error: "Session not found or access denied",
          code: "NOT_FOUND",
        };
      }

      if (cursor) {
        const cursorId = Buffer.from(cursor, "base64").toString("utf-8");
        const [cursorRow] = await db
          .select({ id: chatMessages.id, createdAt: chatMessages.createdAt })
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.id, cursorId),
              eq(chatMessages.sessionId, sessionId),
            ),
          )
          .limit(1);

        if (cursorRow) {
          conditions.push(
            or(
              sql`${chatMessages.createdAt} < ${cursorRow.createdAt.toISOString()}`,
              and(
                sql`${chatMessages.createdAt} = ${cursorRow.createdAt.toISOString()}`,
                sql`${chatMessages.id} < ${cursorRow.id}`,
              ),
            )!,
          );
        }
      }

      const result = await db
        .select()
        .from(chatMessages)
        .where(and(...conditions))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit + 1);

      const hasMore = result.length > limit;
      const items = result.slice(0, limit).reverse();
      const nextCursor = hasMore
        ? Buffer.from(items[0]!.id).toString("base64")
        : null;

      return {
        success: true,
        data: { items, nextCursor },
      };
    } catch (err) {
      console.error("[AICoachService.getMessages]", err);
      return {
        success: false,
        error: "Failed to fetch messages",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async saveMessage(
    sessionId: string,
    userId: string,
    role: "user" | "assistant",
    content: string | UIMessage["parts"],
    tokensUsed?: number,
    metadata?: string,
  ): Promise<ServiceResult<ChatMessage>> {
    try {
      const contentToStore = Array.isArray(content)
        ? JSON.stringify(content)
        : content;

      const [message] = await db
        .insert(chatMessages)
        .values({
          sessionId,
          userId,
          role,
          content: contentToStore,
          tokensUsed,
          metadata,
        })
        .returning();

      // Update session updatedAt for sidebar sorting
      await db
        .update(chatSessions)
        .set({ updatedAt: new Date() })
        .where(eq(chatSessions.id, sessionId));

      if (!message) {
        return {
          success: false,
          error: "Failed to save message",
          code: "INTERNAL_SERVER_ERROR",
        };
      }

      return { success: true, data: message };
    } catch (err) {
      console.error("[AICoachService.saveMessage]", err);
      return {
        success: false,
        error: "Failed to save message",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async archiveSession(
    sessionId: string,
    userId: string,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const [result] = await db
        .update(chatSessions)
        .set({ archivedAt: new Date(), updatedAt: new Date() })
        .where(
          and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)),
        )
        .returning({ id: chatSessions.id });

      if (!result) {
        return {
          success: false,
          error: "Session not found",
          code: "NOT_FOUND",
        };
      }

      return { success: true, data: { id: result.id } };
    } catch (err) {
      console.error("[AICoachService.archiveSession]", err);
      return {
        success: false,
        error: "Failed to archive session",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async unarchiveSession(
    sessionId: string,
    userId: string,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const [result] = await db
        .update(chatSessions)
        .set({ archivedAt: null, updatedAt: new Date() })
        .where(
          and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)),
        )
        .returning({ id: chatSessions.id });

      if (!result) {
        return {
          success: false,
          error: "Session not found",
          code: "NOT_FOUND",
        };
      }

      return { success: true, data: { id: result.id } };
    } catch (err) {
      console.error("[AICoachService.unarchiveSession]", err);
      return {
        success: false,
        error: "Failed to unarchive session",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async deleteSession(
    sessionId: string,
    userId: string,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const [result] = await db
        .delete(chatSessions)
        .where(
          and(eq(chatSessions.id, sessionId), eq(chatSessions.userId, userId)),
        )
        .returning({ id: chatSessions.id });

      if (!result) {
        return {
          success: false,
          error: "Session not found",
          code: "NOT_FOUND",
        };
      }

      return { success: true, data: { id: result.id } };
    } catch (err) {
      console.error("[AICoachService.deleteSession]", err);
      return {
        success: false,
        error: "Failed to delete session",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async checkQuota(
    userId: string,
    planTier: string | null | undefined,
  ): Promise<ServiceResult<boolean>> {
    return checkAIQuota(userId, planTier);
  },

  async checkInsightQuota(
    userId: string,
    planTier: string | null | undefined,
  ): Promise<ServiceResult<boolean>> {
    return checkInsightQuota(userId, planTier);
  },

  async getUsage(userId: string): Promise<ServiceResult<AIUsageRecord | null>> {
    try {
      const now = new Date();
      const [usage] = await db
        .select()
        .from(aiUsage)
        .where(
          and(
            eq(aiUsage.userId, userId),
            eq(aiUsage.month, now.getMonth() + 1),
            eq(aiUsage.year, now.getFullYear()),
          ),
        )
        .limit(1);

      return { success: true, data: usage ?? null };
    } catch (err) {
      console.error("[AICoachService.getUsage]", err);
      return {
        success: false,
        error: "Failed to fetch usage",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async incrementAIUsage(
    userId: string,
    tokensUsed: number,
  ): Promise<ServiceResult<void>> {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [existing] = await db
        .select()
        .from(aiUsage)
        .where(
          and(
            eq(aiUsage.userId, userId),
            eq(aiUsage.month, month),
            eq(aiUsage.year, year),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(aiUsage)
          .set({
            queryCount: existing.queryCount + 1,
            tokenCount: existing.tokenCount + tokensUsed,
            lastQueryAt: now,
            updatedAt: now,
          })
          .where(eq(aiUsage.id, existing.id));
      } else {
        await db.insert(aiUsage).values({
          userId,
          month,
          year,
          queryCount: 1,
          tokenCount: tokensUsed,
          lastQueryAt: now,
        });
      }

      return { success: true, data: undefined };
    } catch (err) {
      console.error("[AICoachService.incrementAIUsage]", err);
      return {
        success: false,
        error: "Failed to increment usage",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },

  async incrementInsightUsage(
    userId: string,
  ): Promise<ServiceResult<void>> {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [existing] = await db
        .select({ id: aiUsage.id, insightCount: aiUsage.insightCount })
        .from(aiUsage)
        .where(
          and(
            eq(aiUsage.userId, userId),
            eq(aiUsage.month, month),
            eq(aiUsage.year, year),
          ),
        )
        .limit(1);

      if (existing) {
        await db
          .update(aiUsage)
          .set({
            insightCount: existing.insightCount + 1,
            lastQueryAt: now,
            updatedAt: now,
          })
          .where(eq(aiUsage.id, existing.id));
      } else {
        await db.insert(aiUsage).values({
          userId,
          month,
          year,
          insightCount: 1,
          lastQueryAt: now,
        });
      }

      return { success: true, data: undefined };
    } catch (err) {
      console.error("[AICoachService.incrementInsightUsage]", err);
      return {
        success: false,
        error: "Failed to increment insight usage",
        code: "INTERNAL_SERVER_ERROR",
      };
    }
  },
} as const;
