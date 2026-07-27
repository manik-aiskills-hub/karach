import React, { createContext, useContext, useMemo, useState } from "react";
import { CurrencyCode, convert, toUSD, currencyObj } from "../lib/currency";
import { darkPalette, lightPalette, Palette } from "../theme";

// ---------------- Types ----------------

export type AccountType = "checking" | "savings" | "cash" | "investment" | "credit";

export const ACCOUNT_TYPES: { id: AccountType; label: string; kind: "asset" | "liability" }[] = [
  { id: "checking", label: "Checking", kind: "asset" },
  { id: "savings", label: "Savings", kind: "asset" },
  { id: "cash", label: "Cash", kind: "asset" },
  { id: "investment", label: "Investment", kind: "asset" },
  { id: "credit", label: "Credit card", kind: "liability" },
];

export type Account = {
  id: string;
  name: string;
  institution: string;
  type: AccountType;
  currency: CurrencyCode;
  balance: number;
  location: string;
  number: string;
  ifsc: string;
  logPass: string;
  tranPass: string;
};

export type Category = { id: string; name: string };

export type Transaction = {
  id: string;
  categoryId: string;
  amount: number;
  currency: CurrencyCode;
  date: string; // ISO
  note: string;
  direction: "DEBIT" | "CREDIT";
  fromAccountId: string;
  toAccountId: string;
  isTransfer: boolean;
};

export type Budget = { id: string; categoryId: string; limit: number };

export type Loan = {
  id: string;
  direction: "TAKEN" | "GIVEN";
  counterparty: string;
  currency: CurrencyCode;
  principal: number;
  interestRate: number;
  minPayment: number;
  paid: number;
};

export type SplitMember = { id: string; name: string };
export type SplitGroup = {
  id: string;
  name: string;
  type: "GROUP" | "DIRECT";
  members: SplitMember[];
};
export type SplitExpense = {
  id: string;
  groupId: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  paidById: string;
  date: string;
};

// ---------------- Seed data ----------------

const seedCategories: Category[] = [
  { id: "c1", name: "Groceries" },
  { id: "c2", name: "Dining out" },
  { id: "c3", name: "Transport" },
  { id: "c4", name: "Entertainment" },
  { id: "c5", name: "Utilities" },
  { id: "c6", name: "Rent" },
];

const catBase: Record<string, number> = {
  Groceries: 380, "Dining out": 140, Transport: 95,
  Entertainment: 60, Utilities: 150, Rent: 1250,
};

function seedTransactions(): Transaction[] {
  const txs: Transaction[] = [];
  const now = new Date();
  for (let i = 17; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 15);
    seedCategories.forEach((cat, ci) => {
      const base = catBase[cat.name] ?? 100;
      const wave = Math.sin((i + ci * 3) * 0.55) * 0.18 + 1;
      txs.push({
        id: `auto-${cat.id}-${i}`,
        categoryId: cat.id,
        amount: Math.round(base * wave * 100) / 100,
        currency: "USD",
        date: d.toISOString(),
        note: "",
        direction: "DEBIT",
        fromAccountId: "",
        toAccountId: "",
        isTransfer: false,
      });
    });
  }
  return txs;
}

const seedAccounts: Account[] = [
  { id: "a1", name: "Everyday Checking", institution: "Chase", type: "checking", currency: "USD", balance: 2430.18, location: "New York, USA", number: "**** 4471", ifsc: "", logPass: "", tranPass: "" },
  { id: "a2", name: "Emergency Fund", institution: "Ally", type: "savings", currency: "USD", balance: 8500, location: "Online, USA", number: "**** 8820", ifsc: "", logPass: "", tranPass: "" },
  { id: "a3", name: "Brokerage", institution: "Robinhood", type: "investment", currency: "USD", balance: 5210.44, location: "USA", number: "", ifsc: "", logPass: "", tranPass: "" },
  { id: "a4", name: "Cash on hand", institution: "", type: "cash", currency: "EUR", balance: 110, location: "Munich, DE", number: "", ifsc: "", logPass: "", tranPass: "" },
  { id: "a5", name: "Rewards Card", institution: "Amex", type: "credit", currency: "USD", balance: 620.35, location: "USA", number: "**** 1092", ifsc: "", logPass: "", tranPass: "" },
  { id: "a6", name: "NRE Savings", institution: "HDFC Bank", type: "savings", currency: "INR", balance: 145000, location: "Mumbai, India", number: "50100234567890", ifsc: "HDFC0001234", logPass: "", tranPass: "" },
];

