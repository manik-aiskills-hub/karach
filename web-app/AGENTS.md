# AGENTS.md — Architecture Reference

This file is the source of truth for how this codebase is organized. Read it before
adding, editing, or removing anything. It is written for AI coding agents (and humans)
picking up work on this repo without prior context.

## What this is

A personal finance web app: budgets, bills, reports, goals, receipts, notifications,
loan/debt tracking with a repayment accelerator, and an isolated bill-splitting module.
Stack: **Next.js 14 (App Router) + TypeScript + Prisma + PostgreSQL + Tailwind CSS**,
deployed on **Vercel**, database on **Supabase**.

## Core architectural rule: feature modules

All business logic lives under `features/<feature-name>/`, not in `app/`. The `app/`
directory is routing glue only — it should never contain business logic, database
queries, or calculation code. This is what makes the app "plug and play": each feature
is self-contained and can be added, removed, or handed to someone else to build without
touching unrelated code.

```
features/<name>/
  server/       → functions that talk to Prisma (the only files allowed to import "@/lib/prisma")
  lib/          → pure, framework-free logic (calculators, formatters) — unit-testable, no DB, no React
  components/   → the actual page/UI, client components that call the app's own API routes
```

`app/<route>/page.tsx` is always a one-line re-export:
```ts
export { default } from "@/features/<name>/components/<Name>Page";
```

`app/api/<resource>/route.ts` is a thin controller: parse/validate the request with `zod`,
call a function from `features/<name>/server/*.service.ts`, return JSON. No business logic
in route files.

### Why this shape
- A feature can be deleted by deleting one folder + its route/api re-exports — nothing else breaks.
- Server logic (`server/`) is reusable from API routes, server actions, or cron jobs alike.
- Pure logic (`lib/`) has zero framework dependencies, so it's trivial to unit test and to
  reuse (e.g. the payoff calculator in `features/loans/lib/payoffCalculator.ts` is a plain
  function you can test with plain inputs/outputs).

## Current folder structure

```
app/
  layout.tsx              root layout (Sidebar + Toolbar + PreferencesProvider)
  page.tsx                → re-exports features/dashboard
  accounts/page.tsx        → re-exports features/accounts
  budgets/page.tsx         → re-exports features/budgets
  transactions/page.tsx    → re-exports features/transactions
  loans/page.tsx           → re-exports features/loans
  split/page.tsx           → re-exports features/split
  bills/ reports/ goals/   → placeholders, not yet built
  api/
    accounts/, categories/, budgets/, transactions/, loans/, split/, dashboard/
      → each a thin controller calling the matching features/*/server/*.service.ts

features/
  accounts/     server/accounts.service.ts, components/AccountsPage.tsx
  budgets/      server/{categories,budgets}.service.ts, components/BudgetsPage.tsx
  transactions/ server/transactions.service.ts, lib/isExpense.ts (re-exports @kharch/app-logic), components/TransactionsPage.tsx
  loans/        server/loans.service.ts, lib/payoffCalculator.ts (re-exports @kharch/app-logic), components/LoansPage.tsx
  split/        server/split.service.ts, components/SplitPage.tsx
  dashboard/    server/dashboard.service.ts, components/DashboardPage.tsx
  bills/ goals/ reports/   ← empty, scaffolded, next to build

components/
  Sidebar.tsx              nav
  Toolbar.tsx               dark mode / hide amounts / home currency icons — rendered on every page
  PreferencesProvider.tsx   client context backing the toolbar (see root AGENTS.md — currently client-only, not persisted)
lib/
  prisma.ts          Prisma client singleton
  demoUser.ts         temporary single-user stand-in until auth is added
  currency.ts         thin re-export of @kharch/app-logic/currency — see root AGENTS.md
prisma/schema.prisma  full data model for ALL features (already modeled, see below)
```

Note: currency conversion, the loan payoff simulator, and the expense/transfer rule are NOT
maintained here directly — they live in the workspace package `@kharch/app-logic` (one level up,
`../app-logic`) and this app just re-exports them. See the root `AGENTS.md` before editing any of
those three files.

