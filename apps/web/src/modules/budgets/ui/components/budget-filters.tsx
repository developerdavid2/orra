"use client";

import { Badge } from "@orra/ui/components/badge";
import { Button } from "@orra/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@orra/ui/components/dropdown-menu";
import { Separator } from "@orra/ui/components/separator";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@orra/ui/components/sheet";
import { Switch } from "@orra/ui/components/switch";
import { cn } from "@orra/ui/lib/utils";
import {
  ArrowUpDown,
  Check,
  Filter,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { DebouncedSearchInput } from "@/components/debounced-search-input";
import { MonthYearPicker } from "@/components/month-year-picker";
import { HEALTH_META, PERIOD_OPTIONS, SORT_CHOICES } from "../../constants";
import { useBudgetFilters } from "../../hooks/queries/use-budget-filters";

export function BudgetFilters() {
  const {
    currentSearch,
    currentSortField,
    currentSortDir,
    currentMonth,
    currentYear,
    draftStatuses,
    draftIsActive,
    draftPeriod,
    moreFiltersOpen,
    updateSearch,
    updateSort,
    updateMonthYear,
    openDrawer,
    closeDrawer,
    toggleDraftStatus,
    setDraftIsActive,
    setDraftPeriod,
    applyDrawerFilters,
    resetDrawer,
    activeFilterCount,
    hasActiveFilters,
    hasActiveSorters,
  } = useBudgetFilters();

  const now = new Date();
  const listAnchor = new Date(
    currentYear ?? now.getFullYear(),
    (currentMonth ?? now.getMonth() + 1) - 1,
    1,
  );

  return (
    <div className="flex items-center gap-2">
      <DebouncedSearchInput
        value={currentSearch}
        onSearch={updateSearch}
        placeholder="Search budgets..."
        className="w-56"
      />

      <MonthYearPicker
        value={listAnchor}
        onChange={(date) =>
          updateMonthYear(date.getMonth() + 1, date.getFullYear())
        }
        maxYear={new Date().getFullYear()}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={hasActiveSorters ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1.5"
          >
            <ArrowUpDown className="size-3.5" />
            Sort by
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 no-scrollbar scrollbar-none"
        >
          {SORT_CHOICES.map((choice) => {
            const selected =
              currentSortField === choice.field &&
              currentSortDir === choice.dir;
            return (
              <DropdownMenuItem
                key={`${choice.field}-${choice.dir}`}
                onClick={() => updateSort(choice.field, choice.dir)}
                className={cn("gap-2", selected && "bg-accent font-medium")}
              >
                <Check
                  className={cn(
                    "size-4 shrink-0",
                    selected ? "opacity-100" : "opacity-0",
                  )}
                />
                {choice.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant={hasActiveFilters ? "default" : "outline"}
        size="sm"
        className="h-8 gap-1.5 shrink-0"
        onClick={openDrawer}
      >
        <SlidersHorizontal className="size-3.5" />
        Filters
        {activeFilterCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-1 h-5 min-w-5 px-1 text-[10px]"
          >
            {activeFilterCount}
          </Badge>
        )}
      </Button>

      <Sheet
        open={moreFiltersOpen}
        onOpenChange={(open) => !open && closeDrawer()}
      >
        <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                  {activeFilterCount} active
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scrollbar-thin">
            {/* Status */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="size-3.5 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Status</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(HEALTH_META).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleDraftStatus(key)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                      draftStatuses.includes(key)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-accent",
                    )}
                  >
                    {meta.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Period */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Period</h3>
              <div className="flex flex-wrap gap-1.5">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setDraftPeriod(
                        draftPeriod === opt.value ? undefined : opt.value,
                      )
                    }
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-colors border",
                      draftPeriod === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-accent",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Active budgets only</p>
                <p className="text-xs text-muted-foreground">
                  Hide budgets outside their date range
                </p>
              </div>
              <Switch
                checked={draftIsActive === true}
                onCheckedChange={(checked) =>
                  setDraftIsActive(checked ? true : undefined)
                }
              />
            </div>
          </div>

          <SheetFooter className="flex-col gap-2 px-4 py-4 border-t border-border">
            <Button variant="outline" className="w-full" onClick={resetDrawer}>
              Clear All Filters
            </Button>
            <Button className="w-full" onClick={applyDrawerFilters}>
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
