"use client";

import type { BudgetCalendarDay } from "@orra/types";
import { Button } from "@orra/ui/components/button";
import { Skeleton } from "@orra/ui/components/skeleton";
import { cn } from "@orra/ui/lib/utils";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MonthYearPicker } from "@/components/month-year-picker";
import { HEALTH_META } from "../../constants";
import { useBudgetCalendar } from "../../hooks/queries/use-budget-calendar";
import { useBudgetDrawer } from "../../hooks/store/use-budget-drawer";
import { useBudgetUrlSync } from "../../hooks/use-budget-url-sync";
import { BudgetCalendarModal } from "./budget-calendar-modal";

interface BudgetCalendarProps {
  month: number;
  year: number;
}

export function BudgetCalendar({ month, year }: BudgetCalendarProps) {
  const router = useRouter();
  const { calendarData } = useBudgetCalendar({ month, year });
  const [modalDay, setModalDay] = useState<BudgetCalendarDay | null>(null);
  const { onOpenView } = useBudgetDrawer();
  const { setUrl } = useBudgetUrlSync();

  const anchor = new Date(year, month - 1);
  const now = new Date();

  const monthStart = startOfMonth(anchor);
  const monthEnd = endOfMonth(anchor);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const isCurrentMonth =
    month === now.getMonth() + 1 && year === now.getFullYear();

  const navigate = (newMonth: number, newYear: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("calMonth", String(newMonth));
    params.set("calYear", String(newYear));
    router.push(`?${params.toString()}`);
  };

  const dayMap = new Map<string, BudgetCalendarDay>();
  if (calendarData) {
    for (const day of calendarData) {
      dayMap.set(day.date, day);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => navigate(prevMonth, prevYear)}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <MonthYearPicker
            value={anchor}
            onChange={(date) => {
              navigate(date.getMonth() + 1, date.getFullYear());
            }}
            maxYear={now.getFullYear()}
          />

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={isCurrentMonth}
            onClick={() => navigate(nextMonth, nextYear)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <span className="text-xl font-medium text-muted-foreground">
          {format(anchor, "MMMM yyyy")}
        </span>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px border-b border-border bg-border">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div
            key={day}
            className="bg-card p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 min-h-0 grid-cols-7 gap-px overflow-y-auto no-scrollbar bg-border">
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayData = dayMap.get(dateKey);
          const isCurrentMonthDay = isSameMonth(day, anchor);
          const isTodayDay = isToday(day);

          return (
            <div
              key={dateKey}
              className={cn(
                "relative flex flex-col gap-1 bg-card p-2 min-h-25",
                !isCurrentMonthDay && "bg-muted/30",
                isTodayDay && "ring-1 ring-inset ring-primary",
              )}
            >
              {dayData && (
                <button
                  type="button"
                  onClick={() => setModalDay(dayData)}
                  aria-label={`View budgets for ${format(day, "MMMM d, yyyy")}`}
                  className="absolute inset-0 z-0 cursor-pointer"
                />
              )}

              <span
                className={cn(
                  "pointer-events-none relative z-10 text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                  isTodayDay
                    ? "bg-primary text-primary-foreground"
                    : !isCurrentMonthDay
                      ? "text-muted-foreground/50"
                      : "text-foreground",
                )}
              >
                {format(day, "d")}
              </span>

              {/* Budget pills */}
              <div className="relative z-10 flex flex-col gap-1 overflow-hidden">
                {dayData?.budgets.slice(0, 3).map((budget) => {
                  const meta = HEALTH_META[budget.status];
                  return (
                    <button
                      type="button"
                      key={budget.id}
                      className={cn(
                        "text-left text-[10px] truncate rounded px-1.5 py-0.5 font-medium",
                        meta.badge,
                      )}
                      style={
                        budget.color
                          ? {
                              backgroundColor: `${budget.color}20`,
                              color: budget.color,
                            }
                          : undefined
                      }
                      onClick={() => {
                        onOpenView(budget.id);
                        setUrl("view", budget.id);
                      }}
                    >
                      {budget.name}
                    </button>
                  );
                })}
                {dayData && dayData.budgets.length > 3 && (
                  <button
                    type="button"
                    className="text-left text-[10px] text-muted-foreground px-1.5 hover:text-foreground transition-colors"
                    onClick={() => setModalDay(dayData)}
                  >
                    +{dayData.budgets.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BudgetCalendarModal
        day={modalDay}
        open={!!modalDay}
        onOpenChange={(open) => {
          if (!open) setModalDay(null);
        }}
      />
    </div>
  );
}

export function BudgetCalendarSkeleton() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4">
        <Skeleton className="h-8 w-48 animate-pulse" />
        <Skeleton className="h-8 w-48 animate-pulse" />
      </div>
      <div className="grid grid-cols-7 gap-px bg-border">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 bg-card animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border flex-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-25 bg-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
