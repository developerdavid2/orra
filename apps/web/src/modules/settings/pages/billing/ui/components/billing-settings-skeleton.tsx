import { Card, CardContent, CardHeader } from "@orra/ui/components/card";
import { Skeleton } from "@orra/ui/components/skeleton";

export function BillingSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-64 max-w-full" />
            </div>
            <div className="space-y-2 text-right">
              <Skeleton className="ml-auto h-5 w-16" />
              <Skeleton className="ml-auto h-3 w-12" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-1.5 w-full" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-14" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-7 w-24" />
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-3 w-full" />
              ))}
              <Skeleton className="h-9 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}