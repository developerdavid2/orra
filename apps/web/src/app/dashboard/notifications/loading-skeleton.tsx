import { Skeleton } from "@orra/ui/components/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-6 p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </div>

      <div className="flex flex-col bg-card border border-muted shadow rounded-2xl flex-1 min-h-0 overflow-hidden">
        <div className="shrink-0 px-10 py-4 border-b border-border flex items-center gap-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-7 w-24 rounded-md ml-auto" />
          <Skeleton className="h-7 w-28 rounded-md" />
        </div>

        <div className="divide-y divide-border overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-4 px-10 py-5">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3.5 w-full max-w-lg" />
              </div>
              <Skeleton className="h-3 w-14 mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
