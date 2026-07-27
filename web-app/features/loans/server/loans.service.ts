import { prisma } from "@/lib/prisma";
import { toUSD, currencyObj } from "@/lib/currency";
import type { LoanDirection } from "@prisma/client";

export async function listLoans(userId: string) {
  const loans = await prisma.loan.findMany({
    where: { userId, active: true },
    include: { payments: true },
    orderBy: { startDate: "desc" },
  });

  return loans.map((loan) => {
    const paid = loan.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = Math.max(0, loan.principal - paid);
    return {
      id: loan.id,
      direction: loan.direction,
      counterparty: loan.counterparty,
      currency: loan.currency,
      principal: loan.principal,
      interestRate: loan.interestRate,
      minPayment: loan.minPayment,
      startDate: loan.startDate,
      paid,
      balance,
      percentPaid: loan.principal > 0 ? Math.min(100, Math.round((paid / loan.principal) * 100)) : 0,
    };
  });
}

export async function createLoan(
  userId: string,
  data: {
    direction: LoanDirection;
    counterparty: string;
    currency: string;
    principal: number;
    interestRate?: number;
    minPayment?: number;
    startDate: string;
  }
) {
  return prisma.loan.create({
    data: {
      ...data,
      interestRate: data.interestRate ?? 0,
      startDate: new Date(data.startDate),
      userId,
    },
  });
}

export async function recordPayment(
  userId: string,
  loanId: string,
  data: { amount: number; date?: string; note?: string }
) {
  // Ensure the loan belongs to this user before writing a payment against it
  const loan = await prisma.loan.findFirst({ where: { id: loanId, userId } });
  if (!loan) throw new Error("Loan not found");

  return prisma.loanPayment.create({
    data: {
      loanId,
      amount: data.amount,
      date: data.date ? new Date(data.date) : new Date(),
      note: data.note,
    },
  });
}

/** Net debt position converted to home currency: what you owe (TAKEN) minus what's owed to you (GIVEN). */
export async function getNetDebtPosition(userId: string, homeCurrency: string) {
  const loans = await listLoans(userId);
  const homeRate = currencyObj(homeCurrency).rate;
  const toHome = (amount: number, code: string) => toUSD(amount, code) * homeRate;

  const owedByMe = loans
    .filter((l) => l.direction === "TAKEN")
    .reduce((sum, l) => sum + toHome(l.balance, l.currency), 0);
  const owedToMe = loans
    .filter((l) => l.direction === "GIVEN")
    .reduce((sum, l) => sum + toHome(l.balance, l.currency), 0);
  return { owedByMe, owedToMe, net: owedToMe - owedByMe };
}
