import { ACCOUNTS_LIMIT } from "@/modules/accounts/constants";
import {
  validateAccountStatuses,
  validateAccountTypes,
} from "@/modules/accounts/lib/validate-accounts-enums";
import { AccountsView } from "@/modules/accounts/ui/views/accounts-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/trpc-server";
import { Suspense } from "react";

import { LoadingSkeleton } from "./loading-skeleton";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    types?: string | string[];
    tags?: string[];
    statuses?: string | string[];
    isManual?: string;
    limit?: string;
    page?: string;
    focusAccountId?: string;
    mode?: string;
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
  const parsePositiveInt = (value: string | undefined, fallback: number) => {
    const n = Number.parseInt(value ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const page = parsePositiveInt(params.page, 1);
  const limit = Math.min(parsePositiveInt(params.limit, ACCOUNTS_LIMIT), 50);

  const validatedTypes = validateAccountTypes(params.types);
  const validatedStatuses = validateAccountStatuses(params.statuses);

  const listFilters = {
    limit,
    page,
    search: params.search?.trim() || undefined,
    type: validatedTypes,
    status: validatedStatuses,
    isManual: params.isManual === "true" ? true : undefined,
  };

  await Promise.all([
    prefetch(trpc.payments.accounts.aggregateByType.queryOptions()),
    prefetch(trpc.payments.accounts.list.queryOptions(listFilters)),
  ]);

  return (
    <HydrateClient>
      <AccountsView
        search={params.search ?? ""}
        types={validatedTypes ?? []}
        statuses={validatedStatuses ?? []}
        tags={params.tags ?? []}
        isManual={params.isManual === "true"}
        focusAccountId={params.focusAccountId}
        focusMode={params.mode}
        limit={limit}
        currentPage={page}
      />
    </HydrateClient>
  );
}
