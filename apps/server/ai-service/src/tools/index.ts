import {
  bankAccounts,
  budgetAccounts,
  budgetCategories,
  budgets,
  db,
  insights,
  transactions,
} from "@orra/db";
import {
  actToolContracts,
  readOnlyToolContracts,
  type GetSpendingAnalysisInput,
  type ProposeChangeInput,
  type QueryFinanceInput,
  type RenderSpendingChartInput,
  getSpendingAnalysisInput,
  proposeChangeInput,
  queryFinanceInput,
  renderSpendingChartInput,
} from "@orra/types";
import { tool, type Tool } from "ai";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

const DAY_MS = 24 * 60 * 60 * 1000;

const money = (v: unknown): number => Number(v ?? 0);

const iso = (d: Date) => d.toISOString();

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const day = (result.getDay() + 6) % 7; // Monday = 0
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(d: Date): Date {
  const result = new Date(d);
  result.setHours(23, 59, 59, 999);
  return result;
}

// ============================================================================
// queryFinance — one entry point for transactions / budgets / accounts /
// unbudgeted spending, mirroring how BudgetsService scopes spend (debit only,
// per-category, budget's own date range and linked accounts).
// ============================================================================

const TX_ORDER_BY = {
  date_desc: desc(transactions.date),
  date_asc: asc(transactions.date),
  amount_desc: desc(sql`${transactions.amount}::numeric`),
  amount_asc: asc(sql`${transactions.amount}::numeric`),
} as const;

// Per-resource slices of the discriminated union — helpers take these so the
// filter object narrows without re-checking `resource` internally.
type TransactionsQuery = Extract<QueryFinanceInput, { resource: "transactions" }>;
type BudgetsQuery = Extract<QueryFinanceInput, { resource: "budgets" }>;
type AccountsQuery = Extract<QueryFinanceInput, { resource: "accounts" }>;
type TransactionsFilter = TransactionsQuery["filter"];
type BudgetsFilter = BudgetsQuery["filter"];
type AccountsFilter = AccountsQuery["filter"];

async function queryTransactions(
  userId: string,
  input: TransactionsQuery,
) {
  const f = input.filter as TransactionsFilter;
  const conditions = [eq(transactions.userId, userId)];

  if (f.query) {
    conditions.push(
      or(
        ilike(transactions.description, `%${f.query}%`),
        ilike(transactions.merchant, `%${f.query}%`),
      )!,
    );
  }
  if (f.category) conditions.push(eq(transactions.category, f.category));
  if (f.type) conditions.push(eq(transactions.type, f.type));
  if (f.status) conditions.push(eq(transactions.status, f.status));
  if (f.accountId) conditions.push(eq(transactions.bankAccountId, f.accountId));
  if (f.dateFrom) conditions.push(gte(transactions.date, new Date(f.dateFrom)));
  if (f.dateTo) conditions.push(lte(transactions.date, new Date(f.dateTo)));
  if (f.onlyAnomalies) conditions.push(eq(transactions.isAnomaly, true));

  const rows = await db
    .select({
      id: transactions.id,
      description: transactions.description,
      merchant: transactions.merchant,
      amount: transactions.amount,
      type: transactions.type,
      category: transactions.category,
      status: transactions.status,
      date: transactions.date,
      ...(f.includeNotes ? { notes: transactions.notes } : {}),
    })
    .from(transactions)
    .where(and(...conditions))
    .orderBy(TX_ORDER_BY[f.orderBy ?? "date_desc"])
    .limit(input.limit);

  return {
    resource: "transactions" as const,
    count: rows.length,
    transactions: rows.map((r) => ({ ...r, amount: money(r.amount) })),
  };
}

