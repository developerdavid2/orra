import { Skeleton } from "@orra/ui/components/skeleton";

import { BudgetMonthlyStatsSkeleton } from "@/modules/budgets/ui/components/budget-monthly-stats-cards";
import { BudgetViewTabsSkeleton } from "@/modules/budgets/ui/components/budget-view-tabs";

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col w-full gap-6 p-10 h-[125vh]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-36 rounded-md" />
      </div>

      <BudgetMonthlyStatsSkeleton />
      <BudgetViewTabsSkeleton />
    </div>
  );
}
