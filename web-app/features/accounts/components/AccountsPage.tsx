"use client";

import { useEffect, useState } from "react";
import { usePrefs } from "@/components/PreferencesProvider";
import { fmtRaw, fmtHome, CURRENCIES, CurrencyCode } from "@/lib/currency";

type Account = {
  id: string;
  name: string;
  institution: string | null;
  type: "CHECKING" | "SAVINGS" | "CASH" | "INVESTMENT" | "CREDIT";
  currency: CurrencyCode;
  balance: number;
  location: string | null;
  number: string | null;
  ifsc: string | null;
  logPass: string | null;
  tranPass: string | null;
};

const TYPE_LABELS: Record<Account["type"], string> = {
  CHECKING: "Checking",
  SAVINGS: "Savings",
  CASH: "Cash",
  INVESTMENT: "Investment",
  CREDIT: "Credit card",
};
const isLiability = (t: Account["type"]) => t === "CREDIT";

export default function AccountsFeaturePage() {
  const { hideAmounts, homeCurrency } = usePrefs();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [type, setType] = useState<Account["type"]>("CHECKING");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [balance, setBalance] = useState("");
  const [location, setLocation] = useState("");
  const [number, setNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [logPass, setLogPass] = useState("");
  const [tranPass, setTranPass] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/accounts");
    setAccounts(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    const bal = parseFloat(balance);
    if (!name.trim() || isNaN(bal)) return;
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(), institution: institution.trim(), type, currency, balance: bal,
        location: location.trim(), number: number.trim(), ifsc: ifsc.trim(), logPass, tranPass,
      }),
    });
    if (res.ok) {
      setName(""); setInstitution(""); setBalance(""); setLocation("");
      setNumber(""); setIfsc(""); setLogPass(""); setTranPass(""); setFormOpen(false);
      load();
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (res.ok) load();
  }

  function copy(value: string, key: string) {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1200);
  }

  const assets = accounts.filter((a) => !isLiability(a.type)).reduce((s, a) => s + a.balance / (CURRENCIES.find(c=>c.code===a.currency)?.rate ?? 1) * (CURRENCIES.find(c=>c.code===homeCurrency)?.rate ?? 1), 0);
  const liabilities = accounts.filter((a) => isLiability(a.type)).reduce((s, a) => s + a.balance / (CURRENCIES.find(c=>c.code===a.currency)?.rate ?? 1) * (CURRENCIES.find(c=>c.code===homeCurrency)?.rate ?? 1), 0);

  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-wide text-moss2/70">What you have</p>
      <h1 className="mt-1 font-display text-4xl font-semibold text-ink">Accounts</h1>
      <p className="mt-2 text-sm text-ink/60">
        Add every account you hold. Each shows its own currency; net worth converts everything to
        your home currency ({homeCurrency}).
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded border border-line bg-ledger px-5 py-4">
          <p className="font-mono text-xs uppercase text-ink/50">Assets</p>
          <p className="mt-1 font-display text-2xl text-gain">{fmtHome(assets, homeCurrency, hideAmounts)}</p>
        </div>
        <div className="rounded border border-line bg-ledger px-5 py-4">
          <p className="font-mono text-xs uppercase text-ink/50">Liabilities</p>
          <p className="mt-1 font-display text-2xl text-signal">{fmtHome(liabilities, homeCurrency, hideAmounts)}</p>
        </div>
      </div>
      <div className="mt-3 rounded border border-dashed border-line px-5 py-4">
        <div className="flex items-baseline justify-between">
          <span className="font-display text-lg text-ink">Net worth</span>
          <span className="font-display text-xl text-ink">{fmtHome(assets - liabilities, homeCurrency, hideAmounts)}</span>
        </div>
      </div>

      <button
        onClick={() => setFormOpen((v) => !v)}
        className="mt-6 rounded bg-moss px-4 py-2 text-sm font-medium text-paper hover:bg-moss2"
      >
        {formOpen ? "Cancel" : "+ Add account"}
      </button>

      {formOpen && (
        <div className="mt-4 rounded border border-line bg-ledger p-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Account name" value={name} onChange={setName} placeholder="e.g. Main Checking" />
            <Field label="Institution" value={institution} onChange={setInstitution} placeholder="e.g. HDFC Bank" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <SelectField label="Type" value={type} onChange={(v) => setType(v as Account["type"])}
              options={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
            <SelectField label="Currency" value={currency} onChange={(v) => setCurrency(v as CurrencyCode)}
              options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} (${c.symbol})` }))} />
            <Field label="Balance" value={balance} onChange={setBalance} placeholder="0.00" />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Field label="Location" value={location} onChange={setLocation} placeholder="e.g. Mumbai, India" />
            <Field label="Account number" value={number} onChange={setNumber} placeholder="e.g. 50100234567890" />
            <Field label="IFSC code" value={ifsc} onChange={setIfsc} placeholder="e.g. HDFC0001234" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Login password" value={logPass} onChange={setLogPass} placeholder="••••••••" type="password" />
            <Field label="Transaction password" value={tranPass} onChange={setTranPass} placeholder="••••••••" type="password" />
          </div>
          <button onClick={submit} className="mt-4 rounded bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/80">
            Save account
          </button>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-ink/40">
            Credit cards: enter the amount currently owed as a positive number — treated as a liability.
            Passwords are demo-only plaintext storage — a real deployment must encrypt these (e.g. via a
            vault or KMS-backed field) and never store them as-is.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {loading && <p className="text-sm text-ink/50">Loading…</p>}
        {!loading && accounts.length === 0 && (
          <p className="rounded border border-dashed border-line px-4 py-6 text-center text-sm text-ink/50">
            No accounts yet. Add one above.
          </p>
        )}
        {accounts.map((a) => (
          <div key={a.id} className="rounded border border-line bg-ledger px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-lg text-ink">
                {a.name}
                {a.institution && <span className="ml-2 font-mono text-xs text-ink/40">· {a.institution}</span>}
              </span>
              <span className={`font-mono text-sm ${isLiability(a.type) ? "text-signal" : "text-ink"}`}>
                {isLiability(a.type) ? "-" : ""}{fmtRaw(a.balance, a.currency, hideAmounts)}
              </span>
            </div>
            <p className="mt-1 font-mono text-xs text-ink/50">
              {TYPE_LABELS[a.type]} · {isLiability(a.type) ? "liability" : "asset"} · {a.currency}
              {a.location ? ` · ${a.location}` : ""}
            </p>

            <div className="mt-3 space-y-1 text-xs">
              <DetailRow label="Name" value={a.name} onCopy={() => copy(a.name, a.id + "name")} copied={copiedId === a.id + "name"} />
              <DetailRow label="Number" value={a.number} onCopy={() => copy(a.number ?? "", a.id + "num")} copied={copiedId === a.id + "num"} />
              <DetailRow label="IFSC" value={a.ifsc} onCopy={() => copy(a.ifsc ?? "", a.id + "ifsc")} copied={copiedId === a.id + "ifsc"} />
              <SecretRow label="Login password" value={a.logPass} shown={!!showSecret[a.id + "log"]}
                onToggle={() => setShowSecret((s) => ({ ...s, [a.id + "log"]: !s[a.id + "log"] }))} />
              <SecretRow label="Transaction password" value={a.tranPass} shown={!!showSecret[a.id + "tran"]}
                onToggle={() => setShowSecret((s) => ({ ...s, [a.id + "tran"]: !s[a.id + "tran"] }))} />
            </div>

            {(a.number || a.ifsc) && (
              <button
                onClick={() => copy(`Name: ${a.name}\n${a.number ? `Account number: ${a.number}\n` : ""}${a.ifsc ? `IFSC: ${a.ifsc}` : ""}`, a.id + "all")}
                className="mt-3 w-full rounded bg-moss py-2 text-xs font-medium text-paper hover:bg-moss2"
              >
                {copiedId === a.id + "all" ? "Copied!" : "Copy all payment details"}
              </button>
            )}

            <button onClick={() => remove(a.id)} className="mt-3 text-xs text-signal hover:underline">
              Remove account
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">{label}</label>
      <input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss"
      />
    </div>
  );
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] uppercase text-ink/50">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border border-line bg-paper px-3 py-2 text-sm outline-none focus-visible:border-moss">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
function DetailRow({ label, value, onCopy, copied }: { label: string; value: string | null; onCopy: () => void; copied: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 border-t border-line py-1 first:border-t-0">
      <span className="w-24 shrink-0 font-mono text-[10px] uppercase text-ink/50">{label}</span>
      <span className="flex-1 font-mono text-ink">{value}</span>
      <button onClick={onCopy} className="rounded border border-line px-2 py-0.5 text-[11px] font-medium text-moss2 hover:bg-moss/10">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
function SecretRow({ label, value, shown, onToggle }: { label: string; value: string | null; shown: boolean; onToggle: () => void }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 border-t border-line py-1">
      <span className="w-24 shrink-0 font-mono text-[10px] uppercase text-ink/50">{label}</span>
      <span className="flex-1 font-mono text-ink">{shown ? value : "••••••••"}</span>
      <button onClick={onToggle} className="rounded border border-line px-2 py-0.5 text-[11px] font-medium text-moss2 hover:bg-moss/10">
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  );
}
