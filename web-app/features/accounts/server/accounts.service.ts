import { prisma } from "@/lib/prisma";
import { toUSD, currencyObj } from "@/lib/currency";
import type { AccountType } from "@prisma/client";

const LIABILITY_TYPES: AccountType[] = ["CREDIT"];

export async function listAccounts(userId: string) {
  return prisma.account.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createAccount(
  userId: string,
  data: {
    name: string;
    institution?: string;
    type: AccountType;
    currency: string;
    balance: number;
    location?: string;
    number?: string;
    ifsc?: string;
    logPass?: string;
    tranPass?: string;
  }
) {
  return prisma.account.create({ data: { ...data, userId } });
}

export async function deleteAccount(userId: string, accountId: string) {
  return prisma.account.deleteMany({ where: { id: accountId, userId } });
}

/** Net worth converts every account's own-currency balance into the user's home currency. */
export async function getNetWorth(userId: string, homeCurrency: string) {
  const accounts = await listAccounts(userId);
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    const homeAmt = toUSD(a.balance, a.currency) * currencyObj(homeCurrency).rate;
    if (LIABILITY_TYPES.includes(a.type)) liabilities += homeAmt;
    else assets += homeAmt;
  }
  return { assets, liabilities, net: assets - liabilities };
}

/** Adjust an account's balance by an amount expressed in a (possibly different) currency. */
export async function applyBalanceDelta(accountId: string, amount: number, amountCurrency: string) {
  const account = await prisma.account.findUnique({ where: { id: accountId } });
  if (!account) return;
  const delta = toUSD(amount, amountCurrency) * currencyObj(account.currency).rate;
  await prisma.account.update({
    where: { id: accountId },
    data: { balance: account.balance + delta },
  });
}
