import { Skeleton } from "@orra/ui/components/skeleton";

import { InsightsListSkeleton } from "@/modules/insights/ui/components/insights-list";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      <div className="bg-card border-muted shadow rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-7 w-20 rounded-md ml-auto" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>
        <InsightsListSkeleton />
      </div>
    </div>
  );
}
