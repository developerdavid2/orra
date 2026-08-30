import type { QueryClient } from "@tanstack/react-query";

export function invalidateTRPCQueries(
  queryClient: QueryClient,
  routePath: string[],
) {
  return queryClient.invalidateQueries({
    predicate: (query) => {
      const queryKey = query.queryKey as unknown[];
      if (!Array.isArray(queryKey) || queryKey.length === 0) return false;

      const path = queryKey[0];
      if (!Array.isArray(path)) return false;

      // Check if the path starts with our routePath
      if (path.length < routePath.length) return false;

      return routePath.every((segment, index) => path[index] === segment);
    },
  });
}

export async function invalidateAccountsQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateTRPCQueries(queryClient, ["payments", "transactions"]),
    invalidateTRPCQueries(queryClient, ["payments", "accounts", "list"]),
    invalidateTRPCQueries(queryClient, ["payments", "accounts", "listAll"]),
    invalidateTRPCQueries(queryClient, [
      "payments",
      "accounts",
      "aggregateByType",
    ]),
    invalidateTRPCQueries(queryClient, ["payments", "accounts", "getById"]),
  ]);
}

export async function invalidateTransactionQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateTRPCQueries(queryClient, ["payments", "transactions", "list"]),
    invalidateTRPCQueries(queryClient, ["payments", "transactions", "getById"]),
    invalidateTRPCQueries(queryClient, [
      "payments",
      "transactions",
      "currentMonthSpending",
    ]),
    invalidateTRPCQueries(queryClient, ["ai", "insights"]),
  ]);
}

export async function invalidateInsightsQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateTRPCQueries(queryClient, ["ai", "insights", "list"]),
    invalidateTRPCQueries(queryClient, ["ai", "insights", "getInsightById"]),
    invalidateTRPCQueries(queryClient, ["ai", "insights", "recent"]),
  ]);
}

export async function invalidateBillingQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateTRPCQueries(queryClient, ["users", "billing", "status"]),
    invalidateTRPCQueries(queryClient, ["users", "billing", "plans"]),
  ]);
}

export async function invalidateChatQueries(queryClient: QueryClient) {
  await invalidateTRPCQueries(queryClient, ["ai", "coach", "sessions"]);
}

export async function invalidateChatSessionQueries(
  queryClient: QueryClient,
  _sessionId: string,
) {
  await Promise.all([
    invalidateTRPCQueries(queryClient, ["ai", "coach", "sessionById"]),
    invalidateTRPCQueries(queryClient, ["ai", "coach", "getMessages"]),
  ]);
}

export async function invalidatePlaidQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateTRPCQueries(queryClient, ["payments", "plaid"]),
  ]);
}

export async function invalidateAllPaymentQueries(queryClient: QueryClient) {
  await Promise.all([
    invalidateTRPCQueries(queryClient, ["payments", "plaid"]),
    invalidateTRPCQueries(queryClient, ["payments", "accounts"]),
    invalidateTRPCQueries(queryClient, ["payments", "transactions"]),
    invalidateTRPCQueries(queryClient, [
      "payments",
      "accounts",
      "aggregateByType",
    ]),
    invalidateTRPCQueries(queryClient, ["ai", "insights"]),
  ]);
}
