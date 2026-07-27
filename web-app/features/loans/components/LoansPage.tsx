"use client";

import { useEffect, useMemo, useState } from "react";
import { calculatePayoffPlan, type DebtInput } from "@/features/loans/lib/payoffCalculator";
import { usePrefs } from "@/components/PreferencesProvider";
import { fmtRaw, fmtHome, toUSD, currencyObj, CURRENCIES, CurrencyCode } from "@/lib/currency";

type Loan = {
  id: string;
  direction: "TAKEN" | "GIVEN";
  counterparty: string;
  currency: CurrencyCode;
  principal: number;
  interestRate: number;
  minPayment: number | null;
  startDate: string;
  paid: number;
  balance: number;
  percentPaid: number;
};

export default function LoansFeaturePage() {
  const { homeCurrency, hideAmounts } = usePrefs();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);

  const [direction, setDirection] = useState<"TAKEN" | "GIVEN">("TAKEN");
  const [counterparty, setCounterparty] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  const [extraPayment, setExtraPayment] = useState("100");
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/loans");
    setLoans(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function toHome(amount: number, code: string) {
    return toUSD(amount, code) * currencyObj(homeCurrency).rate;
  }

  async function addLoan() {
    if (!counterparty.trim() || !principal) return;
    const res = await fetch("/api/loans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction, counterparty: counterparty.trim(), currency,
        principal: Number(principal),
        interestRate: interestRate ? Number(interestRate) : 0,
        minPayment: minPayment ? Number(minPayment) : undefined,
        startDate,
      }),
    });
    if (res.ok) {
      setCounterparty(""); setPrincipal(""); setInterestRate(""); setMinPayment("");
      load();
    }
  }

  async function recordPayment(loanId: string) {
    const amountStr = prompt("Payment amount:");
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (!amount || amount <= 0) return;
    const res = await fetch(`/api/loans/${loanId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    if (res.ok) load();
  }

  const taken = loans.filter((l) => l.direction === "TAKEN" && l.balance > 0);
  const given = loans.filter((l) => l.direction === "GIVEN" && l.balance > 0);

  const totalOwedByMe = taken.reduce((s, l) => s + toHome(l.balance, l.currency), 0);
  const totalOwedToMe = given.reduce((s, l) => s + toHome(l.balance, l.currency), 0);

  // Payoff comparison needs one common unit — convert to home currency for this calc only.
  const plan = useMemo(() => {
    const debts: DebtInput[] = taken.map((l) => ({
      id: l.id,
      name: l.counterparty,
      balance: toHome(l.balance, l.currency),
      interestRate: l.interestRate,
      minPayment: toHome(l.minPayment ?? 0, l.currency),
    }));
    return calculatePayoffPlan(debts, Number(extraPayment) || 0, strategy);
  }, [taken, extraPayment, strategy, homeCurrency]);

  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-wide text-moss2/70">Debt</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">Loans</h1>
      <p className="mt-2 text-sm text-ink/60">
        Track money you've borrowed and lent, in whatever currency it's actually in. Totals below
        convert to your home currency ({homeCurrency}).
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded border border-line bg-ledger px-5 py-4">
          <p className="font-mono text-xs uppercase text-ink/50">You owe</p>
          <p className="mt-1 font-display text-2xl text-signal">{fmtHome(totalOwedByMe, homeCurrency, hideAmounts)}</p>
        </div>
        <div className="rounded border border-line bg-ledger px-5 py-4">
          <p className="font-mono text-xs uppercase text-ink/50">Owed to you</p>
          <p className="mt-1 font-display text-2xl text-gain">{fmtHome(totalOwedToMe, homeCurrency, hideAmounts)}</p>
        </div>
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <div className="flex gap-2">
          <button onClick={() => setDirection("TAKEN")} className={`rounded px-3 py-1.5 text-sm font-medium ${direction === "TAKEN" ? "bg-ink text-paper" : "bg-ledger text-ink/60"}`}>I borrowed</button>
          <button onClick={() => setDirection("GIVEN")} className={`rounded px-3 py-1.5 text-sm font-medium ${direction === "GIVEN" ? "bg-ink text-paper" : "bg-ledger text-ink/60"}`}>I lent</button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block font-mono text-xs uppercase text-ink/50">{direction === "TAKEN" ? "Lender" : "Borrower"}</label>
            <input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} placeholder={direction === "TAKEN" ? "e.g. Chase Bank" : "e.g. Sam"}
              className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
          </div>
          <div>
            <label className="mb-1 block font-mono text-xs uppercase text-ink/50">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss">
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-mono text-xs uppercase text-ink/50">Principal amount</label>
            <input value={principal} onChange={(e) => setPrincipal(e.target.value)} placeholder="0.00" inputMode="decimal"
              className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block font-mono text-xs uppercase text-ink/50">Annual interest % (optional)</label>
            <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="0" inputMode="decimal"
              className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
          </div>
          <div>
            <label className="mb-1 block font-mono text-xs uppercase text-ink/50">Monthly minimum (optional)</label>
            <input value={minPayment} onChange={(e) => setMinPayment(e.target.value)} placeholder="0.00" inputMode="decimal"
              className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
          </div>
        </div>
        <button onClick={addLoan} className="mt-3 rounded bg-moss px-4 py-2 text-sm font-medium text-paper transition hover:bg-moss2">Add loan</button>
      </div>

      <div className="mt-10 space-y-3">
        {loading && <p className="text-sm text-ink/50">Loading…</p>}
        {!loading && loans.length === 0 && (
          <p className="rounded border border-dashed border-line px-4 py-6 text-center text-sm text-ink/50">
            No loans yet. Add one above — either something you borrowed or lent out.
          </p>
        )}
        {loans.map((l) => (
          <div key={l.id} className="rounded border border-line bg-ledger px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-lg text-ink">
                {l.counterparty}{" "}
                <span className="font-mono text-xs text-ink/40">({l.direction === "TAKEN" ? "borrowed" : "lent"} · {l.currency})</span>
              </span>
              <span className="font-mono text-sm text-ink/70">
                {fmtRaw(l.balance, l.currency, hideAmounts)} left of {fmtRaw(l.principal, l.currency, hideAmounts)}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${l.percentPaid}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-xs text-ink/50">{l.percentPaid}% paid off</span>
              <button onClick={() => recordPayment(l.id)} className="rounded border border-line px-3 py-1 text-xs font-medium text-moss2 hover:bg-moss/10">Record payment</button>
            </div>
          </div>
        ))}
      </div>

      {taken.length > 0 && (
        <div className="mt-12 border-t border-line pt-6">
          <h2 className="font-display text-2xl font-semibold text-ink">Repay them fast</h2>
          <p className="mt-1 text-sm text-ink/60">
            Add extra you can put toward debt each month. Shown in your home currency ({homeCurrency})
            so debts in different currencies can be compared.
          </p>

          <div className="mt-4 flex items-end gap-3">
            <div className="w-48">
              <label className="mb-1 block font-mono text-xs uppercase text-ink/50">Extra monthly payment ({homeCurrency})</label>
              <input value={extraPayment} onChange={(e) => setExtraPayment(e.target.value)} inputMode="decimal"
                className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStrategy("avalanche")} className={`rounded px-3 py-2 text-sm font-medium ${strategy === "avalanche" ? "bg-ink text-paper" : "bg-ledger text-ink/60"}`} title="Highest interest rate first — saves the most money">Avalanche</button>
              <button onClick={() => setStrategy("snowball")} className={`rounded px-3 py-2 text-sm font-medium ${strategy === "snowball" ? "bg-ink text-paper" : "bg-ledger text-ink/60"}`} title="Smallest balance first — fastest early wins">Snowball</button>
            </div>
          </div>

          <div className="mt-6 rounded border border-line bg-ledger px-5 py-4">
            <p className="font-mono text-xs uppercase text-ink/50">
              Debt-free in {plan.totalMonths} month{plan.totalMonths === 1 ? "" : "s"} · total interest {fmtHome(plan.totalInterestPaid, homeCurrency, hideAmounts)}
            </p>
            <div className="mt-4 space-y-2">
              {plan.entries.map((e) => (
                <div key={e.id} className="flex items-center justify-between border-t border-line pt-2 first:border-t-0 first:pt-0">
                  <span className="font-body text-sm text-ink">
                    <span className="mr-2 font-mono text-xs text-moss2">#{e.order}</span>
                    {e.name}
                  </span>
                  <span className="font-mono text-xs text-ink/60">
                    paid off month {e.payoffMonth} · {fmtHome(e.totalInterestPaid, homeCurrency, hideAmounts)} interest
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
