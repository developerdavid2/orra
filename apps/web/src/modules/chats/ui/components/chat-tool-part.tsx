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
  queryTransactions: (result) => <TransactionList data={unwrapArray(result)} />,
  queryBudgets: (result) => <BudgetHealthGrid data={unwrapArray(result)} />,
  getAccounts: (result) => <AccountBalanceList data={unwrapArray(result)} />,
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
};

// Propose tools — need sendMessage wired through for confirm/decline.
const PROPOSAL_RENDERERS: Record<
  string,
  (result: any, sendMessage: (text: string) => void) => React.ReactNode
> = {
  proposeBudgetCreate: (result, sendMessage) => (
    <BudgetProposalCard {...result} sendMessage={sendMessage} />
  ),
  proposeAccountCreate: (result, sendMessage) => (
    <AccountCreateProposalCard {...result} sendMessage={sendMessage} />
  ),
  proposeBudgetEdit: (result, sendMessage) => (
    <BudgetEditProposalCard {...result} sendMessage={sendMessage} />
  ),
  proposeBudgetDelete: (result, sendMessage) => (
    <BudgetDeleteProposalCard {...result} sendMessage={sendMessage} />
  ),
  proposeBudgetRebalance: (result, sendMessage) => (
    <BudgetRebalanceProposalCard {...result} sendMessage={sendMessage} />
  ),
  proposeSpendingGoal: (result, sendMessage) => (
    <SpendingGoalProposalCard {...result} sendMessage={sendMessage} />
  ),
  proposeRecategorize: (result, sendMessage) => (
    <RecategorizeProposalCard {...result} sendMessage={sendMessage} />
  ),
  proposeInsightDismiss: (result, sendMessage) => (
    <InsightDismissProposalCard {...result} sendMessage={sendMessage} />
  ),
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