async function queryBudgets(userId: string, input: BudgetsQuery) {
  const f = input.filter as BudgetsFilter;
  const conditions = [eq(budgets.userId, userId)];
  if (f.budgetId) conditions.push(eq(budgets.id, f.budgetId));
  if (f.status) conditions.push(eq(budgets.status, f.status));
  if (f.onlyActive) conditions.push(eq(budgets.isActive, true));

  const rows = await db
    .select()
    .from(budgets)
    .where(and(...conditions))
    .orderBy(desc(budgets.startDate))
    .limit(input.limit);

  const categoryRows =
    f.includeCategories && rows.length > 0
      ? await db
          .select()
          .from(budgetCategories)
          .where(
            inArray(
              budgetCategories.budgetId,
              rows.map((b) => b.id),
            ),
          )
      : [];

  // One upfront fetch: linked accounts per budget (ids scope the spend
  // queries, names are for display). Mirrors BudgetsService.loadCategories.
  const linkRows =
    rows.length > 0
      ? await db
          .select({
            budgetId: budgetAccounts.budgetId,
            bankAccountId: budgetAccounts.bankAccountId,
            name: bankAccounts.name,
          })
          .from(budgetAccounts)
          .innerJoin(
            bankAccounts,
            eq(bankAccounts.id, budgetAccounts.bankAccountId),
          )
          .where(
            inArray(
              budgetAccounts.budgetId,
              rows.map((b) => b.id),
            ),
          )
      : [];

  const now = new Date();
  const enriched = await Promise.all(
    rows.map(async (b) => {
      const cats = categoryRows.filter((c) => c.budgetId === b.id);
      const links = linkRows.filter((l) => l.budgetId === b.id);
      const accountIds = [...new Set(links.map((l) => l.bankAccountId))];

      const categoriesWithSpend = await Promise.all(
        cats.map(async (row) => {
          const spendConditions = [
            eq(transactions.userId, userId),
            eq(transactions.type, "debit"),
            eq(transactions.category, row.category),
            gte(transactions.date, b.startDate),
            lte(transactions.date, b.endDate),
            ...(accountIds.length > 0
              ? [inArray(transactions.bankAccountId, accountIds)]
              : []),
          ];

          const [result] = await db
            .select({
              total:
                sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(
                  Number,
                ),
              count: sql<number>`COUNT(*)`.mapWith(Number),
            })
            .from(transactions)
            .where(and(...spendConditions));

          const limit = Number(row.limitAmount);
          const spent = result?.total ?? 0;
          return {
            category: row.category as string,
            limitAmount: limit,
            spent,
            remaining: limit - spent,
            percentUsed: limit > 0 ? Math.round((spent / limit) * 100) : 0,
            transactionCount: result?.count ?? 0,
          };
        }),
      );

      const limitAmount = Number(b.limitAmount);
      const totalSpent = categoriesWithSpend.reduce((s, c) => s + c.spent, 0);

      return {
        id: b.id,
        name: b.name,
        period: b.period as string,
        status: b.status as string,
        limitAmount,
        totalSpent,
        remaining: limitAmount - totalSpent,
        percentUsed:
          limitAmount > 0 ? Math.round((totalSpent / limitAmount) * 100) : 0,
        daysRemaining: Math.max(
          0,
          Math.ceil((b.endDate.getTime() - now.getTime()) / DAY_MS),
        ),
        startDate: iso(b.startDate),
        endDate: iso(b.endDate),
        ...(f.includeCategories ? { categories: categoriesWithSpend } : {}),
        ...(f.includeLinkedAccounts
          ? { linkedAccounts: links.map((l) => l.name) }
          : {}),
      };
    }),
  );

  return { resource: "budgets" as const, count: enriched.length, budgets: enriched };
}

async function queryAccounts(userId: string, input: AccountsQuery) {
  const f = input.filter as AccountsFilter;
  const conditions = [eq(bankAccounts.userId, userId)];
  if (f.accountId) conditions.push(eq(bankAccounts.id, f.accountId));
  if (f.onlyActive) conditions.push(eq(bankAccounts.status, "active"));

  const rows = await db
    .select({
      id: bankAccounts.id,
      name: bankAccounts.name,
      type: bankAccounts.type,
      balance: bankAccounts.balance,
      currency: bankAccounts.currency,
      bankName: bankAccounts.bankName,
      isManual: bankAccounts.isManual,
      status: bankAccounts.status,
    })
    .from(bankAccounts)
    .where(and(...conditions))
    .orderBy(asc(bankAccounts.name))
    .limit(input.limit);

  let monthlyByAccount = new Map<string, number>();
  if (f.includeMonthlySpend && rows.length > 0) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const spendRows = await db
      .select({
        accountId: transactions.bankAccountId,
        total:
          sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "debit"),
          gte(transactions.date, monthStart),
        ),
      )
      .groupBy(transactions.bankAccountId);

    monthlyByAccount = new Map(spendRows.map((r) => [r.accountId, r.total]));
  }

  return {
    resource: "accounts" as const,
    count: rows.length,
    accounts: rows.map((a) => ({
      ...a,
      balance: money(a.balance),
      ...(f.includeMonthlySpend
        ? { currentMonthSpend: monthlyByAccount.get(a.id) ?? 0 }
        : {}),
    })),
  };
}

