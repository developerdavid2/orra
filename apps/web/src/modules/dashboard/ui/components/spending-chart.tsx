"use client";

import { Button } from "@orra/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@orra/ui/components/card";
import { Skeleton } from "@orra/ui/components/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@orra/ui/components/tabs";
import { PieChart } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DateRangePicker } from "@/components/date-range-picker";
import { formatAmount } from "@/lib/utils";
import { useSpendingOverview } from "@/modules/dashboard/hooks/queries/use-spending-overview";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CHART_COLORS,
  CHART_PERIODS,
  CHART_TYPES,
  PERIOD_LABELS,
} from "../../constants";
import { getPeriodDays } from "../../lib/utils";
import type { ChartType, Period } from "../../types";

interface PieDataItem {
  name: string;
  value: number;
  color: string;
  category: string;
  budget?: number;
}

interface TimeSeriesItem {
  name: string;
  spending: number;
  budget: number;
  dailyBudget: number;
}

// Tooltip Components =
function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const data = entry?.payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <div className="flex items-center gap-2 mb-1">
        <span
          className="size-2 rounded-full"
          style={{ backgroundColor: entry.payload?.color }}
        />
        <p className="font-medium text-foreground">{entry.name}</p>
      </div>
      <p className="font-mono text-muted-foreground">
        Spent:{" "}
        <span className="font-semibold text-foreground">
          {formatAmount(entry.value)}
        </span>
      </p>
      {data?.budget > 0 && (
        <p className="font-mono text-muted-foreground">
          Budget:{" "}
          <span className="font-semibold text-foreground">
            {formatAmount(data.budget)}
          </span>
        </p>
      )}
    </div>
  );
}

function SeriesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">
            {entry.name}:{" "}
            <span className="font-mono font-semibold text-foreground">
              {formatAmount(entry.value)}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomBarCursor(props: any) {
  const { x, y, width, height } = props;
  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill="var(--accent)"
      stroke="none"
      radius={0}
    />
  );
}

// Sub-Components
function ChartTypeSwitcher({
  value,
  onChange,
}: {
  value: ChartType;
  onChange: (t: ChartType) => void;
}) {
  return (
    <fieldset
      className="flex rounded-lg border border-border"
      aria-label="Chart type"
    >
      {CHART_TYPES.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant={value === type ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(type)}
          aria-label={label}
          aria-pressed={value === type}
          className="h-8 rounded-none px-2.5 first:rounded-l-md last:rounded-r-md"
        >
          <Icon className="size-3.5" />
        </Button>
      ))}
    </fieldset>
  );
}

function ChartEmpty() {
  return (
    <div className="flex h-75 flex-col items-center justify-center gap-2 text-muted-foreground">
      <PieChart className="size-8 opacity-30" />
      <p className="text-sm">No spending data for this period.</p>
    </div>
  );
}

