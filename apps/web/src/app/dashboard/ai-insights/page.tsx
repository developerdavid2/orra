import { INSIGHTS_LIMIT } from "@/modules/dashboard/constants";
import {
  validateInsightReadStatus,
  validateInsightSeverity,
  validateInsightType,
} from "@/modules/insights/lib/validate-insights-enums";
import { AIInsightsView } from "@/modules/insights/ui/views/ai-insights-view";

import { HydrateClient, prefetch, trpc } from "@/trpc/trpc-server";
import { Suspense } from "react";

import { LoadingSkeleton } from "./loading-skeleton";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    severity?: string;
    dismissed?: string;
    readStatus?: string;
    focus?: string;
  }>;
}

const Page = ({ searchParams }: PageProps) => (
  <Suspense fallback={<LoadingSkeleton />}>
    <AsyncPage searchParams={searchParams} />
  </Suspense>
);

export default Page;

async function AsyncPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const validatedSeverity = validateInsightSeverity(params.severity);
  const validatedType = validateInsightType(params.type);
  const validatedReadStatus = validateInsightReadStatus(params.readStatus);

  const listFilters = {
    includeDismissed: params.dismissed === "true",
    limit: INSIGHTS_LIMIT,
    severity: validatedSeverity,
    type: validatedType,
    readStatus: validatedReadStatus,
    search: params.search ?? "",
  };

  // Only prefetch the main insights list
  // Optional focus insight loads client-side via useSuspenseQuery
  await Promise.all([
    prefetch(
      trpc.ai.insights.list.infiniteQueryOptions(listFilters, {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }),
    ),
  ]);

  return (
    <HydrateClient>
      <AIInsightsView
        search={params.search ?? ""}
        type={validatedType ?? "all"}
        severity={validatedSeverity ?? "all"}
        dismissed={params.dismissed === "true"}
        readStatus={validatedReadStatus ?? "all"}
        focusInsightId={params.focus}
      />
    </HydrateClient>
  );
}
