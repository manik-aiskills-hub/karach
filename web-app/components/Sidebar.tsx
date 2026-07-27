import Link from "next/link";

const nav = [
  { href: "/", label: "Overview" },
  { href: "/accounts", label: "Accounts" },
  { href: "/budgets", label: "Budgets" },
  { href: "/transactions", label: "Transactions" },
  { href: "/loans", label: "Loans" },
  { href: "/reports", label: "Reports" },
  { href: "/split", label: "Split" },
  { href: "/bills", label: "Bills" },
  { href: "/goals", label: "Goals" },
];

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-ledger md:block">
      <div className="sticky top-0 flex h-screen flex-col px-6 py-8">
        <div className="mb-10">
          <span className="font-display text-2xl font-semibold text-moss2">Kharch</span>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 font-body text-sm text-ink/80 transition hover:bg-moss/10 hover:text-moss2"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto font-mono text-[11px] text-ink/40">
          demo build · v0.2
        </div>
      </div>
    </aside>
  );
}
