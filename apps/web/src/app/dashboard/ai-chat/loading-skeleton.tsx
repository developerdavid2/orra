import { Skeleton } from "@orra/ui/components/skeleton";

export function LoadingSkeleton() {
  return (
    <div className="flex w-full max-w-3xl mx-auto flex-col items-center justify-center gap-6 px-4 h-full">
      <div className="flex items-center justify-between w-full">
        <div className="space-y-2 flex flex-col">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="size-12 rounded-xl shrink-0" />
      </div>

      <div className="w-full space-y-4">
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-muted bg-card px-3 py-2 flex items-center gap-2"
            >
              <Skeleton className="size-4 rounded-sm" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </div>

        <Skeleton className="min-h-43.25 w-full rounded-2xl bg-card" />
      </div>
    </div>
  );
}
