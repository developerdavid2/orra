"use client";

import type { BudgetCalendarDay } from "@orra/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@orra/ui/components/dialog";
import { cn } from "@orra/ui/lib/utils";
import { format, parseISO } from "date-fns";
import { HEALTH_META } from "../../constants";
import { useBudgetDrawer } from "../../hooks/store/use-budget-drawer";

interface BudgetCalendarModalProps {
  day: BudgetCalendarDay | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BudgetCalendarModal({
  day,
  open,
  onOpenChange,
}: BudgetCalendarModalProps) {
  const openDrawer = useBudgetDrawer((s) => s.onOpenView);

  if (!day) return null;

  const date = parseISO(day.date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-150 max-h-[85dvh] flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {format(date, "EEEE, MMMM d, yyyy")}
          </DialogTitle>
        </DialogHeader>

        {/* Fixed-height shell: the day's budget list scrolls inside
            (scrollbar hidden) instead of stretching the dialog. */}
        <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {day.budgets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No budgets for this day
            </p>
          ) : (
            day.budgets.map((budget) => {
              const meta = HEALTH_META[budget.status];
              return (
                <button
                  type="button"
                  key={budget.id}
                  onClick={() => {
                    openDrawer(budget.id);
                    onOpenChange(false);
                  }}
                  className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn("size-3 rounded-full", meta.dot)}
                        style={
                          budget.color
                            ? { backgroundColor: budget.color }
                            : undefined
                        }
                      />
                      <span className="font-medium text-sm">{budget.name}</span>
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        meta.badge,
                      )}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Spent:{" "}
                      <span className="font-medium text-foreground">
                        ${budget.spent.toFixed(2)}
                      </span>
                    </span>
                    <span>
                      Limit:{" "}
                      <span className="font-medium text-foreground">
                        ${parseFloat(budget.limitAmount).toFixed(2)}
                      </span>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        meta.bar,
                      )}
                      style={{
                        width: `${Math.min((budget.spent / parseFloat(budget.limitAmount)) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
