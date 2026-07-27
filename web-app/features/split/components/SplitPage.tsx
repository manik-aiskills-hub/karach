"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/PreferencesProvider";
import { fmtRaw, fmtHome, CURRENCIES, CurrencyCode } from "@/lib/currency";

type Member = { id: string; name: string; userId: string | null };
type Group = { id: string; name: string; type: "GROUP" | "DIRECT"; members: Member[] };
type Expense = { id: string; description: string; amount: number; currency: CurrencyCode; paidById: string; date: string };
type GroupDetail = Group & { expenses: Expense[]; balances: Record<string, number> };

export default function SplitFeaturePage() {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  return openGroupId
    ? <GroupDetailView groupId={openGroupId} onBack={() => setOpenGroupId(null)} />
    : <GroupList onOpen={setOpenGroupId} />;
}

function GroupList({ onOpen }: { onOpen: (id: string) => void }) {
  const { homeCurrency, hideAmounts } = usePrefs();
  const [groups, setGroups] = useState<Group[]>([]);
  const [balancesByGroup, setBalancesByGroup] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const [name, setName] = useState("");
  const [friend, setFriend] = useState("");
  const [type, setType] = useState<"GROUP" | "DIRECT">("GROUP");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/split/groups");
    const gs: Group[] = await res.json();
    setGroups(gs);
    const entries = await Promise.all(
      gs.map(async (g) => {
        const r = await fetch(`/api/split/groups/${g.id}?home=${homeCurrency}`);
        const detail = await r.json();
        const me = g.members.find((m) => m.userId);
        return [g.id, me ? (detail.balances?.[me.id] ?? 0) : 0] as const;
      })
    );
    setBalancesByGroup(Object.fromEntries(entries));
    setLoading(false);
  }
  useEffect(() => { load(); }, [homeCurrency]);

  async function create() {
    if (!name.trim() || !friend.trim()) return;
    const res = await fetch("/api/split/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), type, friendName: friend.trim() }),
    });
    if (res.ok) {
      const g = await res.json();
      setName(""); setFriend(""); setFormOpen(false);
      onOpen(g.id);
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-wide text-moss2/70">Split · isolated module</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">Split</h1>
      <p className="mt-2 text-sm text-ink/60">
        A <b>Group</b> starts as you + 1 and can grow. A <b>Direct</b> split is you and one person,
        fixed — no one else can be added.
      </p>

      <div className="mt-6 space-y-3">
        {loading && <p className="text-sm text-ink/50">Loading…</p>}
        {!loading && groups.length === 0 && (
          <p className="rounded border border-dashed border-line px-4 py-6 text-center text-sm text-ink/50">No splits yet.</p>
        )}
        {groups.map((g) => {
          const bal = balancesByGroup[g.id] ?? 0;
          const settled = Math.abs(bal) < 0.01;
          const others = g.members.filter((m) => !m.userId).map((m) => m.name).join(", ");
          return (
            <button key={g.id} onClick={() => onOpen(g.id)} className="block w-full rounded border border-line bg-ledger px-5 py-4 text-left hover:bg-moss/5">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-lg text-ink">{g.name} <span className="font-mono text-xs text-ink/40">· {g.type === "DIRECT" ? "direct" : "group"}</span></span>
                <span className={`font-mono text-xs font-medium ${settled ? "text-ink/50" : bal > 0 ? "text-gain" : "text-signal"}`}>
                  {settled ? "settled up" : bal > 0 ? `owed ${fmtHome(bal, homeCurrency, hideAmounts)}` : `you owe ${fmtHome(Math.abs(bal), homeCurrency, hideAmounts)}`}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-ink/50">with {others}</p>
            </button>
          );
        })}
      </div>

      <button onClick={() => setFormOpen((v) => !v)} className="mt-6 rounded bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss2">
        {formOpen ? "Cancel" : "+ Start a new split"}
      </button>

      {formOpen && (
        <div className="mt-4 rounded border border-line bg-ledger p-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Roommates, or a trip name"
                className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">Their name (the +1)</label>
              <input value={friend} onChange={(e) => setFriend(e.target.value)} placeholder="e.g. Jordan"
                className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={() => setType("GROUP")} className={`rounded px-3 py-2 text-sm font-medium ${type === "GROUP" ? "bg-ink text-paper" : "bg-paper text-ink/60"}`} title="Can add more people later">Group</button>
            <button onClick={() => setType("DIRECT")} className={`rounded px-3 py-2 text-sm font-medium ${type === "DIRECT" ? "bg-ink text-paper" : "bg-paper text-ink/60"}`} title="Just the two of you, fixed">Direct (just us two)</button>
            <button onClick={create} className="rounded bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss2">Create</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupDetailView({ groupId, onBack }: { groupId: string; onBack: () => void }) {
  const { homeCurrency, hideAmounts } = usePrefs();
  const [detail, setDetail] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const [newMember, setNewMember] = useState("");
  const [desc, setDesc] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/split/groups/${groupId}?home=${homeCurrency}`);
    const d = await res.json();
    setDetail(d);
    if (d.members?.[0] && !paidById) setPaidById(d.members[0].id);
    setLoading(false);
  }
  useEffect(() => { load(); }, [groupId, homeCurrency]);

  async function addMember() {
    if (!newMember.trim()) return;
    const res = await fetch(`/api/split/groups/${groupId}/members`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newMember.trim() }),
    });
    if (res.ok) { setNewMember(""); load(); }
  }

  async function addExpense() {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || !paidById) return;
    const res = await fetch(`/api/split/groups/${groupId}/expenses`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: desc.trim(), amount: amt, currency, paidById }),
    });
    if (res.ok) { setDesc(""); setAmount(""); load(); }
  }

  if (loading || !detail) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} className="mb-4 text-sm font-medium text-moss2 hover:underline">← All splits</button>
      <p className="font-mono text-xs uppercase tracking-wide text-moss2/70">{detail.type === "DIRECT" ? "direct" : "group"}</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">{detail.name}</h1>
      <p className="mt-2 text-sm text-ink/60">
        Split expenses stay separate from your personal budgets. Balances converted to your home
        currency ({homeCurrency}); each expense still shows its own currency.
      </p>

      <h2 className="mt-6 font-display text-lg font-semibold text-ink">People</h2>
      <div className="mt-3 space-y-2">
        {detail.members.map((m) => {
          const bal = detail.balances[m.id] ?? 0;
          const settled = Math.abs(bal) < 0.01;
          return (
            <div key={m.id} className="rounded border border-line bg-ledger px-4 py-3">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-base text-ink">{m.name}{m.userId ? " (you)" : ""}</span>
                <span className={`font-mono text-xs ${settled ? "text-ink/50" : bal > 0 ? "text-gain" : "text-signal"}`}>
                  {settled ? "settled up" : bal > 0 ? `is owed ${fmtHome(bal, homeCurrency, hideAmounts)}` : `owes ${fmtHome(Math.abs(bal), homeCurrency, hideAmounts)}`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {detail.type === "GROUP" ? (
        <div className="mt-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">Add a person</label>
            <input value={newMember} onChange={(e) => setNewMember(e.target.value)} placeholder="e.g. Jordan"
              className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
          </div>
          <button onClick={addMember} className="rounded bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/80">Add to group</button>
        </div>
      ) : (
        <p className="mt-4 font-mono text-xs text-ink/50">Direct split — fixed at two people.</p>
      )}

      <h2 className="mt-8 font-display text-lg font-semibold text-ink">Add an expense</h2>
      <div className="mt-3 grid grid-cols-4 gap-3">
        <div className="col-span-2">
          <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">Description</label>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="e.g. Dinner"
            className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">Currency</label>
          <select value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
            className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss">
            {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">Amount</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
            className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss" />
        </div>
      </div>
      <div className="mt-3 flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">Paid by</label>
          <select value={paidById} onChange={(e) => setPaidById(e.target.value)}
            className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss">
            {detail.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <button onClick={addExpense} className="rounded bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss2">Add & split equally</button>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[11px] uppercase text-ink/50">
              <th className="py-2 text-left">Date</th><th className="py-2 text-left">Description</th>
              <th className="py-2 text-left">Paid by</th><th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {detail.expenses.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-ink/50">No expenses yet.</td></tr>}
            {detail.expenses.map((e) => {
              const payer = detail.members.find((m) => m.id === e.paidById);
              return (
                <tr key={e.id} className="border-b border-line">
                  <td className="py-2">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td className="py-2">{e.description}</td>
                  <td className="py-2">{payer?.name ?? "—"}</td>
                  <td className="py-2 text-right font-mono">{fmtRaw(e.amount, e.currency, hideAmounts)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
