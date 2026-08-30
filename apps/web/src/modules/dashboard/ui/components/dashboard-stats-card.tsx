"use client";

import { useDashboardStats } from "@/modules/dashboard/hooks/use-dashboard-stats";
import { Skeleton } from "@orra/ui/components/skeleton";
import { cn } from "@orra/ui/lib/utils";
import { cardTemplates } from "../../constants";

export function DashboardStatsCard() {
  const { totalBalance, monthSpending, savingsRate, totalCount } =
    useDashboardStats();

  const values = [
    totalBalance,
    monthSpending,
    Number(savingsRate.toFixed(2)),
    totalCount,
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 backdrop-blur-xl rounded-xl  overflow-hidden">
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-tr from-white via-violet-300 from-0% via-40% to-30% to-transparent blur-[100px] sm:blur-[250px] opacity-40 overflow-hidden ",
          "hover:shadow-[0_1px_1px_rgba(255,255,255,0.06)_inset,0_18px_40px_rgba(0,0,0,0.18)]",
        )}
      />
      {cardTemplates.map((card, index) => (
        <div
          key={card.label}
          className={cn(
            "group relative overflow-hidden rounded-3xl",
            "transition-all duration-300",
          )}
        >
          {/* Gradient Overlay */}
          <div className="absolute inset-0 opacity-60" />

          <div className="relative flex flex-col gap-5 p-6">
            <div className="flex items-center gap-x-2 ">
              <span
                className={cn(
                  "rounded-2xl border border-white/10 p-2.5",
                  "bg-white/3",
                  card.iconBg,
                )}
              >
                <card.icon className={cn("size-4", card.accent)} />
              </span>
              <span className="text-xs font-medium tracking-wide text-muted-foreground">
                {card.label}
              </span>
            </div>

            <div className="space-y-2">
              <p className="font-mono text-3xl font-bold tracking-tight text-foreground">
                {card.formatValue(values[index] ?? 0)}
              </p>

              <p
                className={cn(
                  "text-xs font-medium",
                  card.up
                    ? "text-green-700 dark:text-green-400"
                    : "text-rose-600 dark:text-red-400",
                )}
              >
                {card.trend}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardStatsCardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4 border border-border bg-card dark:bg-card/50 rounded-2xl">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={cn("group relative overflow-hidden rounded-3xl p-6")}
        >
          {/* Icon + label row */}
          <div className="flex items-center gap-x-2 mb-5">
            <Skeleton className="size-9 rounded-2xl" />
            <Skeleton className="h-3.5 w-24" />
          </div>

          {/* Value + trend */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
