import { prisma } from "@/lib/prisma";
import { toUSD, currencyObj } from "@/lib/currency";
import { isExpense } from "@/features/transactions/lib/isExpense";
import { getNetWorth } from "@/features/accounts/server/accounts.service";
import { getNetDebtPosition } from "@/features/loans/server/loans.service";
import { getTotalSplitNet } from "@/features/split/server/split.service";

export async function getDashboardSummary(userId: string, homeCurrency: string) {
  const homeRate = currencyObj(homeCurrency).rate;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [netWorth, debt, splitNet, monthTxs] = await Promise.all([
    getNetWorth(userId, homeCurrency),
    getNetDebtPosition(userId, homeCurrency),
    getTotalSplitNet(userId, homeCurrency),
    prisma.transaction.findMany({ where: { userId, date: { gte: start, lt: end } } }),
  ]);

  const monthSpent = monthTxs
    .filter(isExpense)
    .reduce((sum, t) => sum + toUSD(t.amount, t.currency) * homeRate, 0);

  return { netWorth, debt, splitNet, monthSpent };
}