const seedLoans: Loan[] = [
  { id: "l1", direction: "TAKEN", counterparty: "Chase Bank (car loan)", currency: "USD", principal: 12000, interestRate: 6.5, minPayment: 320, paid: 3200 },
  { id: "l2", direction: "TAKEN", counterparty: "Amex credit card", currency: "USD", principal: 4200, interestRate: 22, minPayment: 150, paid: 900 },
  { id: "l3", direction: "GIVEN", counterparty: "Sam", currency: "USD", principal: 500, interestRate: 0, minPayment: 0, paid: 200 },
  { id: "l4", direction: "TAKEN", counterparty: "HDFC personal loan", currency: "INR", principal: 300000, interestRate: 11, minPayment: 9000, paid: 60000 },
];

const seedGroups: SplitGroup[] = [
  { id: "g1", name: "Japan trip", type: "GROUP", members: [{ id: "me", name: "You" }, { id: "alex", name: "Alex" }, { id: "priya", name: "Priya" }] },
  { id: "g2", name: "Sam", type: "DIRECT", members: [{ id: "me", name: "You" }, { id: "sam", name: "Sam" }] },
];

const seedSplitExpenses: SplitExpense[] = [
  { id: "se1", groupId: "g1", description: "Flights", amount: 1800, currency: "USD", paidById: "me", date: "2026-05-02" },
  { id: "se2", groupId: "g1", description: "Hotel (5 nights)", amount: 900, currency: "USD", paidById: "alex", date: "2026-05-10" },
  { id: "se3", groupId: "g1", description: "Dinner in Kyoto", amount: 22000, currency: "INR", paidById: "priya", date: "2026-05-12" },
  { id: "se4", groupId: "g2", description: "Concert tickets", amount: 140, currency: "USD", paidById: "sam", date: "2026-06-01" },
];

// ---------------- Context ----------------

type Store = {
  palette: Palette;
  isDark: boolean;
  toggleDark: () => void;
  hidden: boolean;
  toggleHidden: () => void;
  home: CurrencyCode;
  cycleHome: () => void;

  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  loans: Loan[];
  groups: SplitGroup[];
  splitExpenses: SplitExpense[];

  addAccount: (a: Omit<Account, "id">) => void;
  removeAccount: (id: string) => void;
  addCategory: (name: string) => void;
  setBudget: (categoryId: string, limit: number) => void;
  addTransaction: (t: Omit<Transaction, "id" | "isTransfer">) => void;
  removeTransaction: (id: string) => void;
  addLoan: (l: Omit<Loan, "id" | "paid">) => void;
  recordLoanPayment: (id: string, amount: number) => void;
  addSplitGroup: (name: string, friend: string, type: "GROUP" | "DIRECT") => string;
  addSplitMember: (groupId: string, name: string) => void;
  addSplitExpense: (e: Omit<SplitExpense, "id" | "date">) => void;

  // derived
  toHome: (amount: number, from: CurrencyCode | undefined) => number;
  monthSpentForCategory: (categoryId: string) => number;
  netWorth: () => { assets: number; liabilities: number; net: number };
  splitBalances: (group: SplitGroup) => Record<string, number>;
};

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside <StoreProvider>");
  return v;
}

