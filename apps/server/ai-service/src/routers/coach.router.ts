import { protectedProcedure, router } from "@orra/config/trpc";
import {
  chatSessionsFilterSchema,
  sendMessageSchema,
  startOrCreateChatSessionSchema,
  updateSessionTitleSchema,
} from "@orra/types";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { AICoachService } from "../services/coach.service";

export const coachRouter = router({
  sessions: protectedProcedure
    .input(chatSessionsFilterSchema.optional())
    .query(async ({ ctx, input }) => {
      const parsed = chatSessionsFilterSchema.parse(input ?? {});
      const result = await AICoachService.listSessions(
        ctx.session.user.id,
        parsed,
      );

      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }

      return result.data;
    }),

  sessionById: protectedProcedure
    .input(
      z.object({
        sessionId: z.uuid(),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const sessionResult = await AICoachService.getOrCreateSession(
        ctx.session.user.id,
        { sessionId: input.sessionId },
      );

      if (!sessionResult.success) {
        throw new TRPCError({
          code:
            sessionResult.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : "INTERNAL_SERVER_ERROR",
          message: sessionResult.error,
        });
      }

      const messagesResult = await AICoachService.getMessages(
        sessionResult.data.id,
        ctx.session.user.id,
        {
          limit: input.limit,
          cursor: input.cursor,
        },
      );

      if (!messagesResult.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: messagesResult.error,
        });
      }

      return {
        session: sessionResult.data,
        messages: messagesResult.data,
      };
    }),

  startSession: protectedProcedure
    .input(startOrCreateChatSessionSchema)
    .mutation(async ({ ctx, input }) => {
      console.log("[getOrCreateSession] received:", input);
      const result = await AICoachService.getOrCreateSession(
        ctx.session.user.id,
        {
          contextType: input.contextType,
          contextId: input.contextId,
          title: input.title,
          topic: input.topic,
        },
      );

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.error,
        });
      }

      return result.data;
    }),

  updateTitle: protectedProcedure
    .input(updateSessionTitleSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await AICoachService.updateSessionTitle(
        input.sessionId,
        ctx.session.user.id,
        input.title,
      );

      if (!result.success) {
        throw new TRPCError({
          code:
            result.code === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }

      return result.data;
    }),

  getMessages: protectedProcedure
    .input(
      z.object({
        sessionId: z.uuid(),
        limit: z.number().int().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await AICoachService.getMessages(
        input.sessionId,
        ctx.session.user.id,
        { limit: input.limit, cursor: input.cursor },
      );

      if (!result.success) {
        throw new TRPCError({
          code:
            result.code === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }

      return result.data;
    }),

  sendMessage: protectedProcedure
    .input(sendMessageSchema)
    .mutation(async ({ ctx, input }) => {
      // 1. Verify session belongs to user
      const sessionResult = await AICoachService.getOrCreateSession(
        ctx.session.user.id,
        { sessionId: input.sessionId },
      );
      if (!sessionResult.success) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: sessionResult.error,
        });
      }

      // 2. Check quota. planTier may be null/undefined at runtime — treat as
      // "free" so the free-tier cap wins by default (conservative).
      const quotaResult = await AICoachService.checkQuota(
        ctx.session.user.id,
        (ctx.session.user.planTier as string | null | undefined) ?? "free",
      );
      if (!quotaResult.success) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: quotaResult.error,
        });
      }

      // 3. Save user message
      const userMessageResult = await AICoachService.saveMessage(
        input.sessionId,
        ctx.session.user.id,
        "user",
        input.content,
      );
      if (!userMessageResult.success) {
        await AICoachService.releaseQuota(ctx.session.user.id);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: userMessageResult.error,
        });
      }

      const aiResponse =
        "I'm your Orra AI Coach. I'm learning your financial patterns and will provide personalized insights soon. (AI integration coming in Phase 3)";
      const tokensUsed = 0;

      // 5. Save AI response
      const aiMessageResult = await AICoachService.saveMessage(
        input.sessionId,
        ctx.session.user.id,
        "assistant",
        aiResponse,
        tokensUsed,
      );
      if (!aiMessageResult.success) {
        await AICoachService.releaseQuota(ctx.session.user.id);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: aiMessageResult.error,
        });
      }

      // 6. Update usage
      await AICoachService.incrementAIUsage(ctx.session.user.id, tokensUsed);

      return {
        userMessage: userMessageResult.data,
        aiMessage: aiMessageResult.data,
      };
    }),

  archiveSession: protectedProcedure
    .input(z.object({ sessionId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await AICoachService.archiveSession(
        input.sessionId,
        ctx.session.user.id,
      );

      if (!result.success) {
        throw new TRPCError({
          code:
            result.code === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }

      return result.data;
    }),

  unarchiveSession: protectedProcedure
    .input(z.object({ sessionId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await AICoachService.unarchiveSession(
        input.sessionId,
        ctx.session.user.id,
      );

      if (!result.success) {
        throw new TRPCError({
          code:
            result.code === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }

      return result.data;
    }),

  deleteSession: protectedProcedure
    .input(z.object({ sessionId: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await AICoachService.deleteSession(
        input.sessionId,
        ctx.session.user.id,
      );

      if (!result.success) {
        throw new TRPCError({
          code:
            result.code === "NOT_FOUND" ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
          message: result.error,
        });
      }

      return result.data;
    }),

  usage: protectedProcedure.query(async ({ ctx }) => {
    const result = await AICoachService.getUsage(ctx.session.user.id);

    if (!result.success) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: result.error,
      });
    }

    return result.data;
  }),
});
