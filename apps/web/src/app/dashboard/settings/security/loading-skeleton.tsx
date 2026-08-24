import { Skeleton } from "@orra/ui/components/skeleton";

import { SecuritySettingsSkeleton } from "@/modules/settings/pages/security/ui/components/security-settings-content";

export function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      <SecuritySettingsSkeleton />
    </div>
  );
}