async function queryUnbudgetedSpending(userId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const activeBudgetCategories = await db
    .selectDistinct({ category: budgetCategories.category })
    .from(budgets)
    .innerJoin(budgetCategories, eq(budgetCategories.budgetId, budgets.id))
    .where(
      and(
        eq(budgets.userId, userId),
        eq(budgets.isActive, true),
        lte(budgets.startDate, now),
        gte(budgets.endDate, now),
      ),
    );

  const covered = activeBudgetCategories.map((r) => r.category);
  const baseConditions = [
    eq(transactions.userId, userId),
    eq(transactions.type, "debit"),
    gte(transactions.date, monthStart),
    lte(transactions.date, endOfDay(now)),
  ];

  const rows = await db
    .select({
      category: transactions.category,
      totalSpent:
        sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(transactions)
    .where(
      and(
        ...baseConditions,
        covered.length > 0
          ? notInArray(transactions.category, covered)
          : undefined,
      ),
    )
    .groupBy(transactions.category)
    .orderBy(desc(sql`SUM(${transactions.amount})`));

  return {
    resource: "unbudgeted_spending" as const,
    month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
    categories: rows.map((r) => ({
      category: (r.category ?? "other") as string,
      totalSpent: r.totalSpent,
      transactionCount: r.count,
    })),
  };
}

async function executeQueryFinance(input: QueryFinanceInput, userId: string) {
  switch (input.resource) {
    case "transactions":
      return queryTransactions(userId, input);
    case "budgets":
      return queryBudgets(userId, input);
    case "accounts":
      return queryAccounts(userId, input);
    case "unbudgeted_spending":
      return queryUnbudgetedSpending(userId);
  }
}

// ============================================================================
// getSpendingAnalysis — totals + grouped breakdown + previous-period compare.
// ============================================================================

function resolveAnalysisWindow(input: GetSpendingAnalysisInput) {
  const to = endOfDay(new Date());

  switch (input.period) {
    case "7d":
    case "30d":
    case "90d": {
      const days = Number(input.period.replace("d", ""));
      return { from: new Date(to.getTime() - days * DAY_MS), to };
    }
    case "this_month":
      return {
        from: new Date(to.getFullYear(), to.getMonth(), 1),
        to,
      };
    case "last_month":
      return {
        from: new Date(to.getFullYear(), to.getMonth() - 1, 1),
        to: new Date(to.getFullYear(), to.getMonth(), 0, 23, 59, 59, 999),
      };
    case "custom":
      if (!input.dateFrom || !input.dateTo) {
        throw new Error("period=custom requires dateFrom and dateTo");
      }
      return { from: new Date(input.dateFrom), to: new Date(input.dateTo) };
  }
}

async function executeGetSpendingAnalysis(
  input: GetSpendingAnalysisInput,
  userId: string,
) {
  const { from, to } = resolveAnalysisWindow(input);
  const baseConditions = [
    eq(transactions.userId, userId),
    eq(transactions.type, "debit"),
    gte(transactions.date, from),
    lte(transactions.date, to),
    ...(input.category ? [eq(transactions.category, input.category)] : []),
  ];

  const totalsRows = await db
    .select({
      total:
        sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
      count: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(transactions)
    .where(and(...baseConditions));
  const totals = totalsRows[0] ?? { total: 0, count: 0 };

  let breakdown: Record<string, unknown>;

  if (input.groupBy === "category") {
    const byCategory = await db
      .select({
        category: transactions.category,
        totalSpent:
          sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(transactions)
      .where(and(...baseConditions))
      .groupBy(transactions.category)
      .orderBy(desc(sql`SUM(${transactions.amount})`))
      .limit(input.limit);

    breakdown = {
      byCategory: byCategory.map((r) => ({
        category: r.category ?? null,
        totalSpent: r.totalSpent,
        count: r.count,
        percentage:
          totals.total > 0
            ? Math.round((r.totalSpent / totals.total) * 1000) / 10
            : 0,
      })),
    };
  } else {
    const truncUnit = input.groupBy === "week" ? "week" : "day";
    const series = await db
      .select({
        bucket: sql<string>`TO_CHAR(DATE_TRUNC('${sql.raw(truncUnit)}', ${transactions.date}), 'YYYY-MM-DD')`,
        totalSpent:
          sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
        count: sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(transactions)
      .where(and(...baseConditions))
      .groupBy(sql`DATE_TRUNC('${sql.raw(truncUnit)}', ${transactions.date})`)
      .orderBy(
        asc(sql`DATE_TRUNC('${sql.raw(truncUnit)}', ${transactions.date})`),
      );

    breakdown = {
      [input.groupBy === "week" ? "byWeek" : "byDay"]: series.map((r) => ({
        date: r.bucket,
        totalSpent: r.totalSpent,
        count: r.count,
      })),
    };
  }

  let previousPeriod: {
    from: string;
    to: string;
    totalSpent: number;
    percentChange: number | null;
  } | null = null;

  if (input.comparePrevious) {
    const spanMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - spanMs);

    const [prevTotals] = await db
      .select({
        total:
          sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "debit"),
          gte(transactions.date, prevFrom),
          lte(transactions.date, prevTo),
          ...(input.category
            ? [eq(transactions.category, input.category)]
            : []),
        ),
      );

    previousPeriod = {
      from: iso(prevFrom),
      to: iso(prevTo),
      totalSpent: prevTotals?.total ?? 0,
      percentChange:
        prevTotals && prevTotals.total > 0
          ? Math.round(((totals.total - prevTotals.total) / prevTotals.total) * 1000) /
            10
          : null,
    };
  }

  return {
    period: { from: iso(from), to: iso(to), label: input.period },
    groupBy: input.groupBy,
    totalSpent: totals.total,
    transactionCount: totals.count,
    ...breakdown,
    previousPeriod,
  };
}

// ============================================================================
// renderSpendingChart — data shaped for ChatSpendingChart ({label,value}[]).
// ============================================================================

async function executeRenderSpendingChart(
  input: RenderSpendingChartInput,
  userId: string,
) {
  const to = endOfDay(new Date());
  const days = Number(input.period.replace("d", ""));
  const from = new Date(to.getTime() - days * DAY_MS);
  const baseConditions = [
    eq(transactions.userId, userId),
    eq(transactions.type, "debit"),
    gte(transactions.date, from),
    lte(transactions.date, to),
  ];

  if (input.chartType === "area") {
    const series = await db
      .select({
        bucket: sql<string>`TO_CHAR(DATE_TRUNC('day', ${transactions.date}), 'YYYY-MM-DD')`,
        value:
          sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
      })
      .from(transactions)
      .where(and(...baseConditions))
      .groupBy(sql`DATE_TRUNC('day', ${transactions.date})`)
      .orderBy(asc(sql`DATE_TRUNC('day', ${transactions.date})`));

    return {
      chartType: input.chartType,
      title: input.title,
      data: series.map((r) => ({ label: r.bucket, value: r.value })),
    };
  }

  const byCategory = await db
    .select({
      category: transactions.category,
      value:
        sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(Number),
    })
    .from(transactions)
    .where(and(...baseConditions))
    .groupBy(transactions.category)
    .orderBy(desc(sql`SUM(${transactions.amount})`));

  let data = byCategory.map((r) => ({
    label: (r.category ?? "Other").replace(/_/g, " "),
    value: r.value,
  }));

  if (input.chartType === "pie") {
    const top = data.slice(0, 8);
    const restSum = data.slice(8).reduce((s, d) => s + d.value, 0);
    data = restSum > 0 ? [...top, { label: "Other", value: restSum }] : top;
  } else {
    data = data.slice(0, 10);
  }

  return { chartType: input.chartType, title: input.title, data };
}

// ============================================================================
// proposeChange — drafts ONLY. Echoes back an envelope the web proposal cards
// already render; nothing is persisted until the user confirms in the UI.
// ============================================================================

function draftDates(period: "weekly" | "monthly" | "custom") {
  const now = new Date();
  if (period === "weekly") {
    return { startDate: startOfWeek(now), endDate: endOfDay(new Date(startOfWeek(now).getTime() + 6 * DAY_MS)) };
  }
  if (period === "monthly") {
    return {
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }
  return {
    startDate: now,
    endDate: new Date(now.getTime() + 30 * DAY_MS),
  };
}

async function fetchBudgetSnapshot(budgetId: string, userId: string) {
  const [budget] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)))
    .limit(1);
  if (!budget) throw new Error(`Budget ${budgetId} not found`);

  const cats = await db
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.budgetId, budgetId));

  return {
    row: budget,
    snapshot: {
      name: budget.name,
      limitAmount: Number(budget.limitAmount),
      alertThreshold: budget.alertThreshold,
      categories: cats.map((c) => ({
        category: c.category as string,
        limitAmount: Number(c.limitAmount),
      })),
    },
  };
}

async function executeProposeChange(
  input: ProposeChangeInput,
  userId: string,
): Promise<Record<string, unknown>> {
  switch (input.kind) {
    case "budget_create": {
      const { startDate, endDate } = draftDates(input.period);
      return {
        kind: input.kind,
        status: "pending_confirmation",
        proposalId: crypto.randomUUID(),
        draft: {
          name: input.name,
          period: input.period,
          limitAmount: input.categories.reduce((s, c) => s + c.limitAmount, 0),
          categories: input.categories,
          alertThreshold: input.alertThreshold,
          startDate: iso(startDate),
          endDate: iso(endDate),
        },
        reasoning: input.reasoning,
      };
    }

    case "budget_edit": {
      const { row, snapshot } = await fetchBudgetSnapshot(
        input.budgetId,
        userId,
      );
      return {
        kind: input.kind,
        status: "pending_confirmation",
        budgetId: row.id,
        current: snapshot,
        proposed: {
          name: input.changes.name ?? snapshot.name,
          alertThreshold:
            input.changes.alertThreshold ?? snapshot.alertThreshold,
          categories: input.changes.categories ?? snapshot.categories,
        },
        reasoning: input.reasoning,
      };
    }

    case "budget_delete": {
      const { row } = await fetchBudgetSnapshot(input.budgetId, userId);
      return {
        kind: input.kind,
        status: "pending_confirmation",
        budgetId: row.id,
        budgetName: row.name,
        reasoning: input.reasoning,
      };
    }

    case "budget_rebalance": {
      const steps = await Promise.all(
        input.steps.map(async (step, index) => {
          const { row } = await fetchBudgetSnapshot(step.budgetId, userId);
          const currentLimit = Number(row.limitAmount);
          return {
            order: index + 1,
            budgetId: step.budgetId,
            budgetName: row.name,
            currentLimit,
            newLimit: currentLimit + step.changeAmount,
            changeAmount: step.changeAmount,
            reason: step.reason,
          };
        }),
      );
      return {
        kind: input.kind,
        status: "pending_confirmation",
        steps,
        overallReasoning: input.overallReasoning,
      };
    }

    case "spending_goal":
      return {
        kind: input.kind,
        status: "pending_confirmation",
        draft: { targetAmount: input.targetAmount, timeframe: input.timeframe },
        reasoning: input.reasoning,
      };

    case "account_create":
      return {
        kind: input.kind,
        status: "pending_confirmation",
        draft: {
          name: input.name,
          type: input.type,
          balance: input.balance,
          bankName: input.bankName ?? null,
        },
        reasoning: input.reasoning,
      };

    case "recategorize": {
      const rows = await db
        .select({
          id: transactions.id,
          description: transactions.description,
          merchant: transactions.merchant,
          amount: transactions.amount,
          category: transactions.category,
        })
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, userId),
            inArray(transactions.id, input.transactionIds),
          ),
        );

      if (rows.length === 0) {
        throw new Error("None of the given transactions were found");
      }

      return {
        kind: input.kind,
        status: "pending_confirmation",
        targetCategory: input.targetCategory,
        changes: rows.map((r) => ({
          transactionId: r.id,
          description: r.description,
          merchant: r.merchant,
          amount: money(r.amount),
          from: (r.category ?? "other") as string,
          to: input.targetCategory,
        })),
        reasoning: input.reasoning,
      };
    }

    case "insight_dismiss": {
      const [insight] = await db
        .select({ id: insights.id, title: insights.title })
        .from(insights)
        .where(and(eq(insights.id, input.insightId), eq(insights.userId, userId)))
        .limit(1);
      if (!insight) throw new Error(`Insight ${input.insightId} not found`);

      return {
        kind: input.kind,
        status: "pending_confirmation",
        insightId: insight.id,
        insightTitle: insight.title,
        reasoning: input.reasoning,
      };
    }
  }
}

