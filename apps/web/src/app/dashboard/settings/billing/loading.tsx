import { Skeleton } from "@orra/ui/components/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-10">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="border border-muted shadow rounded-2xl p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-2/3 max-w-md" />
      </div>
    </div>
  );
}
