import { db } from "@orra/db";
import { bankAccounts } from "@orra/db/schema";
import { cache, cacheKeys } from "@orra/redis";
import {
  ACCOUNT_STATUSES,
  ACCOUNT_TYPES,
  type AccountsFilterInput,
  type AccountsListAllInput,
  type BankAccount,
  type CreateAccountInput,
  type PaginatedAccounts,
  type ServiceResult,
  type UpdateAccountInput,
} from "@orra/types";
import {
  and,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";

async function invalidateAggregateCache(userId: string) {
  await Promise.all([
    cache.del(cacheKeys.accounts.aggregate(userId)),
    cache.del(cacheKeys.accounts.totalBalance(userId)),
  ]);
}

export const AccountsService = {
  // ── LIST (paginated, filterable)
  async listByUser(
    userId: string,
    input: AccountsFilterInput,
  ): Promise<ServiceResult<PaginatedAccounts>> {
    try {
      const { limit, search, type, status, tags } = input;

      const conditions = [eq(bankAccounts.userId, userId)];

      if (type) {
        const types = Array.isArray(type) ? type : [type];
        if (types.length > 0 && types.length < ACCOUNT_TYPES.length) {
          conditions.push(
            inArray(
              bankAccounts.type,
              types as (typeof ACCOUNT_TYPES)[number][],
            ),
          );
        }
      }
      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        if (statuses.length > 0 && statuses.length < ACCOUNT_STATUSES.length) {
          conditions.push(
            inArray(
              bankAccounts.status,
              statuses as (typeof ACCOUNT_STATUSES)[number][],
            ),
          );
        }
      }
      if (tags?.length) {
        conditions.push(sql`${bankAccounts.tags} && ${tags}`);
      }
      if (search) {
        const s = `%${search}%`;
        const searchCond = or(
          ilike(bankAccounts.name, s),
          ilike(bankAccounts.bankName, s),
          ilike(bankAccounts.maskedNumber, s),
        );
        if (searchCond) conditions.push(searchCond);
      }

      const page = input.page ?? 1;
      const offset = (page - 1) * limit;

      const [rows, countRows] = await Promise.all([
        db
          .select(getTableColumns(bankAccounts))
          .from(bankAccounts)
          .where(and(...conditions))
          .orderBy(desc(bankAccounts.createdAt), desc(bankAccounts.id))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(bankAccounts)
          .where(and(...conditions)),
      ]);

      const totalCount = countRows[0]?.count ?? 0;
      const pageCount = Math.ceil(totalCount / limit);

      return {
        success: true,
        data: {
          items: rows as BankAccount[],
          totalCount,
          pageCount,
          nextCursor: null,
        },
      };
    } catch (err) {
      console.error("[AccountsService.listByUser]", err);
      return {
        success: false,
        error: "Failed to fetch accounts",
        code: "DB_ERROR",
      };
    }
  },

  // ── LIST ALL (no pagination)
  async listAllByUser(
    userId: string,
    input: AccountsListAllInput,
  ): Promise<ServiceResult<BankAccount[]>> {
    try {
      const { search, type, status, tags, isManual } = input;

      const conditions = [eq(bankAccounts.userId, userId)];

      if (type?.length) {
        conditions.push(
          inArray(bankAccounts.type, type as (typeof ACCOUNT_TYPES)[number][]),
        );
      }
      if (status?.length) {
        conditions.push(
          inArray(
            bankAccounts.status,
            status as (typeof ACCOUNT_STATUSES)[number][],
          ),
        );
      }
      if (tags?.length) {
        conditions.push(sql`${bankAccounts.tags} && ${tags}`);
      }
      if (isManual !== undefined) {
        conditions.push(eq(bankAccounts.isManual, isManual));
      }
      if (search) {
        const s = `%${search}%`;
        const searchCond = or(
          ilike(bankAccounts.name, s),
          ilike(bankAccounts.bankName, s),
          ilike(bankAccounts.maskedNumber, s),
        );
        if (searchCond) conditions.push(searchCond);
      }

      const rows = await db
        .select(getTableColumns(bankAccounts))
        .from(bankAccounts)
        .where(and(...conditions))
        .orderBy(desc(bankAccounts.createdAt));

      return { success: true, data: rows as BankAccount[] };
    } catch (err) {
      console.error("[AccountsService.listAllByUser]", err);
      return {
        success: false,
        error: "Failed to fetch accounts",
        code: "DB_ERROR",
      };
    }
  },

  async getById(
    id: string,
    userId: string,
  ): Promise<ServiceResult<BankAccount>> {
    try {
      const [row] = await db
        .select()
        .from(bankAccounts)
        .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
        .limit(1);

      if (!row)
        return {
          success: false,
          error: "Account not found",
          code: "NOT_FOUND",
        };

      return { success: true, data: row as BankAccount };
    } catch (err) {
      console.error("[AccountsService.getById]", err);
      return {
        success: false,
        error: "Failed to fetch account",
        code: "DB_ERROR",
      };
    }
  },

  async create(
    userId: string,
    input: CreateAccountInput,
  ): Promise<ServiceResult<BankAccount>> {
    try {
      const [created] = await db
        .insert(bankAccounts)
        .values({
          userId,
          name: input.name,
          type: input.type,
          subtype: input.subtype,
          tags: input.tags,
          bankName: input.bankName,
          maskedNumber: input.maskedNumber,
          balance: input.balance.toString(),
          currency: input.currency,
          isManual: true,
          status: "active",
        })
        .returning();

      await invalidateAggregateCache(userId);

      return { success: true, data: created! as BankAccount };
    } catch (err) {
      console.error("[AccountsService.create]", err);
      return {
        success: false,
        error: "Failed to create account",
        code: "DB_ERROR",
      };
    }
  },

  async update(
    userId: string,
    input: UpdateAccountInput,
  ): Promise<ServiceResult<BankAccount>> {
    try {
      const updateData: Record<string, unknown> = { updatedAt: new Date() };

      if (input.name !== undefined) updateData.name = input.name;
      if (input.type !== undefined) updateData.type = input.type;
      if (input.subtype !== undefined) updateData.subtype = input.subtype;
      if (input.tags !== undefined) updateData.tags = input.tags;
      if (input.bankName !== undefined) updateData.bankName = input.bankName;
      if (input.maskedNumber !== undefined)
        updateData.maskedNumber = input.maskedNumber;
      if (input.balance !== undefined)
        updateData.balance = input.balance.toString();
      if (input.currency !== undefined) updateData.currency = input.currency;

      const [updated] = await db
        .update(bankAccounts)
        .set(updateData)
        .where(
          and(eq(bankAccounts.id, input.id), eq(bankAccounts.userId, userId)),
        )
        .returning();

      if (!updated)
        return {
          success: false,
          error: "Account not found",
          code: "NOT_FOUND",
        };

      await invalidateAggregateCache(userId);

      return { success: true, data: updated as BankAccount };
    } catch (err) {
      console.error("[AccountsService.update]", err);
      return {
        success: false,
        error: "Failed to update account",
        code: "DB_ERROR",
      };
    }
  },

  async toggleStatus(
    id: string,
    userId: string,
    status: "active" | "inactive",
  ): Promise<ServiceResult<BankAccount>> {
    try {
      const [account] = await db
        .select({ isManual: bankAccounts.isManual })
        .from(bankAccounts)
        .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
        .limit(1);

      if (!account)
        return {
          success: false,
          error: "Account not found",
          code: "NOT_FOUND",
        };

      if (account.isManual)
        return {
          success: false,
          error:
            "Manual accounts cannot have their status toggled. Edit the account directly.",
          code: "FORBIDDEN",
        };

      const [updated] = await db
        .update(bankAccounts)
        .set({ status, updatedAt: new Date() })
        .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
        .returning();

      if (!updated)
        return {
          success: false,
          error: "Account not found",
          code: "NOT_FOUND",
        };

      await invalidateAggregateCache(userId);

      return { success: true, data: updated as BankAccount };
    } catch (err) {
      console.error("[AccountsService.toggleStatus]", err);
      return {
        success: false,
        error: "Failed to toggle account",
        code: "DB_ERROR",
      };
    }
  },

  async delete(
    id: string,
    userId: string,
  ): Promise<ServiceResult<{ id: string }>> {
    try {
      const [account] = await db
        .select({ isManual: bankAccounts.isManual })
        .from(bankAccounts)
        .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
        .limit(1);

      if (!account)
        return {
          success: false,
          error: "Account not found",
          code: "NOT_FOUND",
        };

      if (!account.isManual)
        return {
          success: false,
          error: "Synced accounts cannot be deleted. Disconnect instead.",
          code: "FORBIDDEN",
        };

      const [deleted] = await db
        .delete(bankAccounts)
        .where(and(eq(bankAccounts.id, id), eq(bankAccounts.userId, userId)))
        .returning({ id: bankAccounts.id });

      await invalidateAggregateCache(userId);

      return { success: true, data: { id: deleted!.id } };
    } catch (err) {
      console.error("[AccountsService.delete]", err);
      return {
        success: false,
        error: "Failed to delete account",
        code: "DB_ERROR",
      };
    }
  },

  async getAggregateBalanceByType(userId: string): Promise<
    ServiceResult<{
      byType: Array<{
        type: string;
        totalBalance: string;
        accountCount: number;
      }>;
      totalBalance: string;
      totalCount: number;
    }>
  > {
    try {
      const data = await cache.getOrSet(
        cacheKeys.accounts.aggregate(userId),
        async () => {
          const result = await db
            .select({
              type: bankAccounts.type,
              totalBalance: sql<string>`sum(${bankAccounts.balance})::numeric::text`,
              accountCount: sql<number>`count(*)::int`,
            })
            .from(bankAccounts)
            .where(
              and(
                eq(bankAccounts.userId, userId),
                eq(bankAccounts.status, "active"),
              ),
            )
            .groupBy(bankAccounts.type);

          const totalBalance = result
            .reduce((sum, r) => sum + parseFloat(r.totalBalance ?? "0"), 0)
            .toFixed(2);

          const totalCount = result.reduce((sum, r) => sum + r.accountCount, 0);

          return {
            byType: result.map((r) => ({
              type: r.type,
              totalBalance: parseFloat(r.totalBalance ?? "0").toFixed(2),
              accountCount: r.accountCount,
            })),
            totalBalance,
            totalCount,
          };
        },
        300,
      );
      return { success: true, data };
    } catch (err) {
      console.error("[AccountsService.getAggregateBalanceByType]", err);
      return {
        success: false,
        error: "Failed to aggregate balances",
        code: "DB_ERROR",
      };
    }
  },
} as const;
