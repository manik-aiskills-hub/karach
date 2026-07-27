export type ExpenseCheckable = {
  isTransfer: boolean;
  direction: "DEBIT" | "CREDIT";
};

/**
 * A transaction only counts as real spending if it's a Debit AND not a transfer
 * between the user's own accounts — transfers net to zero, money didn't leave
 * the household, so Budgets and Reports must exclude them.
 */
export function isExpense(t: ExpenseCheckable): boolean {
  return !t.isTransfer && t.direction !== "CREDIT";
}
