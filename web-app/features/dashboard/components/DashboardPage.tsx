"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/PreferencesProvider";
import { fmtHome } from "@/lib/currency";

type Summary = {
  netWorth: { assets: number; liabilities: number; net: number };
  debt: { owedByMe: number; owedToMe: number; net: number };
  splitNet: number;
  monthSpent: number;
};

export default function DashboardPage() {
  const { homeCurrency, hideAmounts } = usePrefs();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard?home=${homeCurrency}`).then((r) => r.json()).then(setSummary);
  }, [homeCurrency]);

  const f = (v: number) => fmtHome(v, homeCurrency, hideAmounts);

  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-wide text-moss2/70">Overview</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-2 text-sm text-ink/60">
        Add accounts on <b>Accounts</b>. Plan a budget on <b>Budgets</b>. Log spending on{" "}
        <b>Transactions</b>. Everything below rolls up automatically, converted to your home
        currency ({homeCurrency}).
      </p>

      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Stat label="Net worth" value={f(summary.netWorth.net)} />
          <Stat label="Spent this month" value={f(summary.monthSpent)} />
          <Stat label="You owe (loans)" value={f(summary.debt.owedByMe)} color="text-signal" />
          <Stat label="Owed to you (loans)" value={f(summary.debt.owedToMe)} color="text-gain" />
          <Stat label="Split net (all)" value={f(summary.splitNet)} color={summary.splitNet >= 0 ? "text-gain" : "text-signal"} />
        </div>
      )}

      <div className="mt-8 rounded border border-line bg-ledger px-5 py-4">
        <p className="font-display text-lg text-ink">Where things live</p>
        <p className="mt-1 text-sm text-ink/60">
          <b>Accounts</b> = what you have. <b>Budgets</b> = the plan. <b>Transactions</b> = the log.
          Budgets always reflects your logged transactions automatically — nothing to sync manually.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded border border-line bg-ledger px-5 py-4">
      <p className="font-mono text-xs uppercase text-ink/50">{label}</p>
      <p className={`mt-1 font-display text-2xl ${color ?? "text-ink"}`}>{value}</p>
    </div>
  );
}
