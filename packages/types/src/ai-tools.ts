import { z } from "zod";
import { tool } from "ai";

const UUID_RE =
  /^(?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;

const uuidInput = () =>
  z.string().refine((v) => UUID_RE.test(v), "Expected a valid UUID");

const datetimeInput = () =>
  z
    .string()
    .refine(
      (v) => !Number.isNaN(Date.parse(v)) && /\d/.test(v),
      "Expected a valid ISO datetime",
    );

export const CATEGORIES = [
  "food_dining",
  "utilities",
  "rent",
  "transport",
  "shopping",
  "entertainment",
  "healthcare",
  "education",
  "transfer",
  "income",
  "investment",
  "subscriptions",
  "groceries",
  "other",
] as const;

export const BUDGET_STATUSES = ["on_track", "warning", "over"] as const;
const ACCOUNT_TYPES = ["checking", "savings", "credit", "investment"] as const;
const BUDGET_PERIODS = ["weekly", "monthly", "custom"] as const;
export const CHART_TYPES = ["pie", "bar", "area"] as const;
export const CHART_PERIODS = ["7d", "30d", "90d"] as const;
export const ANALYSIS_PERIODS = [
  "7d",
  "30d",
  "90d",
  "this_month",
  "last_month",
  "custom",
] as const;
export const GROUP_BY = ["category", "day", "week"] as const;
export const ORDER_BY = [
  "date_desc",
  "date_asc",
  "amount_desc",
  "amount_asc",
] as const;
export const TX_STATUSES = [
  "pending",
  "successful",
  "refunded",
  "reversed",
  "failed",
] as const;
export const TIMEFRAMES = ["this_week", "this_month"] as const;

const transactionsFilter = z.object({
  query: z.string().max(200).optional(),
  category: z.enum(CATEGORIES).optional(),
  type: z.enum(["debit", "credit"]).optional(),
  status: z.enum(TX_STATUSES).optional(),
  accountId: uuidInput().optional(),
  dateFrom: datetimeInput().optional(),
  dateTo: datetimeInput().optional(),
  onlyAnomalies: z.boolean().optional().default(false),
  orderBy: z.enum(ORDER_BY).optional().default("date_desc"),
  includeNotes: z.boolean().optional().default(false),
});

const budgetsFilter = z.object({
  budgetId: uuidInput().optional(),
  status: z.enum(BUDGET_STATUSES).optional(),
  onlyActive: z.boolean().default(true),
  includeCategories: z.boolean().default(false),
  includeLinkedAccounts: z.boolean().default(false),
});

const accountsFilter = z.object({
  accountId: uuidInput().optional(),
  includeMonthlySpend: z.boolean().default(false),
  onlyActive: z.boolean().default(true),
});

const unbudgetedSpendingFilter = z.object({});

export const queryFinanceInput = z
  .discriminatedUnion("resource", [
    z.object({
      resource: z.literal("transactions"),
      filter: transactionsFilter,
    }),
    z.object({ resource: z.literal("budgets"), filter: budgetsFilter }),
    z.object({ resource: z.literal("accounts"), filter: accountsFilter }),
    z.object({
      resource: z.literal("unbudgeted_spending"),
      filter: unbudgetedSpendingFilter,
    }),
  ])
  .and(
    z.object({
      limit: z.number().int().min(1).max(50).default(15),
    }),
  );

export type QueryFinanceInput = z.infer<typeof queryFinanceInput>;

export const getSpendingAnalysisInput = z.object({
  period: z.enum(ANALYSIS_PERIODS).default("30d"),
  dateFrom: datetimeInput().optional().describe("Required when period=custom"),
  dateTo: datetimeInput().optional().describe("Required when period=custom"),
  groupBy: z.enum(GROUP_BY).default("category"),
  comparePrevious: z.boolean().default(true),
  limit: z.number().int().min(1).max(20).default(10),
  category: z.enum(CATEGORIES).optional(),
});
export type GetSpendingAnalysisInput = z.infer<typeof getSpendingAnalysisInput>;

export const renderSpendingChartInput = z.object({
  chartType: z.enum(CHART_TYPES),
  period: z.enum(CHART_PERIODS).default("30d"),
  title: z.string(),
});
export type RenderSpendingChartInput = z.infer<typeof renderSpendingChartInput>;

const budgetCreateShape = {
  name: z.string(),
  period: z.enum(BUDGET_PERIODS).default("monthly"),
  categories: z.array(
    z.object({ category: z.string(), limitAmount: z.number().positive() }),
  ),
  alertThreshold: z.number().int().min(1).max(100).default(80),
  reasoning: z.string(),
};

const budgetEditShape = {
  budgetId: z.string(),
  changes: z.object({
    name: z.string().optional(),
    categories: z
      .array(
        z.object({ category: z.string(), limitAmount: z.number().positive() }),
      )
      .optional(),
    alertThreshold: z.number().int().min(1).max(100).optional(),
  }),
  reasoning: z.string(),
};

const budgetDeleteShape = {
  budgetId: z.string(),
  reasoning: z.string(),
};

const budgetRebalanceShape = {
  steps: z
    .array(
      z.object({
        budgetId: z.string(),
        changeAmount: z.number(),
        reason: z.string(),
      }),
    )
    .min(2)
    .max(5),
  overallReasoning: z.string(),
};

const spendingGoalShape = {
  targetAmount: z.number().positive(),
  timeframe: z.enum(TIMEFRAMES),
  reasoning: z.string(),
};

const accountCreateShape = {
  name: z.string(),
  type: z.enum(ACCOUNT_TYPES),
  balance: z.number().default(0),
  bankName: z.string().optional(),
  reasoning: z.string(),
};

const recategorizeShape = {
  transactionIds: z.array(z.string()).min(1).max(50),
  targetCategory: z.string(),
  reasoning: z.string(),
};

const insightDismissShape = {
  insightId: z.string(),
  reasoning: z.string(),
};

export const proposeChangeInput = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("budget_create"), ...budgetCreateShape }),
  z.object({ kind: z.literal("budget_edit"), ...budgetEditShape }),
  z.object({ kind: z.literal("budget_delete"), ...budgetDeleteShape }),
  z.object({ kind: z.literal("budget_rebalance"), ...budgetRebalanceShape }),
  z.object({ kind: z.literal("spending_goal"), ...spendingGoalShape }),
  z.object({ kind: z.literal("account_create"), ...accountCreateShape }),
  z.object({ kind: z.literal("recategorize"), ...recategorizeShape }),
  z.object({ kind: z.literal("insight_dismiss"), ...insightDismissShape }),
]);

