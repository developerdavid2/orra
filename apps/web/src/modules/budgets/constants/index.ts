import type { BudgetHealth, BudgetPeriod } from "@orra/types";
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const BUDGET_VIEW_MODES = ["calendar", "list"] as const;
export type BudgetViewMode = (typeof BUDGET_VIEW_MODES)[number];

// ── Health Config ─
export const HEALTH_META: Record<
  BudgetHealth,
  {
    label: string;
    badge: string;
    bar: string;
    text: string;
    dot: string;
  }
> = {
  on_track: {
    label: "On track",
    badge:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    bar: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  warning: {
    label: "Nearing limit",
    badge:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    bar: "bg-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  over: {
    label: "Over budget",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    bar: "bg-red-400",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

// ── Period Helpers

export function rangeForPeriod(
  period: BudgetPeriod,
  anchor: Date,
): { startDate: string; endDate: string } {
  if (period === "weekly") {
    return {
      startDate: startOfWeek(anchor, { weekStartsOn: 1 }).toISOString(),
      endDate: endOfWeek(anchor, { weekStartsOn: 1 }).toISOString(),
    };
  }
  if (period === "monthly") {
    return {
      startDate: startOfMonth(anchor).toISOString(),
      endDate: endOfMonth(anchor).toISOString(),
    };
  }
  return {
    startDate: startOfMonth(anchor).toISOString(),
    endDate: endOfMonth(anchor).toISOString(),
  };
}

export function nextPeriodAnchor(
  period: BudgetPeriod,
  anchor: Date,
  dir: 1 | -1,
): Date {
  return period === "weekly" ? addWeeks(anchor, dir) : addMonths(anchor, dir);
}

export const PERIOD_OPTIONS: { value: BudgetPeriod; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "custom", label: "Custom" },
];

export type SortChoice = {
  field: "date" | "spent" | "limitAmount" | "name";
  dir: "asc" | "desc";
  label: string;
};

export const SORT_CHOICES: SortChoice[] = [
  { field: "date", dir: "desc", label: "Start date (Newest)" },
  { field: "date", dir: "asc", label: "Start date (Oldest)" },
  { field: "name", dir: "asc", label: "Name (A-Z)" },
  { field: "name", dir: "desc", label: "Name (Z-A)" },
  { field: "spent", dir: "desc", label: "Amount Spent (Highest first)" },
  { field: "spent", dir: "asc", label: "Amount Spent (Lowest first)" },
  {
    field: "limitAmount",
    dir: "desc",
    label: "Budget Limit (Highest first)",
  },
  {
    field: "limitAmount",
    dir: "asc",
    label: "Budget Limit (Lowest first)",
  },
];
