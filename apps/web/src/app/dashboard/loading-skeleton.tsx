import { Skeleton } from "@orra/ui/components/skeleton";

import { RecentInsightsSkeleton } from "@/modules/dashboard/ui/components/recent-insights";
import { RecentTransactionsSkeleton } from "@/modules/dashboard/ui/components/recent-transactions";
import { SpendingChartSkeleton } from "@/modules/dashboard/ui/components/spending-chart";
import { StatCardsSkeleton } from "@/modules/dashboard/ui/components/stat-cards";
import { TopCategoriesSkeleton } from "@/modules/dashboard/ui/components/top-monthly-categories";

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-10 bg-accent">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </div>

      <div className="bg-background border-muted shadow rounded-2xl p-5 space-y-4">
        <StatCardsSkeleton />
        <div className="flex flex-col gap-6 xl:flex-row">
          <div className="flex-1 min-w-0 self-start">
            <SpendingChartSkeleton />
          </div>
          <div className="w-full xl:w-100 xl:shrink-0 overflow-hidden">
            <RecentInsightsSkeleton />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <RecentTransactionsSkeleton />
          <TopCategoriesSkeleton />
        </div>
      </div>
    </div>
  );
}
