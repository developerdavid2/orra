import { TRANSACTIONS_LIMIT } from "@/modules/dashboard/constants";
import {
  validateTransactionCategories,
  validateTransactionStatuses,
  validateTransactionTypes,
} from "@/modules/transactions/lib/validate-transaction-enums";
import { TransactionsView } from "@/modules/transactions/ui/views/transactions-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/trpc-server";
import { Suspense } from "react";

import { LoadingSkeleton } from "./loading-skeleton";

interface PageProps {
  searchParams: Promise<{
    search?: string;
    types?: string | string[];
    statuses?: string | string[];
    accountType?: string;
    accountId?: string;
    dateFrom?: string;
    dateTo?: string;
    categories?: string | string[];
    isManual?: string;
    isAnomaly?: string;
    amountMin?: string;
    amountMax?: string;
    focusTransactionId?: string;
    mode?: string;
    limit?: string;
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

  const parseOptionalNumber = (value?: string) => {
    if (!value) return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  };
  const parsedLimit = Number(params.limit ?? TRANSACTIONS_LIMIT);

  const limit = Math.min(
    Math.max(
      Number.isFinite(parsedLimit) ? parsedLimit : TRANSACTIONS_LIMIT,
      1,
    ),
    50,
  );

  const validatedType = validateTransactionTypes(params.types);
  const validatedStatuses = validateTransactionStatuses(params.statuses);
  const validatedCategories = validateTransactionCategories(params.categories);

  const transactionFilters = {
    search: params.search?.trim() || undefined,
    type: validatedType,
    status: validatedStatuses,
    bankAccountId: params.accountId || undefined,
    category: validatedCategories,
    isManual: params.isManual === "true" ? true : undefined,
    isAnomaly: params.isAnomaly === "true" ? true : undefined,
    dateFrom: params.dateFrom || undefined,
    dateTo: params.dateTo || undefined,
    minAmount: parseOptionalNumber(params.amountMin),
    maxAmount: parseOptionalNumber(params.amountMax),
  };
  const listFilters = {
    ...transactionFilters,
    limit,
  };

  // Only prefetch critical above-the-fold data: transaction list + accounts for filters
  // monthlySummaries and optional focus transaction load client-side via useSuspenseQuery
  await Promise.all([
    prefetch(
      trpc.payments.transactions.list.infiniteQueryOptions(listFilters, {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }),
    ),
    prefetch(trpc.payments.accounts.listAll.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <TransactionsView
        search={params.search ?? ""}
        types={validatedType ?? []}
        statuses={validatedStatuses ?? []}
        categories={validatedCategories ?? []}
        accountType={params.accountType ?? "all"}
        accountId={params.accountId ?? ""}
        dateFrom={params.dateFrom ?? ""}
        dateTo={params.dateTo ?? ""}
        isManual={params.isManual === "true"}
        isAnomaly={params.isAnomaly === "true"}
        amountMin={params.amountMin ?? ""}
        amountMax={params.amountMax ?? ""}
        focusTransactionId={params.focusTransactionId}
        focusMode={params.mode}
        limit={limit}
      />
    </HydrateClient>
  );
}
