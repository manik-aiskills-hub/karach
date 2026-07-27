export type DebtInput = {
  id: string;
  name: string;
  balance: number;
  interestRate: number; // annual %
  minPayment: number;
};

export type PayoffPlanEntry = {
  id: string;
  name: string;
  order: number;
  payoffMonth: number; // months from now until this debt hits 0
  totalInterestPaid: number;
};

export type PayoffPlan = {
  strategy: "avalanche" | "snowball";
  entries: PayoffPlanEntry[];
  totalMonths: number;
  totalInterestPaid: number;
};

/**
 * Simulates month-by-month payoff of a set of debts given a fixed total monthly
 * budget (sum of all minimums + any extra you can throw at debt).
 *
 * - avalanche: prioritizes the highest interest rate first (mathematically optimal, saves the most money)
 * - snowball: prioritizes the smallest balance first (psychologically motivating, faster "wins")
 *
 * Extra payment beyond minimums is always funneled to the current #1 priority debt;
 * once a debt is paid off, its minimum payment rolls into the extra pool for the next one.
 */
export function calculatePayoffPlan(
  debts: DebtInput[],
  extraMonthlyPayment: number,
  strategy: "avalanche" | "snowball"
): PayoffPlan {
  if (debts.length === 0) {
    return { strategy, entries: [], totalMonths: 0, totalInterestPaid: 0 };
  }

  const sorted = [...debts].sort((a, b) =>
    strategy === "avalanche" ? b.interestRate - a.interestRate : a.balance - b.balance
  );

  const balances = new Map(sorted.map((d) => [d.id, d.balance]));
  const interestPaid = new Map(sorted.map((d) => [d.id, 0]));
  const payoffMonth = new Map<string, number>();

  let month = 0;
  let extraPool = extraMonthlyPayment;
  const maxMonths = 1200; // 100 year safety cap against pathological inputs

  while ([...balances.values()].some((b) => b > 0.005) && month < maxMonths) {
    month += 1;
    let freedThisMonth = 0;

    for (const debt of sorted) {
      let bal = balances.get(debt.id)!;
      if (bal <= 0.005) continue;

      // accrue monthly interest
      const monthlyRate = debt.interestRate / 100 / 12;
      const interest = bal * monthlyRate;
      interestPaid.set(debt.id, interestPaid.get(debt.id)! + interest);
      bal += interest;

      // pay minimum, plus the extra pool if this is the current top-priority unpaid debt
      const isTopPriority = sorted.find((d) => balances.get(d.id)! > 0.005)?.id === debt.id;
      const payment = debt.minPayment + (isTopPriority ? extraPool : 0);

      bal = Math.max(0, bal - payment);
      balances.set(debt.id, bal);

      if (bal <= 0.005 && !payoffMonth.has(debt.id)) {
        payoffMonth.set(debt.id, month);
        freedThisMonth += debt.minPayment; // its minimum now joins the extra pool
      }
    }
    extraPool += freedThisMonth;
  }

  const entries: PayoffPlanEntry[] = sorted.map((d, i) => ({
    id: d.id,
    name: d.name,
    order: i + 1,
    payoffMonth: payoffMonth.get(d.id) ?? month,
    totalInterestPaid: Math.round(interestPaid.get(d.id)! * 100) / 100,
  }));

  return {
    strategy,
    entries,
    totalMonths: Math.max(...entries.map((e) => e.payoffMonth)),
    totalInterestPaid: Math.round([...interestPaid.values()].reduce((a, b) => a + b, 0) * 100) / 100,
  };
}
