import {
  bankAccounts,
  budgetAccounts,
  budgetCategories,
  budgets,
  db,
  transactions,
} from "@orra/db";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";

export async function fetchBudgetContext(
  userId: string,
  budgetId: string,
): Promise<unknown> {
  const [budget] = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.id, budgetId), eq(budgets.userId, userId)))
    .limit(1);

  if (!budget) return { error: "Budget not found" };

  const categoryRows = await db
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.budgetId, budgetId));

  const linkedAccounts = await db
    .select({
      bankAccountId: budgetAccounts.bankAccountId,
      name: bankAccounts.name,
    })
    .from(budgetAccounts)
    .innerJoin(bankAccounts, eq(bankAccounts.id, budgetAccounts.bankAccountId))
    .where(eq(budgetAccounts.budgetId, budgetId));

  const accountIds = linkedAccounts.map((a) => a.bankAccountId);

  const categories = await Promise.all(
    categoryRows.map(async (row) => {
      const conditions = [
        eq(transactions.userId, userId),
        eq(transactions.type, "debit"),
        eq(transactions.category, row.category),
        gte(transactions.date, budget.startDate),
        lte(transactions.date, budget.endDate),
      ];
      if (accountIds.length > 0) {
        conditions.push(inArray(transactions.bankAccountId, accountIds));
      }

      const [result] = await db
        .select({
          total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`.mapWith(
            Number,
          ),
          count: sql<number>`COUNT(*)`.mapWith(Number),
        })
        .from(transactions)
        .where(and(...conditions));

      const limit = Number(row.limitAmount);
      const spent = result?.total ?? 0;
      return {
        category: row.category,
        limitAmount: limit,
        spent,
        remaining: limit - spent,
        percentUsed: limit > 0 ? Math.round((spent / limit) * 100) : 0,
        transactionCount: result?.count ?? 0,
      };
    }),
  );

  const totalLimit = Number(budget.limitAmount);
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0);

  return {
    budget,
    categories,
    linkedAccounts: linkedAccounts.map((a) => a.name),
    totalSpent,
    remaining: totalLimit - totalSpent,
    percentUsed:
      totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0,
  };
}
