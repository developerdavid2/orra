import z from "zod";

export const CHAT_CONTEXT_TYPES = [
  "insight",
  "transaction",
  "budget",
  "account",
  "institution",
  "vault",
  "split",
  "general",
] as const;

export const CHAT_TOPIC_TYPES = [
  "budgeting",
  "spending",
  "savings",
  "general",
] as const;

export const ROLES = ["user", "assistant"] as const;

export type ChatContextType = (typeof CHAT_CONTEXT_TYPES)[number];
export type ChatTopicType = (typeof CHAT_TOPIC_TYPES)[number];
export type ChatRole = (typeof ROLES)[number];

export const startOrCreateChatSessionSchema = z
  .object({
    sessionId: z.uuid().optional(),
    contextType: z.enum(CHAT_CONTEXT_TYPES).default("general"),
    contextId: z.string().optional(),
    title: z.string().min(1).max(100).optional(),
    topic: z.enum(CHAT_TOPIC_TYPES).default("general"),
  })
  .refine((data) => data.contextType === "general" || !!data.contextId, {
    message: "contextId is required when contextType is not 'general'",
  });
export const sendMessageSchema = z.object({
  sessionId: z.uuid(),
  content: z.string().min(1).max(4000),
});

export const chatSessionsFilterSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  includeArchived: z.boolean().default(false),
  contextType: z.enum(CHAT_CONTEXT_TYPES).optional(),
  topic: z.enum(CHAT_TOPIC_TYPES).optional(),
  search: z.string().trim().optional(),
});

export const chatMesssagesParamsSchema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const sessionByIdSchema = z.object({
  sessionId: z.uuid(),
});

export const updateSessionTitleSchema = z.object({
  sessionId: z.uuid(),
  title: z.string().min(1).max(100),
});

export type ChatSessionsFilterInput = z.infer<typeof chatSessionsFilterSchema>;
export type StartOrCreateChatSessionInput = z.infer<
  typeof startOrCreateChatSessionSchema
>;
export type UpdateSessionTitleInput = z.infer<typeof updateSessionTitleSchema>;

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ChatMessagesParamsInput = z.infer<typeof chatMesssagesParamsSchema>;

export type ChatSession = {
  topic: "general" | "budgeting" | "spending" | "savings" | null;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  title: string;
  contextType:
    | "insight"
    | "transaction"
    | "budget"
    | "account"
    | "institution"
    | "vault"
    | "split"
    | "general"
    | null;
  contextId: string | null;
  isActive: boolean | null;
  archivedAt: Date | null;
};

export type ChatMessage = {
  role: "user" | "assistant";
  id: string;
  createdAt: Date;
  userId: string;
  sessionId: string;
  content: string;
  tokensUsed: number | null;
  metadata: string | null;
};

export type PaginatedChatSessions = {
  items: ChatSession[];
  nextCursor: string | null;
  total?: number;
};
export type PaginatedChatMessages = {
  items: ChatMessage[];
  nextCursor: string | null;
  total?: number;
};

export interface StreamChatRequest {
  sessionId: string;
  userId: string;
  content: string;
  planTier?: string;
}

export interface StreamChatResponse {
  success: boolean;
  error?: string;
  code?: string;
}

export interface ContextSnapshot {
  type: string;
  data: unknown;
  fetchedAt: string;
}

export const CONTEXT_TOOL_SCOPE: Record<string, string[]> = {
  general: [
    "queryFinance",
    "getSpendingAnalysis",
    "renderSpendingChart",
    "proposeChange",
  ],
  transaction: ["queryFinance", "getSpendingAnalysis"],
  budget: ["queryFinance", "renderSpendingChart", "proposeChange"],
  account: ["queryFinance", "proposeChange"],
  institution: ["queryFinance"],
  vault: ["queryFinance", "renderSpendingChart"],
  split: ["queryFinance"],
  insight: ["queryFinance", "getSpendingAnalysis", "proposeChange"],
};
