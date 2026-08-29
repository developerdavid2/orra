import { DashboardHeader } from "@/components/dashboard-header";
import { SectionBoundary } from "@/components/section-boundary";

import { ChartInsightsRow } from "../components/chart-insights-row";
import {
  RecentInsights,
  RecentInsightsSkeleton,
} from "../components/recent-insights";
import {
  RecentTransactions,
  RecentTransactionsSkeleton,
} from "../components/recent-transactions";
import {
  SpendingChart,
  SpendingChartSkeleton,
} from "../components/spending-chart";
import {
  DashboardStatsCard,
  DashboardStatsCardSkeleton,
} from "../components/dashboard-stats-card";
import {
  TopCategoriesCard,
  TopCategoriesSkeleton,
} from "../components/top-monthly-categories";

export function DashboardView() {
  return (
    <div className="flex flex-col gap-6 p-10 bg-accent">
      <DashboardHeader
        title="Dashboard"
        description="Welcome back. Here's your financial overview."
      />

      <div className="bg-background border-muted shadow rounded-2xl p-5 space-y-4">
        <SectionBoundary
          fallback={<DashboardStatsCardSkeleton />}
          errorMessage="Could not load overview stats"
        >
          <DashboardStatsCard />
        </SectionBoundary>

        <ChartInsightsRow
          chart={
            <SectionBoundary
              fallback={<SpendingChartSkeleton />}
              errorMessage="Could not load spending chart"
            >
              <SpendingChart />
            </SectionBoundary>
          }
          insights={
            <SectionBoundary
              fallback={<RecentInsightsSkeleton />}
              errorMessage="Could not load recent insights"
            >
              <RecentInsights />
            </SectionBoundary>
          }
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
          <SectionBoundary
            fallback={<RecentTransactionsSkeleton />}
            errorMessage="Could not load recent transactions"
          >
            <RecentTransactions />
          </SectionBoundary>

          <SectionBoundary
            fallback={<TopCategoriesSkeleton />}
            errorMessage="Could not load top categories"
          >
            <TopCategoriesCard />
          </SectionBoundary>
        </div>
      </div>
    </div>
  );
}