const uid = (p: string) => p + Math.random().toString(36).slice(2, 9);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [homeIndex, setHomeIndex] = useState(0);

  const [accounts, setAccounts] = useState<Account[]>(seedAccounts);
  const [categories, setCategories] = useState<Category[]>(seedCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(seedTransactions);
  const [budgets, setBudgets] = useState<Budget[]>([
    { id: "b1", categoryId: "c1", limit: 420 },
    { id: "b2", categoryId: "c2", limit: 150 },
    { id: "b3", categoryId: "c3", limit: 110 },
    { id: "b4", categoryId: "c4", limit: 80 },
    { id: "b5", categoryId: "c5", limit: 170 },
    { id: "b6", categoryId: "c6", limit: 1250 },
  ]);
  const [loans, setLoans] = useState<Loan[]>(seedLoans);
  const [groups, setGroups] = useState<SplitGroup[]>(seedGroups);
  const [splitExpenses, setSplitExpenses] = useState<SplitExpense[]>(seedSplitExpenses);

  const homeCodes: CurrencyCode[] = ["USD", "EUR", "INR"];
  const home = homeCodes[homeIndex];

  const value = useMemo<Store>(() => {
    const toHome = (amount: number, from: CurrencyCode | undefined) =>
      toUSD(amount, from) * currencyObj(home).rate;

    const isExpense = (t: Transaction) => !t.isTransfer && t.direction !== "CREDIT";

    return {
      palette: isDark ? darkPalette : lightPalette,
      isDark,
      toggleDark: () => setIsDark((v) => !v),
      hidden,
      toggleHidden: () => setHidden((v) => !v),
      home,
      cycleHome: () => setHomeIndex((i) => (i + 1) % homeCodes.length),

      accounts, categories, transactions, budgets, loans, groups, splitExpenses,

      addAccount: (a) => setAccounts((prev) => [...prev, { ...a, id: uid("a") }]),
      removeAccount: (id) => setAccounts((prev) => prev.filter((x) => x.id !== id)),

      addCategory: (name) =>
        setCategories((prev) => [...prev, { id: uid("c"), name }]),

      setBudget: (categoryId, limit) =>
        setBudgets((prev) => {
          const existing = prev.find((b) => b.categoryId === categoryId);
          if (existing) return prev.map((b) => (b.categoryId === categoryId ? { ...b, limit } : b));
          return [...prev, { id: uid("b"), categoryId, limit }];
        }),

      addTransaction: (t) => {
        const isTransfer = Boolean(t.fromAccountId) && Boolean(t.toAccountId);
        setAccounts((prev) =>
          prev.map((acc) => {
            let bal = acc.balance;
            if (acc.id === t.fromAccountId) bal -= convert(t.amount, t.currency, acc.currency);
            if (acc.id === t.toAccountId) bal += convert(t.amount, t.currency, acc.currency);
            return bal === acc.balance ? acc : { ...acc, balance: bal };
          })
        );
        setTransactions((prev) => [...prev, { ...t, id: uid("t"), isTransfer }]);
      },

      removeTransaction: (id) => {
        const t = transactions.find((x) => x.id === id);
        if (t) {
          setAccounts((prev) =>
            prev.map((acc) => {
              let bal = acc.balance;
              if (acc.id === t.fromAccountId) bal += convert(t.amount, t.currency, acc.currency);
              if (acc.id === t.toAccountId) bal -= convert(t.amount, t.currency, acc.currency);
              return bal === acc.balance ? acc : { ...acc, balance: bal };
            })
          );
        }
        setTransactions((prev) => prev.filter((x) => x.id !== id));
      },

      addLoan: (l) => setLoans((prev) => [...prev, { ...l, id: uid("l"), paid: 0 }]),
      recordLoanPayment: (id, amount) =>
        setLoans((prev) => prev.map((l) => (l.id === id ? { ...l, paid: l.paid + amount } : l))),

      addSplitGroup: (name, friend, type) => {
        const id = uid("g");
        setGroups((prev) => [
          ...prev,
          { id, name, type, members: [{ id: "me", name: "You" }, { id: uid("p"), name: friend }] },
        ]);
        return id;
      },
      addSplitMember: (groupId, name) =>
        setGroups((prev) =>
          prev.map((g) =>
            g.id === groupId && g.type === "GROUP"
              ? { ...g, members: [...g.members, { id: uid("m"), name }] }
              : g
          )
        ),
      addSplitExpense: (e) =>
        setSplitExpenses((prev) => [...prev, { ...e, id: uid("se"), date: new Date().toISOString() }]),

      toHome,

      monthSpentForCategory: (categoryId) => {
        const now = new Date();
        return transactions
          .filter((t) => {
            const d = new Date(t.date);
            return (
              t.categoryId === categoryId &&
              isExpense(t) &&
              d.getFullYear() === now.getFullYear() &&
              d.getMonth() === now.getMonth()
            );
          })
          .reduce((s, t) => s + toHome(t.amount, t.currency), 0);
      },

      netWorth: () => {
        let assets = 0, liabilities = 0;
        accounts.forEach((a) => {
          const kind = ACCOUNT_TYPES.find((t) => t.id === a.type)?.kind ?? "asset";
          const v = toHome(a.balance, a.currency);
          if (kind === "asset") assets += v; else liabilities += v;
        });
        return { assets, liabilities, net: assets - liabilities };
      },

      splitBalances: (group) => {
        const bal: Record<string, number> = {};
        group.members.forEach((m) => (bal[m.id] = 0));
        splitExpenses
          .filter((e) => e.groupId === group.id)
          .forEach((e) => {
            const amt = toHome(e.amount, e.currency);
            const share = amt / group.members.length;
            group.members.forEach((m) => {
              bal[m.id] += (m.id === e.paidById ? amt : 0) - share;
            });
          });
        return bal;
      },
    };
  }, [isDark, hidden, home, accounts, categories, transactions, budgets, loans, groups, splitExpenses]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