// ============================================================================
// buildTools — runtime tools = contract metadata + server-side execute.
// NightCode ships contracts without execute because its CLI executes locally;
// Orra's data lives in Postgres, so execution happens here and results flow
// back through the stream automatically.
// ============================================================================

type ToolContext = { userId: string };

export function buildTools({ userId }: ToolContext) {
  return {
    queryFinance: tool({
      description: readOnlyToolContracts.queryFinance.description,
      inputSchema: queryFinanceInput,
      execute: (input: QueryFinanceInput) => executeQueryFinance(input, userId),
    }),

    getSpendingAnalysis: tool({
      description: readOnlyToolContracts.getSpendingAnalysis.description,
      inputSchema: getSpendingAnalysisInput,
      execute: (input: GetSpendingAnalysisInput) =>
        executeGetSpendingAnalysis(input, userId),
    }),

    renderSpendingChart: tool({
      description: readOnlyToolContracts.renderSpendingChart.description,
      inputSchema: renderSpendingChartInput,
      execute: (input: RenderSpendingChartInput) =>
        executeRenderSpendingChart(input, userId),
    }),

    proposeChange: tool({
      description: actToolContracts.proposeChange.description,
      inputSchema: proposeChangeInput,
      execute: (input: ProposeChangeInput) =>
        executeProposeChange(input, userId),
    }),
  } satisfies Record<string, Tool>;
}
