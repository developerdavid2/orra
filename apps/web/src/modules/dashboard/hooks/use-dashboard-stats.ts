import { useAccountAggregates } from "@/modules/accounts/hooks/queries/use-account-aggregates";
import { useCurrentMonthSpending } from "./queries/use-current-month-spending";

export function useDashboardStats() {
  const { totalBalance, totalCount, aggregateMap } = useAccountAggregates();
  const { data: monthSpending } = useCurrentMonthSpending();

  const savingsBalance = Number(aggregateMap.get("savings")?.totalBalance ?? 0);
  const savingsRate =
    totalBalance > 0 ? (savingsBalance / totalBalance) * 100 : 0;
  return {
    totalBalance,
    monthSpending,
    savingsRate,
    totalCount,
  };
}