export type ProposeChangeInput = z.infer<typeof proposeChangeInput>;

// Narrow per-kind types, useful for typing handler functions individually
// without re-deriving the discriminated union each time.
export type ProposeBudgetCreateInput = Extract<
  ProposeChangeInput,
  { kind: "budget_create" }
>;
export type ProposeBudgetEditInput = Extract<
  ProposeChangeInput,
  { kind: "budget_edit" }
>;
export type ProposeBudgetDeleteInput = Extract<
  ProposeChangeInput,
  { kind: "budget_delete" }
>;
export type ProposeBudgetRebalanceInput = Extract<
  ProposeChangeInput,
  { kind: "budget_rebalance" }
>;
export type ProposeSpendingGoalInput = Extract<
  ProposeChangeInput,
  { kind: "spending_goal" }
>;
export type ProposeAccountCreateInput = Extract<
  ProposeChangeInput,
  { kind: "account_create" }
>;
export type ProposeRecategorizeInput = Extract<
  ProposeChangeInput,
  { kind: "recategorize" }
>;
export type ProposeInsightDismissInput = Extract<
  ProposeChangeInput,
  { kind: "insight_dismiss" }
>;

export const readOnlyToolContracts = {
  queryFinance: tool({
    description:
      "Query the user's financial data. Set `resource` to select what to look up: " +
      "'transactions' (search/filter by merchant, category, type, status, account, date range), " +
      "'budgets' (list budgets with computed health/percent-used), " +
      "'accounts' (list bank accounts with balance/type/institution), or " +
      "'unbudgeted_spending' (categories spent on this month with no active budget). " +
      "Provide `filter` matching the chosen resource.",
    inputSchema: queryFinanceInput,
  }),

  getSpendingAnalysis: tool({
    description:
      "Compute spending analytics for a period — totals, per-category breakdown, or a day/week trend — with optional comparison to the previous period.",
    inputSchema: getSpendingAnalysisInput,
  }),

  renderSpendingChart: tool({
    description:
      "Render an interactive chart of the user's spending — by category (pie/bar) or over time (area).",
    inputSchema: renderSpendingChartInput,
  }),
} as const;

export const actToolContracts = {
  ...readOnlyToolContracts,

  proposeChange: tool({
    description:
      "Draft a proposed change to the user's finances for their confirmation. Never applies " +
      "directly — this only creates a draft the user must approve. Set `kind` to select the " +
      "operation: 'budget_create', 'budget_edit', 'budget_delete', 'budget_rebalance', " +
      "'spending_goal', 'account_create', 'recategorize', or 'insight_dismiss', and provide the " +
      "fields for that kind.",
    inputSchema: proposeChangeInput,
  }),
} as const;

export type ToolMode = "plan" | "act";
export type ToolContracts = typeof actToolContracts;

export function getToolContracts(mode: ToolMode) {
  return mode === "plan" ? readOnlyToolContracts : actToolContracts;
}

export type ToolName = keyof ToolContracts;
