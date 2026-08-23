"use client";

import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
  type ToolState,
} from "@orra/ui/components/ai-elements/tool";
import {
  BarChart3Icon,
  LandmarkIcon,
  PiggyBankIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react";
import { formatAmount } from "@/lib/utils";
import {
  AccountBalanceList,
  AccountCreateProposalCard,
  BudgetDeleteProposalCard,
  BudgetEditProposalCard,
  BudgetHealthGrid,
  BudgetProposalCard,
  BudgetRebalanceProposalCard,
  ChatSpendingChart,
  ComparisonCard,
  getToolLabel,
  InsightDismissProposalCard,
  RecategorizeProposalCard,
  SpendingGoalProposalCard,
  TransactionList,
} from "./chat-renderer";

export interface ToolPart {
  type?: "tool";
  toolName: string;
  state: ToolState;
  input?: unknown;
  output?: unknown;
  errorText?: string;
  approval?: { id: string; approved?: boolean } | null;
}

// Unwrap common envelope keys so renderers keep working across tool refactors.
const unwrapArray = (result: any): any => {
  if (Array.isArray(result)) {
    return result;
  }
  if (result && typeof result === "object") {
    const record = result as Record<string, unknown>;
    for (const key of [
      "transactions",
      "items",
      "budgets",
      "accounts",
      "data",
    ]) {
      if (Array.isArray(record[key])) {
        return record[key];
      }
    }
  }
  return result;
};

// Query/render tools — pure data-in, JSX-out, no chat interaction needed.
const QUERY_RENDERERS: Record<string, (result: any) => React.ReactNode> = {
  renderSpendingChart: (result) => <ChatSpendingChart {...result} />,
  getSpendingAnalysis: (result) => {
    if (!result || typeof result !== "object") return null;
    const r = result as {
      totalSpent?: number;
      previousPeriod?: {
        totalSpent?: number;
        percentChange?: number | null;
      } | null;
      byCategory?: {
        category: string | null;
        totalSpent: number;
        count?: number;
        percentage?: number;
      }[];
    };
    return (
      <div className="space-y-2">
        <ComparisonCard
          current={r.totalSpent ?? 0}
          previous={r.previousPeriod?.totalSpent ?? 0}
          percentChange={r.previousPeriod?.percentChange ?? null}
        />
        {Array.isArray(r.byCategory) && r.byCategory.length > 0 && (
          <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
            {r.byCategory.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">
                  {c.category ?? "Uncategorized"}
                </span>
                <span className="font-medium">
                  {formatAmount(c.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
  // Consolidated query tool — dispatch on the resource the executor echoed.
  queryFinance: (result) => {
    if (!result || typeof result !== "object") return null;
    const r = result as Record<string, any>;

    if (r.resource === "transactions") {
      return <TransactionList data={unwrapArray(r.transactions)} />;
    }
    if (r.resource === "budgets") {
      return <BudgetHealthGrid data={r.budgets ?? []} />;
    }
    if (r.resource === "accounts") {
      return <AccountBalanceList data={r.accounts ?? []} />;
    }
    if (r.resource === "unbudgeted_spending") {
      const categories: { category: string; totalSpent: number }[] =
        r.categories ?? [];
      if (categories.length === 0) {
        return null;
      }
      return (
        <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          <p className="bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
            Unbudgeted spending — {String(r.month ?? "")}
          </p>
          {categories.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground capitalize">
                {(c.category ?? "other").replace(/_/g, " ")}
              </span>
              <span className="font-medium">{formatAmount(c.totalSpent)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  },
};

// Propose tools — need sendMessage wired through for confirm/decline.
const PROPOSAL_RENDERERS: Record<
  string,
  (result: any, sendMessage: (text: string) => void) => React.ReactNode
> = {
  // Consolidated proposal tool — dispatch on the draft kind.
  proposeChange: (result, sendMessage) => {
    if (!result || typeof result !== "object") return null;
    const r = result as Record<string, any>;
    switch (r.kind) {
      case "budget_create":
        return (
          <BudgetProposalCard
            proposalId={r.proposalId}
            draft={r.draft}
            reasoning={r.reasoning}
            sendMessage={sendMessage}
          />
        );
      case "account_create":
        return (
          <AccountCreateProposalCard
            draft={r.draft}
            reasoning={r.reasoning}
            sendMessage={sendMessage}
          />
        );
      case "budget_edit":
        return (
          <BudgetEditProposalCard
            budgetId={r.budgetId}
            current={r.current}
            proposed={r.proposed}
            reasoning={r.reasoning}
            sendMessage={sendMessage}
          />
        );
      case "budget_delete":
        return (
          <BudgetDeleteProposalCard
            budgetId={r.budgetId}
            budgetName={r.budgetName}
            reasoning={r.reasoning}
            sendMessage={sendMessage}
          />
        );
      case "budget_rebalance":
        return (
          <BudgetRebalanceProposalCard
            steps={r.steps}
            overallReasoning={r.overallReasoning}
            sendMessage={sendMessage}
          />
        );
      case "spending_goal":
        return (
          <SpendingGoalProposalCard
            draft={r.draft}
            reasoning={r.reasoning}
            sendMessage={sendMessage}
          />
        );
      case "recategorize":
        return (
          <RecategorizeProposalCard
            targetCategory={r.targetCategory}
            changes={r.changes}
            reasoning={r.reasoning}
            sendMessage={sendMessage}
          />
        );
      case "insight_dismiss":
        return (
          <InsightDismissProposalCard
            insightId={r.insightId}
            insightTitle={r.insightTitle}
            reasoning={r.reasoning}
            sendMessage={sendMessage}
          />
        );
      default:
        return null;
    }
  },
};

const getToolIcon = (toolName: string): React.ReactNode => {
  if (toolName.startsWith("propose")) {
    return <SparklesIcon className="size-4" />;
  }
  if (toolName.includes("Account")) {
    return <LandmarkIcon className="size-4" />;
  }
  if (toolName.includes("Budget")) {
    return <PiggyBankIcon className="size-4" />;
  }
  if (
    toolName.includes("Chart") ||
    toolName.includes("Spending") ||
    toolName.includes("Category") ||
    toolName.includes("compare") ||
    toolName.includes("Period")
  ) {
    return <BarChart3Icon className="size-4" />;
  }
  return <SearchIcon className="size-4" />;
};

export function ChatToolPart({
  part,
  sendMessage,
}: {
  part: ToolPart;
  sendMessage?: (text: string) => void;
}) {
  const proposalRenderer = PROPOSAL_RENDERERS[part.toolName];
  const renderer = QUERY_RENDERERS[part.toolName];

  let output: React.ReactNode;

  if (part.state === "output-error") {
    output = undefined;
  } else if (part.state !== "output-available") {
    // Tool hasn't produced output yet — never call a renderer with
    // part.output undefined/partial. isSettled below controls whether
    // this even paints, but the renderer must not run at all yet.
    output = undefined;
  } else if (proposalRenderer) {
    if (!sendMessage) {
      console.warn(
        `[ChatToolPart] Proposal tool "${part.toolName}" needs sendMessage`,
      );
      output = undefined;
    } else {
      output = proposalRenderer(part.output, sendMessage);
    }
  } else if (renderer) {
    output = renderer(part.output);
  } else if (part.output !== undefined) {
    output = (
      <pre className="overflow-x-auto rounded-lg bg-muted p-2 font-mono text-xs text-muted-foreground">
        {JSON.stringify(part.output, null, 2)}
      </pre>
    );
  }

  const isSettled =
    part.state === "output-available" ||
    part.state === "output-error" ||
    part.state === "output-denied" ||
    part.state === "approval-responded";

  return (
    <Tool className="w-full" state={part.state}>
      <ToolHeader
        icon={getToolIcon(part.toolName)}
        state={part.state}
        title={getToolLabel(part.toolName)}
        toolName={part.toolName}
      />
      {isSettled && (
        <ToolContent>
          {/* <ToolInput input={part.input} /> */}
          <ToolOutput errorText={part.errorText} output={output} />
        </ToolContent>
      )}
    </Tool>
  );
}
