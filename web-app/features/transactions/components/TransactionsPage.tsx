"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/PreferencesProvider";
import { fmtRaw, CURRENCIES, CurrencyCode } from "@/lib/currency";

type Category = { id: string; name: string };
type Account = { id: string; name: string };
type Transaction = {
  id: string;
  categoryId: string;
  category: Category | null;
  amount: number;
  currency: CurrencyCode;
  direction: "DEBIT" | "CREDIT";
  date: string;
  notes: string | null;
  fromAccount: Account | null;
  toAccount: Account | null;
  isTransfer: boolean;
};

export default function TransactionsFeaturePage() {
  const { hideAmounts } = usePrefs();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const [categoryId, setCategoryId] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    const [tRes, cRes, aRes] = await Promise.all([
      fetch("/api/transactions"),
      fetch("/api/categories"),
      fetch("/api/accounts"),
    ]);
    setTransactions(await tRes.json());
    const cats = await cRes.json();
    setCategories(cats);
    if (cats[0]) setCategoryId((v) => v || cats[0].id);
    setAccounts(await aRes.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    const amt = parseFloat(amount);
    if (!categoryId || isNaN(amt) || amt <= 0) return;
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId, amount: amt, currency, direction, date, notes,
        fromAccountId: fromAccountId || undefined, toAccountId: toAccountId || undefined,
      }),
    });
    if (res.ok) {
      setAmount(""); setNotes(""); setFromAccountId(""); setToAccountId(""); setFormOpen(false);
      load();
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  return (
    <div className="max-w-4xl">
      <p className="font-mono text-xs uppercase tracking-wide text-moss2/70">Day-to-day</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">Transactions</h1>
      <p className="mt-2 text-sm text-ink/60">
        Log every expense in whatever currency it happened in. Fill in <b>both</b> From and To
        accounts to record an internal transfer — excluded from Budgets and Reports.
      </p>

      <button
        onClick={() => setFormOpen((v) => !v)}
        className="mt-6 rounded bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss2"
      >
        {formOpen ? "Cancel" : "+ Log transaction"}
      </button>

      {formOpen && (
        <div className="mt-4 rounded border border-line bg-ledger p-5">
          <div className="grid grid-cols-4 gap-3">
            <Select label="Category" value={categoryId} onChange={setCategoryId}
              options={categories.map((c) => ({ value: c.id, label: c.name }))} />
            <Select label="Currency" value={currency} onChange={(v) => setCurrency(v as CurrencyCode)}
              options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} (${c.symbol})` }))} />
            <Field label="Amount" value={amount} onChange={setAmount} placeholder="0.00" />
            <Select label="Debit / Credit" value={direction} onChange={(v) => setDirection(v as "DEBIT" | "CREDIT")}
              options={[{ value: "DEBIT", label: "Debit (out)" }, { value: "CREDIT", label: "Credit (in)" }]} />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            <Select label="From account" value={fromAccountId} onChange={setFromAccountId}
              options={[{ value: "", label: "— none —" }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} />
            <Select label="To account" value={toAccountId} onChange={setToAccountId}
              options={[{ value: "", label: "— none —" }, ...accounts.map((a) => ({ value: a.id, label: a.name }))]} />
            <Field label="Date" value={date} onChange={setDate} type="date" />
            <Field label="Comments" value={notes} onChange={setNotes} placeholder="e.g. Trader Joe's" />
          </div>
          <button onClick={submit} className="mt-4 rounded bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/80">
            Save transaction
          </button>
        </div>
      )}

      <div className="mt-8 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[11px] uppercase text-ink/50">
              <th className="py-2 text-left">Date</th>
              <th className="py-2 text-left">Category</th>
              <th className="py-2 text-right">Amount</th>
              <th className="py-2 text-left">From</th>
              <th className="py-2 text-left">To</th>
              <th className="py-2 text-right">Debit</th>
              <th className="py-2 text-right">Credit</th>
              <th className="py-2 text-left">Comments</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={9} className="py-6 text-center text-ink/50">Loading…</td></tr>}
            {!loading && transactions.length === 0 && (
              <tr><td colSpan={9} className="py-6 text-center text-ink/50">No transactions yet.</td></tr>
            )}
            {transactions.map((t) => (
              <tr key={t.id} className="border-b border-line">
                <td className="py-2">{new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                <td className="py-2">{t.category?.name ?? "—"}</td>
                <td className="py-2 text-right font-mono">{fmtRaw(t.amount, t.currency, hideAmounts)}</td>
                <td className="py-2 font-mono text-xs">{t.fromAccount?.name ?? "—"}</td>
                <td className="py-2 font-mono text-xs">{t.toAccount?.name ?? "—"}</td>
                <td className="py-2 text-right font-mono">
                  {t.direction === "DEBIT" ? <span className="text-signal">{fmtRaw(t.amount, t.currency, hideAmounts)}</span> : "—"}
                </td>
                <td className="py-2 text-right font-mono">
                  {t.direction === "CREDIT" ? <span className="text-gain">{fmtRaw(t.amount, t.currency, hideAmounts)}</span> : "—"}
                </td>
                <td className="py-2">{t.notes || "—"}</td>
                <td className="py-2 text-right">
                  <button onClick={() => remove(t.id)} className="text-xs text-signal hover:underline">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">{label}</label>
      <input type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
    </div>
  );
}
function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
