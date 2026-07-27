import { prisma } from "@/lib/prisma";
import { applyBalanceDelta } from "@/features/accounts/server/accounts.service";
import type { TransactionDirection } from "@prisma/client";

export async function listTransactions(userId: string, limit = 40) {
  return prisma.transaction.findMany({
    where: { userId },
    include: { category: true, fromAccount: true, toAccount: true },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function createTransaction(
  userId: string,
  data: {
    categoryId: string;
    amount: number;
    currency: string;
    direction: TransactionDirection;
    date: string;
    notes?: string;
    fromAccountId?: string;
    toAccountId?: string;
  }
) {
  const isTransfer = Boolean(data.fromAccountId) && Boolean(data.toAccountId);

  // Keep account balances in sync, converting into each account's own currency
  if (data.fromAccountId) {
    await applyBalanceDelta(data.fromAccountId, -data.amount, data.currency);
  }
  if (data.toAccountId) {
    await applyBalanceDelta(data.toAccountId, data.amount, data.currency);
  }

  return prisma.transaction.create({
    data: {
      userId,
      categoryId: data.categoryId,
      amount: data.amount,
      currency: data.currency,
      direction: data.direction,
      date: new Date(data.date),
      notes: data.notes,
      fromAccountId: data.fromAccountId || undefined,
      toAccountId: data.toAccountId || undefined,
      isTransfer,
    },
  });
}

export async function deleteTransaction(userId: string, id: string) {
  const t = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!t) return;

  // Reverse any account balance impact before removing
  if (t.fromAccountId) await applyBalanceDelta(t.fromAccountId, t.amount, t.currency);
  if (t.toAccountId) await applyBalanceDelta(t.toAccountId, -t.amount, t.currency);

  await prisma.transaction.delete({ where: { id } });
}
