import { Skeleton } from "@orra/ui/components/skeleton";

import { ConnectedBanksSkeleton } from "@/modules/settings/pages/connected-banks/ui/components/connected-banks-skeleton";

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-52 rounded-md" />
      </div>

      <ConnectedBanksSkeleton />
    </div>
  );
}