// Chart Views
function PieChartView({
  data,
  totalSpending,
}: {
  data: PieDataItem[];
  totalSpending: number;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const totalBudget = data.reduce((sum, item) => sum + (item.budget || 0), 0);

  return (
    <>
      <div className="h-75 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="76%"
              paddingAngle={0}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-xl font-bold"
                        >
                          {formatAmount(totalSpending)}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs"
                        >
                          Total Spent
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-2.5">
        {data.map((entry) => (
          <div
            key={entry.category}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate text-xs text-muted-foreground">
                {entry.name}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="shrink-0 font-mono text-xs font-semibold tabular-nums">
                {formatAmount(entry.value)}
              </span>
              {entry.budget! > 0 && (
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  / {formatAmount(entry.budget!)}
                </span>
              )}
            </div>
          </div>
        ))}

        <div className="col-span-2 mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="text-sm font-semibold text-foreground">
            Total Spent
          </span>
          <div className="flex flex-col items-end">
            <span className="font-mono text-sm font-bold tabular-nums text-foreground">
              {formatAmount(total)}
            </span>
            {totalBudget > 0 && (
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                Budget: {formatAmount(totalBudget)}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function BarChartView({ data }: { data: TimeSeriesItem[] }) {
  return (
    <div className="h-75 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            // strokeDasharray="1 1"
            stroke="var(--muted)"
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v}`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            width={52}
          />
          <Tooltip content={<SeriesTooltip />} cursor={<CustomBarCursor />} />
          <Legend
            verticalAlign="top"
            height={24}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingBottom: "8px" }}
          />
          <Bar
            dataKey="spending"
            name="Spending"
            fill={CHART_COLORS.spending.fill}
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            opacity={0.9}
          />
          <Bar
            dataKey="budget"
            name="Budget"
            fill={CHART_COLORS.budget.fill}
            radius={[6, 6, 0, 0]}
            maxBarSize={32}
            opacity={0.5}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function AreaChartView({ data }: { data: TimeSeriesItem[] }) {
  const spendingGradientId = useId();
  const budgetGradientId = useId();

  return (
    <div className="h-75 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
        >
          <defs>
            {/* Spending gradient — blue */}
            <linearGradient id={spendingGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS.spending.gradientFrom}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS.spending.gradientTo}
                stopOpacity={0.02}
              />
            </linearGradient>
            {/* Budget gradient — violet */}
            <linearGradient id={budgetGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={CHART_COLORS.budget.gradientFrom}
                stopOpacity={0.25}
              />
              <stop
                offset="95%"
                stopColor={CHART_COLORS.budget.gradientTo}
                stopOpacity={0.02}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="var(--secondary)"
          />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            interval="preserveStartEnd"
            minTickGap={30}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v}`}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            width={52}
          />
          <Tooltip content={<SeriesTooltip />} />
          <Legend
            verticalAlign="top"
            height={24}
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "14px", paddingBottom: "8px" }}
          />

          {/* Budget area — bottom layer, lighter */}
          <Area
            type="monotone"
            dataKey="budget"
            name="Budget"
            stroke={CHART_COLORS.budget.stroke}
            strokeWidth={2}
            strokeDasharray="5 5"
            fill={`url(#${budgetGradientId})`}
            fillOpacity={0.3}
          />

          {/* Spending area — top layer, solid */}
          <Area
            type="monotone"
            dataKey="spending"
            name="Spending"
            stroke={CHART_COLORS.spending.stroke}
            strokeWidth={2.5}
            fill={`url(#${spendingGradientId})`}
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Main Component
export function SpendingChart() {
  const [period, setPeriod] = useState<Period>("30d");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const { data: overview, isLoading } = useSpendingOverview({
    period,
    from: dateRange?.from?.toISOString(),
    to: dateRange?.to?.toISOString(),
  });

  const categorySpending = overview?.categorySpending ?? [];
  const trendData = overview?.trendData ?? [];
  const totalBudget = overview?.totalBudget ?? 0;

  const periodDays = getPeriodDays(period, dateRange);
  const displayBudget = useMemo(() => {
    if (totalBudget <= 0) return 0;
    // Scale monthly budget to the selected period
    return (totalBudget / 30) * periodDays;
  }, [totalBudget, periodDays]);

  const totalSpending = useMemo(() => {
    return categorySpending.reduce((sum, item) => sum + item.total, 0);
  }, [categorySpending]);

  const pieData: PieDataItem[] = categorySpending.map((item: any) => ({
    name: CATEGORY_LABELS[item.category] ?? item.category,
    value: item.total,
    color: CATEGORY_COLORS[item.category] ?? CATEGORY_COLORS.other,
    category: item.category,
    budget: item.budget,
  }));

  const timeSeriesData: TimeSeriesItem[] =
    trendData.length > 0
      ? trendData.map((d: any) => ({
          name: d.name,
          spending: d.value,
          budget: d.budget ?? 0,
          dailyBudget: d.dailyBudget ?? 0,
        }))
      : categorySpending.map((d: any) => ({
          name: CATEGORY_LABELS[d.category] ?? d.category,
          spending: d.total,
          budget: d.budget ?? 0,
          dailyBudget: 0,
        }));

  const isEmpty = !isLoading && categorySpending.length === 0;
  const customRange = Boolean(dateRange?.from);

  const handlePeriodChange = useCallback((v: string) => {
    setPeriod(v as Period);
    setDateRange(undefined);
  }, []);

  const renderContent = () => {
    if (isEmpty) return <ChartEmpty />;

    const chartProps = {
      data: chartType === "pie" ? pieData : timeSeriesData,
    };

    if (chartType === "pie")
      return <PieChartView data={pieData} totalSpending={totalSpending} />;
    if (chartType === "bar")
      return <BarChartView data={chartProps.data as TimeSeriesItem[]} />;
    return <AreaChartView data={chartProps.data as TimeSeriesItem[]} />;
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              Spending Overview
            </CardTitle>
            <div className="mt-0.5 text-sm text-muted-foreground">
              <span>
                {customRange ? "Custom Range:" : PERIOD_LABELS[period]}
              </span>
              <span className="space-x-4">
                {displayBudget > 0 && (
                  <span className="text-xs text-main">
                    Budget: {formatAmount(displayBudget)}
                  </span>
                )}
                {totalSpending > 0 && (
                  <span className="text-xs text-amber-400">
                    Spending: {formatAmount(totalSpending)}
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={period} onValueChange={handlePeriodChange}>
              <TabsList className="h-8">
                {CHART_PERIODS.map((p) => (
                  <TabsTrigger
                    key={p.value}
                    value={p.value}
                    className="px-3 text-xs"
                    disabled={customRange}
                  >
                    {p.short}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <ChartTypeSwitcher value={chartType} onChange={setChartType} />
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder="Range"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-6 pt-0 sm:px-6">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

export function SpendingChartSkeleton() {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-56" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 pb-6 pt-0 sm:px-6 space-y-4">
        <Skeleton className="h-75 w-full" />
        <div className="grid grid-cols-2 gap-x-8 gap-y-2.5 px-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Skeleton className="size-2.5 rounded-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border pt-3 px-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}
