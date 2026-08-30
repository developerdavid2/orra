import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const chatContextTypeEnum = pgEnum("chat_context_type", [
  "insight",
  "transaction",
  "budget",
  "account",
  "institution",
  "vault",
  "split",
  "general",
]);
export const topicTypeEnum = pgEnum("topic", [
  "budgeting",
  "spending",
  "savings",
  "general",
]);
export const roleEnum = pgEnum("role", ["user", "assistant"]);

export const chatModeEnum = pgEnum("chat_mode", ["plan", "act"]);

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    topic: topicTypeEnum("topic").default("general"),
    contextType: chatContextTypeEnum("context_type").default("general"),
    contextId: text("context_id"),
    mode: chatModeEnum("mode").default("plan"),
    model: text("model"),
    isActive: boolean("is_active").default(true),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    index("chat_sessions_user_idx").on(t.userId),
    index("chat_sessions_updated_idx").on(t.updatedAt),
    index("chat_sessions_context_idx").on(t.contextType, t.contextId),
  ],
);

export type ChatSessionRecord = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export const chatMessages = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    content: text("content").notNull(),
    tokensUsed: integer("tokens_used"),
    metadata: text("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index("chat_messages_session_idx").on(t.sessionId),
    index("chat_messages_created_idx").on(t.createdAt),
  ],
);

export type ChatMessageRecord = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    queryCount: integer("query_count").notNull().default(0),
    tokenCount: integer("token_count").notNull().default(0),
    insightCount: integer("insight_count").notNull().default(0),
    lastQueryAt: timestamp("last_query_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("ai_usage_user_month_idx").on(t.userId, t.year, t.month)],
);
export type AIUsageRecord = typeof aiUsage.$inferSelect;
export type NewAIUsage = typeof aiUsage.$inferInsert;