## Data model status

`prisma/schema.prisma` already contains models for every planned feature, even ones not
yet built in the UI. This is intentional — it avoids breaking schema migrations later.
When you build a new feature, its models likely already exist; check the schema first.

Feature → models:
- Accounts → `Account` (own `currency`, `type` asset/liability via `CREDIT`, `location`, `number`, `ifsc`, `logPass`/`tranPass` — **plain text, prototype only, see root AGENTS.md**)
- Budgets → `Category`, `Budget` (limit stored in home currency), `Transaction`
- Transactions → `Transaction` (own `currency`, `direction` DEBIT/CREDIT, `fromAccountId`/`toAccountId`/`isTransfer` for internal transfers)
- Bills/Subscriptions → `Bill`
- Reports → derived from `Transaction` (no new model needed)
- Goals → `Goal`
- Receipts → `Receipt`
- Notifications → `Notification`
- Loans/Debt → `Loan` (own `currency`), `LoanPayment` (direction: `TAKEN` or `GIVEN`)
- Split → `SplitGroup` (`type`: `GROUP` starts you+1 and can grow, or `DIRECT` fixed at two),
  `SplitGroupMember`, `SplitExpense` (own `currency`), `SplitShare`, `Settlement` —
  **deliberately isolated**, no foreign keys into `Transaction`/`Budget`/`Category`/`Account`.
  Only an aggregate "net owed" number (converted to home currency) surfaces on the dashboard.

Every table is scoped by `userId`. Auth is currently stubbed (`lib/demoUser.ts` returns
one seeded demo user) — when real auth (NextAuth) is added, swap that helper for a real
session lookup; no schema changes needed. `User` already has `darkMode`/`hideAmounts`/
`homeCurrency` columns ready for when preferences get persisted server-side.

## Design system

Tokens live in `tailwind.config.ts` (colors: `ink`, `paper`, `ledger`, `line`, `moss`,
`moss2`, `signal`, `gain`) as CSS-variable-backed Tailwind colors (`darkMode: "class"`) —
toggling the `.dark` class on `<html>` (via `PreferencesProvider`) re-themes every existing
`bg-*`/`text-*`/`border-*` utility automatically. Dark mode is **true black** (`#000000`)
with white text — see `app/globals.css` for both palettes. Fonts loaded in `app/globals.css`
(Fraunces = display, Inter = body, IBM Plex Mono = data/labels).

## How to add the next feature

1. Check `prisma/schema.prisma` — the models probably already exist.
2. Create `features/<name>/server/<name>.service.ts` with Prisma queries.
3. If there's non-trivial calculation logic that's ALSO useful on mobile, put it in
   `../app-logic` instead of `features/<name>/lib/` — see root AGENTS.md. If it's genuinely
   web-only, `features/<name>/lib/` is fine.
4. Create `features/<name>/components/<Name>Page.tsx` (client component, calls `/api/...`,
   reads `usePrefs()` from `@/components/PreferencesProvider` for home currency / hide-amounts).
5. Create/replace `app/<name>/page.tsx` with the one-line re-export.
6. Create `app/api/<name>/route.ts` as a thin controller calling the service.
7. Add the nav entry in `components/Sidebar.tsx`.
8. Update the roadmap checklist in `README.md`.

## Roadmap status

- [x] Accounts (per-account currency, location, number, IFSC, login/transaction password, copy buttons)
- [x] Budgets (spend computed live from Transactions, converted to home currency)
- [x] Transactions (Date/Category/Amount/From/To/Debit/Credit/Comments; transfer detection)
- [x] Loans / debt (taken & given, per-loan currency) + repayment accelerator (avalanche/snowball)
- [x] Split (Group vs Direct, multi-group, currency-aware balances, isolated from personal budgets)
- [x] Dashboard aggregation (net worth, monthly spend, loan position, split net)
- [ ] Bills & subscriptions
- [ ] Reports & insights (charts) — page exists as placeholder
- [ ] Goals & savings
- [ ] Receipts
- [ ] Notifications
- [ ] Real authentication (replaces `lib/demoUser.ts`)
