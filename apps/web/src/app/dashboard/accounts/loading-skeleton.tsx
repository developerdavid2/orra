import { Skeleton } from "@orra/ui/components/skeleton";

import { AccountsListSkeleton } from "@/modules/accounts/ui/components/account-list";
import { AccountTypeCardsSkeleton } from "@/modules/accounts/ui/views/account-type-cards-view";

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col w-full gap-6 p-10 h-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      <AccountTypeCardsSkeleton />

      <div className="flex flex-col bg-card border border-muted shadow rounded-2xl flex-1 min-h-0 overflow-hidden">
        <div className="shrink-0 px-10 py-4 border-b border-border flex items-center gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-7 w-24 rounded-md ml-auto" />
          <Skeleton className="h-7 w-20 rounded-md" />
        </div>
        <AccountsListSkeleton />
      </div>
    </div>
  );
}
