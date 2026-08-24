import { Skeleton } from "@orra/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="h-7 w-72 max-w-full" />
        <Skeleton className="h-4 w-[28rem] max-w-full" />
      </div>

      <div className="w-full max-w-3xl space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-wrap items-center gap-2 rounded-2xl border border-muted bg-card px-4 py-3"
          >
            <Skeleton className="size-4 rounded-sm" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-6 w-20 rounded-full ml-auto" />
          </div>
        ))}
      </div>

      <Skeleton className="h-12 w-full max-w-3xl rounded-2xl" />
    </div>
  );
}
