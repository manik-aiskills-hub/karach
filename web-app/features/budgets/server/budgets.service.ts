import { prisma } from "@/lib/prisma";
import { toUSD, currencyObj } from "@/lib/currency";
import { isExpense } from "@/features/transactions/lib/isExpense";

export async function listBudgetsForMonth(
  userId: string,
  month: number,
  year: number,
  homeCurrency: string
) {
  const budgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const homeRate = currencyObj(homeCurrency).rate;

  return Promise.all(
    budgets.map(async (b) => {
      const txs = await prisma.transaction.findMany({
        where: { userId, categoryId: b.categoryId, date: { gte: start, lt: end } },
      });
      const spent = txs
        .filter(isExpense)
        .reduce((sum, t) => sum + toUSD(t.amount, t.currency) * homeRate, 0);

      return {
        id: b.id,
        category: b.category,
        limit: b.amount, // already stored in home currency
        spent,
        remaining: b.amount - spent,
        percentUsed: b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0,
      };
    })
  );
}

export async function upsertBudget(
  userId: string,
  data: { categoryId: string; amount: number; month: number; year: number }
) {
  return prisma.budget.upsert({
    where: {
      userId_categoryId_month_year: {
        userId,
        categoryId: data.categoryId,
        month: data.month,
        year: data.year,
      },
    },
    update: { amount: data.amount },
    create: { ...data, userId },
  });
}
