"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/PreferencesProvider";
import { fmtHome } from "@/lib/currency";

type Category = { id: string; name: string };
type BudgetRow = {
  id: string;
  category: Category;
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
};

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function BudgetsFeaturePage() {
  const { homeCurrency, hideAmounts } = usePrefs();
  const now = new Date();
  const [month] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [newCategory, setNewCategory] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [amount, setAmount] = useState("");

  async function load() {
    setLoading(true);
    const [bRes, cRes] = await Promise.all([
      fetch(`/api/budgets?month=${month}&year=${year}&home=${homeCurrency}`),
      fetch(`/api/categories`),
    ]);
    setBudgets(await bRes.json());
    setCategories(await cRes.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [homeCurrency]);

  async function addCategory() {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory.trim() }),
    });
    if (res.ok) {
      setNewCategory("");
      load();
    }
  }

  async function addBudget() {
    if (!selectedCategoryId || !amount) return;
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: selectedCategoryId,
        amount: Number(amount),
        month,
        year,
      }),
    });
    if (res.ok) {
      setAmount("");
      setSelectedCategoryId("");
      load();
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-wide text-moss2/70">
        {monthNames[month - 1]} {year}
      </p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">Budgets</h1>
      <p className="mt-2 text-sm text-ink/60">
        Set a monthly limit per category. We compare it against what you've actually spent.
      </p>

      {/* Add category */}
      <div className="mt-8 flex items-end gap-3 border-t border-line pt-6">
        <div className="flex-1">
          <label className="mb-1 block font-mono text-xs uppercase text-ink/50">New category</label>
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="e.g. Groceries"
            className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss"
          />
        </div>
        <button
          onClick={addCategory}
          className="rounded bg-moss px-4 py-2 text-sm font-medium text-paper transition hover:bg-moss2"
        >
          Add category
        </button>
      </div>

      {/* Set budget */}
      <div className="mt-4 flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block font-mono text-xs uppercase text-ink/50">Category</label>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss"
          >
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label className="mb-1 block font-mono text-xs uppercase text-ink/50">Monthly limit ({homeCurrency})</label>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            inputMode="decimal"
            className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss"
          />
        </div>
        <button
          onClick={addBudget}
          className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink/80"
        >
          Set budget
        </button>
      </div>

      {/* Budget list */}
      <div className="mt-10 space-y-3">
        {loading && <p className="text-sm text-ink/50">Loading…</p>}
        {!loading && budgets.length === 0 && (
          <p className="rounded border border-dashed border-line px-4 py-6 text-center text-sm text-ink/50">
            No budgets set for this month yet. Add a category and a limit above to get started.
          </p>
        )}
        {budgets.map((b) => (
          <div key={b.id} className="rounded border border-line bg-ledger px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-lg text-ink">{b.category.name}</span>
              <span className="font-mono text-sm text-ink/70">
                {fmtHome(b.spent, homeCurrency, hideAmounts)} / {fmtHome(b.limit, homeCurrency, hideAmounts)}
              </span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${b.percentUsed}%`,
                  backgroundColor: b.percentUsed >= 100 ? "#C9642B" : "#2F5D50",
                }}
              />
            </div>
            <div className="mt-2 flex justify-between font-mono text-xs text-ink/50">
              <span>{b.percentUsed}% used</span>
              <span>
                {b.remaining >= 0
                  ? `${fmtHome(b.remaining, homeCurrency, hideAmounts)} remaining`
                  : `${fmtHome(Math.abs(b.remaining), homeCurrency, hideAmounts)} over`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
