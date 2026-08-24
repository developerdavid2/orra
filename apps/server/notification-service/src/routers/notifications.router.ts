import { protectedProcedure, publicProcedure, router } from "@orra/config/trpc";
import { subscribeToUser } from "@orra/redis";
import {
  type AppNotification,
  markReadSchema,
  notificationsFilterSchema,
  notificationsSummarySchema,
  registerDeviceSchema,
  updatePreferencesSchema,
} from "@orra/types";
import { tracked } from "@trpc/server";
import { z } from "zod";
import { zAsyncIterable } from "../lib/zAsyncIterable";
import {
  getNotifications,
  getNotificationsSummary,
  getUnreadCount,
  markAllRead,
  markManyRead,
  markManyUnread,
  markNotificationRead,
  markNotificationUnread,
  registerDevice,
  hasActiveDeviceToken,
} from "../services/notifications.service";
import {
  getUserPreferences,
  updateUserPreferences,
} from "../services/preferences.service";

export interface NotificationBroadcastPayload {
  type: "notification.new";
  notification: AppNotification;
}

const notificationBroadcastSchema = z.custom<NotificationBroadcastPayload>();

export const appNotificationRouter = router({
  health: publicProcedure.query(() => ({
    ok: true,
    service: "notification-service",
  })),
  list: protectedProcedure
    .input(notificationsFilterSchema.passthrough().optional())
    .query(async ({ ctx, input }) => {
      const parsed = notificationsFilterSchema.parse(input ?? {});
      const result = await getNotifications(ctx.session.user.id, parsed);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }),

  onNew: protectedProcedure
    .output(
      zAsyncIterable({
        yield: notificationBroadcastSchema,
        tracked: true,
      }),
    )
    .subscription(async function* (opts) {
      const userId = opts.ctx.session.user.id;
      for await (const payload of subscribeToUser(userId, opts.signal!)) {
        const typed = payload as NotificationBroadcastPayload;
        yield tracked(typed.notification.id, typed);
      }
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return getUnreadCount(ctx.session.user.id);
  }),

  markRead: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await markNotificationRead(ctx.session.user.id, input.id);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }),

  markUnread: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await markNotificationUnread(
        ctx.session.user.id,
        input.id,
      );
      if (!result.success) throw new Error(result.error);
      return result.data;
    }),

  markManyRead: protectedProcedure
    .input(markReadSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await markManyRead(ctx.session.user.id, input.ids);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }),

  markManyUnread: protectedProcedure
    .input(markReadSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await markManyUnread(ctx.session.user.id, input.ids);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const result = await markAllRead(ctx.session.user.id);
    if (!result.success) throw new Error(result.error);
    return result.data;
  }),

  summary: protectedProcedure
    .input(
      notificationsFilterSchema.omit({ cursor: true, limit: true }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const parsed = notificationsSummarySchema.parse(input ?? {});
      const result = await getNotificationsSummary(ctx.session.user.id, parsed);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }),

  hasActiveDeviceToken: protectedProcedure.query(async ({ ctx }) => {
    const result = await hasActiveDeviceToken(ctx.session.user.id);
    if (!result.hasToken && result.tokenCount === 0) {
      return { hasToken: false, tokenCount: 0 };
    }
    return result;
  }),

  registerDevice: protectedProcedure
    .input(registerDeviceSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await registerDevice(
        ctx.session.user.id,
        input.token,
        input.platform,
        input.deviceName,
      );
      if (!result.success) throw new Error(result.error);
      return result.data;
    }),

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const result = await getUserPreferences(ctx.session.user.id);
    if (!result.success) throw new Error(result.error);
    return result.data;
  }),

  updatePreferences: protectedProcedure
    .input(updatePreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await updateUserPreferences(ctx.session.user.id, input);
      if (!result.success) throw new Error(result.error);
      return result.data;
    }),
});
