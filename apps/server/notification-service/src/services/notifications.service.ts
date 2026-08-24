import { db } from "@orra/db";
import { deviceTokens, notifications } from "@orra/db/schema";
import type {
  AppNotification,
  CreateNotificationInput,
  NotificationCategory,
  NotificationsFilterInput,
  NotificationsSummaryInput,
  PaginatedNotifications,
  ServiceResult,
} from "@orra/types";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

export async function createNotification(
  data: CreateNotificationInput,
): Promise<ServiceResult<AppNotification>> {
  try {
    const [n] = await db.insert(notifications).values(data).returning();
    return { success: true, data: n as AppNotification };
  } catch (err) {
    console.error("[createNotification]", err);
    return {
      success: false,
      error: "Failed to create notification",
      code: "DB_ERROR",
    };
  }
}

export async function getNotifications(
  userId: string,
  input: NotificationsFilterInput,
): Promise<ServiceResult<PaginatedNotifications>> {
  try {
    const { limit, cursor, search, category, status } = input;

    const conditions = [eq(notifications.userId, userId)];

    if (category && category !== "all") {
      conditions.push(
        eq(notifications.category, category as NotificationCategory),
      );
    }

    if (status === "read") {
      conditions.push(eq(notifications.isRead, true));
    } else if (status === "unread") {
      conditions.push(eq(notifications.isRead, false));
    }

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${notifications.title} ILIKE ${searchTerm} OR ${notifications.body} ILIKE ${searchTerm})`,
      );
    }

    if (cursor) {
      const cursorSeq = parseInt(
        Buffer.from(cursor, "base64url").toString("utf-8"),
      );
      conditions.push(sql`${notifications.seq} < ${cursorSeq}`);
    }

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.seq))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, -1) : rows;
    const last = data[data.length - 1];

    const nextCursor =
      hasMore && last
        ? Buffer.from(String(last.seq)).toString("base64url")
        : null;
    return {
      success: true,
      data: {
        items: data as AppNotification[],
        nextCursor,
      },
    };
  } catch (err) {
    console.error("[getNotifications]", err);
    return {
      success: false,
      error: "Failed to fetch notifications",
      code: "DB_ERROR",
    };
  }
}

// ── Mark Single Notification as Read
export async function markNotificationRead(
  userId: string,
  notificationId: string,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      )
      .returning({ id: notifications.id });

    if (!updated) {
      return {
        success: false,
        error: "Notification not found",
        code: "NOT_FOUND",
      };
    }

    return { success: true, data: updated };
  } catch (err) {
    console.error("[markNotificationRead]", err);
    return {
      success: false,
      error: "Failed to mark notification as read",
      code: "DB_ERROR",
    };
  }
}

// ── Mark Multiple as Read
export async function markManyRead(
  userId: string,
  ids: string[],
): Promise<ServiceResult<{ count: number }>> {
  try {
    if (ids.length === 0) {
      return { success: true, data: { count: 0 } };
    }

    const result = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(notifications.userId, userId),
          inArray(notifications.id, ids),
          eq(notifications.isRead, false),
        ),
      )
      .returning({ id: notifications.id });

    return { success: true, data: { count: result.length } };
  } catch (err) {
    console.error("[markManyRead]", err);
    return {
      success: false,
      error: "Failed to mark notifications as read",
      code: "DB_ERROR",
    };
  }
}

// ── Mark All as Read
export async function markAllRead(
  userId: string,
): Promise<ServiceResult<{ count: number }>> {
  try {
    const result = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      )
      .returning({ id: notifications.id });

    return { success: true, data: { count: result.length } };
  } catch (err) {
    console.error("[markAllRead]", err);
    return {
      success: false,
      error: "Failed to mark all notifications as read",
      code: "DB_ERROR",
    };
  }
}

// ── Mark Single as Unread
export async function markNotificationUnread(
  userId: string,
  notificationId: string,
): Promise<ServiceResult<{ id: string }>> {
  try {
    const [updated] = await db
      .update(notifications)
      .set({ isRead: false, readAt: null })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      )
      .returning({ id: notifications.id });

    if (!updated) {
      return {
        success: false,
        error: "Notification not found",
        code: "NOT_FOUND",
      };
    }

    return { success: true, data: updated };
  } catch (err) {
    console.error("[markNotificationUnread]", err);
    return {
      success: false,
      error: "Failed to mark notification as unread",
      code: "DB_ERROR",
    };
  }
}

// ── Mark Multiple as Unread
export async function markManyUnread(
  userId: string,
  ids: string[],
): Promise<ServiceResult<{ count: number }>> {
  try {
    if (ids.length === 0) {
      return { success: true, data: { count: 0 } };
    }

    const result = await db
      .update(notifications)
      .set({ isRead: false, readAt: null })
      .where(
        and(
          eq(notifications.userId, userId),
          inArray(notifications.id, ids),
          eq(notifications.isRead, true),
        ),
      )
      .returning({ id: notifications.id });

    return { success: true, data: { count: result.length } };
  } catch (err) {
    console.error("[markManyUnread]", err);
    return {
      success: false,
      error: "Failed to mark notifications as unread",
      code: "DB_ERROR",
    };
  }
}

// ── Unread Count
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false)),
      );
    return result?.count ?? 0;
  } catch (err) {
    console.error("[getUnreadCount]", err);
    return 0;
  }
}

export async function getNotificationsSummary(
  userId: string,
  input: NotificationsSummaryInput,
): Promise<ServiceResult<{ total: number; unread: number }>> {
  try {
    const { search, category, status } = input;
    const conditions = [eq(notifications.userId, userId)];

    if (category && category !== "all") {
      conditions.push(
        eq(notifications.category, category as NotificationCategory),
      );
    }
    if (status === "read") conditions.push(eq(notifications.isRead, true));
    else if (status === "unread")
      conditions.push(eq(notifications.isRead, false));
    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        sql`(${notifications.title} ILIKE ${searchTerm} OR ${notifications.body} ILIKE ${searchTerm})`,
      );
    }

    const [result] = await db
      .select({
        total: sql<number>`count(*)::int`,
        unread: sql<number>`count(*) filter (where ${notifications.isRead} = false)::int`,
      })
      .from(notifications)
      .where(and(...conditions));

    return {
      success: true,
      data: { total: result?.total ?? 0, unread: result?.unread ?? 0 },
    };
  } catch (err) {
    console.error("[getNotificationsSummary]", err);
    return {
      success: false,
      error: "Failed to fetch summary",
      code: "DB_ERROR",
    };
  }
}

// ── Device Token Registration
export async function registerDevice(
  userId: string,
  token: string,
  platform: "ios" | "android" | "web",
  deviceName?: string,
): Promise<ServiceResult<{ token: string }>> {
  try {
    await db
      .insert(deviceTokens)
      .values({
        userId,
        token,
        platform,
        deviceName: deviceName ?? null,
      })
      .onConflictDoUpdate({
        target: deviceTokens.token,
        set: { isActive: true, updatedAt: new Date() },
      });

    return { success: true, data: { token } };
  } catch (err) {
    console.error("[registerDevice]", err);
    return {
      success: false,
      error: "Failed to register device",
      code: "DB_ERROR",
    };
  }
}

// ── Get Active Device Tokens
export async function getActiveDeviceTokens(userId: string) {
  return db
    .select()
    .from(deviceTokens)
    .where(
      and(eq(deviceTokens.userId, userId), eq(deviceTokens.isActive, true)),
    );
}

// ── Check if user has active device token
export async function hasActiveDeviceToken(userId: string): Promise<{
  hasToken: boolean;
  tokenCount: number;
}> {
  const tokens = await getActiveDeviceTokens(userId);
  return { hasToken: tokens.length > 0, tokenCount: tokens.length };
}

// ── Deactivate Device Tokens
export async function deactivateDeviceTokens(tokens: string[]) {
  if (!tokens.length) return;
  await db
    .update(deviceTokens)
    .set({ isActive: false })
    .where(inArray(deviceTokens.token, tokens));
}
