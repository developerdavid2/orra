export const TOOL_LABELS: Record<string, string> = {
  // Consolidated tools
  queryFinance: "Data lookup",
  proposeChange: "Proposed change",
  queryTransactions: "Transactions",
  getSpendingAnalysis: "Spending analysis",
  queryBudgets: "Budgets",
  getAccounts: "Accounts",
  renderSpendingChart: "Spending chart",
  getUnbudgetedSpending: "Unbudgeted spending",
  // Propose tools
  proposeBudgetCreate: "Budget proposal",
  proposeBudgetEdit: "Budget changes",
  proposeBudgetDelete: "Deletion proposal",
  proposeBudgetRebalance: "Rebalance plan",
  proposeRecategorize: "Category changes",
  proposeAccountCreate: "New account",
  proposeSpendingGoal: "Spending goal",
  proposeInsightDismiss: "Insight dismissal",
};

export const getToolLabel = (toolName: string): string =>
  TOOL_LABELS[toolName] ?? toolName;
