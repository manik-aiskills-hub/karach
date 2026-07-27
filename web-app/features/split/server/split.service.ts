import { prisma } from "@/lib/prisma";
import { toUSD, currencyObj } from "@/lib/currency";
import type { SplitGroupType } from "@prisma/client";

export async function listGroups(userId: string) {
  return prisma.splitGroup.findMany({
    where: { ownerId: userId },
    include: { members: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGroup(userId: string, groupId: string) {
  return prisma.splitGroup.findFirst({
    where: { id: groupId, ownerId: userId },
    include: { members: true, expenses: { orderBy: { date: "desc" } } },
  });
}

/**
 * Creates a new split circle. Both GROUP and DIRECT start as "you + 1" — the
 * type only controls whether more people can be added later.
 */
export async function createGroup(
  userId: string,
  data: { name: string; type: SplitGroupType; friendName: string }
) {
  return prisma.splitGroup.create({
    data: {
      name: data.name,
      type: data.type,
      ownerId: userId,
      members: {
        create: [{ name: "You", userId }, { name: data.friendName }],
      },
    },
    include: { members: true },
  });
}

export async function addMember(userId: string, groupId: string, name: string) {
  const group = await prisma.splitGroup.findFirst({ where: { id: groupId, ownerId: userId } });
  if (!group) throw new Error("Group not found");
  if (group.type !== "GROUP") throw new Error("Direct splits are fixed at two people");
  return prisma.splitGroupMember.create({ data: { groupId, name } });
}

export async function addExpense(
  userId: string,
  groupId: string,
  data: { description: string; amount: number; currency: string; paidById: string }
) {
  const group = await prisma.splitGroup.findFirst({
    where: { id: groupId, ownerId: userId },
    include: { members: true },
  });
  if (!group) throw new Error("Group not found");

  const share = data.amount / group.members.length;
  return prisma.splitExpense.create({
    data: {
      groupId,
      description: data.description,
      amount: data.amount,
      currency: data.currency,
      paidById: data.paidById,
      shares: {
        create: group.members.map((m) => ({ memberId: m.id, amountOwed: share })),
      },
    },
  });
}

/** Balances converted to home currency so expenses in different currencies stay comparable. */
export async function getGroupBalances(groupId: string, homeCurrency: string) {
  const group = await prisma.splitGroup.findUnique({
    where: { id: groupId },
    include: { members: true, expenses: true },
  });
  if (!group) return {};

  const homeRate = currencyObj(homeCurrency).rate;
  const balances: Record<string, number> = {};
  group.members.forEach((m) => (balances[m.id] = 0));

  group.expenses.forEach((e) => {
    const homeAmt = toUSD(e.amount, e.currency) * homeRate;
    const share = homeAmt / group.members.length;
    group.members.forEach((m) => {
      balances[m.id] += (m.id === e.paidById ? homeAmt : 0) - share;
    });
  });

  return balances;
}

/** Sum of the current user's net position ("me") across every group, in home currency. */
export async function getTotalSplitNet(userId: string, homeCurrency: string) {
  const groups = await listGroups(userId);
  let total = 0;
  for (const g of groups) {
    const me = g.members.find((m) => m.userId === userId);
    if (!me) continue;
    const balances = await getGroupBalances(g.id, homeCurrency);
    total += balances[me.id] ?? 0;
  }
  return total;
}
