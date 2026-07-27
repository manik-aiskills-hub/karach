# AGENTS.md — Kharch Monorepo

Canonical reference for anyone (human or AI agent) picking up this repo. Read this before
touching any code — it explains why the repo is shaped this way and where things live.

## Structure

```
kharch/
  web-app/      Next.js 14 + Prisma + PostgreSQL — the full web app
  ios-app/      Expo (React Native) — the iOS/Android app
  app-logic/    Shared, framework-free business logic used by BOTH apps
  pnpm-workspace.yaml
  package.json  (root — workspace-level scripts only, no app code)
```

This is a **pnpm workspace monorepo** — one `pnpm install` at the root installs everything for
both apps, and `app-logic` is a real local package (`@kharch/app-logic`) that both apps depend on,
not a copy-pasted folder.

## Why a shared `app-logic` package

Before this restructuring, the web app and the mobile app each had their own copy of:
- currency conversion (`currency.ts`)
- the loan repayment simulator — avalanche/snowball (`payoff.ts`)
- the "is this transaction a real expense or a transfer" rule (`isExpense.ts`)

Two copies drift. `app-logic` is the single source of truth for that logic; each app just
re-exports it under its existing import path so nothing else had to change:

- `web-app/lib/currency.ts` → `export * from "@kharch/app-logic/currency"`
- `web-app/features/loans/lib/payoffCalculator.ts` → `export * from "@kharch/app-logic/payoff"`
- `web-app/features/transactions/lib/isExpense.ts` → `export * from "@kharch/app-logic/isExpense"`
- `ios-app/src/lib/currency.ts` → same pattern
- `ios-app/src/lib/payoff.ts` → same pattern

**Rule going forward:** any logic that is pure (no React, no Prisma, no `fetch`, no platform APIs)
and that both apps need, belongs in `app-logic`, not duplicated. If you find yourself copying a
function between `web-app` and `ios-app`, move it to `app-logic` instead.

## What belongs in `app-logic`

Only framework-free, pure functions and types:
- ✅ currency conversion, formatting rules
- ✅ the payoff/debt calculator
- ✅ the expense-vs-transfer rule
- ❌ anything importing React, `expo-*`, `next/*`, or `@prisma/client` — those are app-specific by
  definition and stay in their own app

## Each app has its own AGENTS.md

- `web-app/AGENTS.md` — Next.js feature-module architecture, Prisma schema, API routes
- `ios-app/README.md` — Expo project structure, how to run on a real iPhone via Expo Go

Read the relevant one before working inside that app. This root file only covers what's shared
across both.

## Data model note

Both apps model money the same way (this was a deliberate correction, not the original design):
- **Every amount is entered and stored in its own currency** — never silently converted for
  display. Transactions, loans, accounts, and split expenses each carry their own currency code.
- **Conversion only happens when combining multiple items into one total** (net worth, monthly
  spend, loan totals, split balances) — those use the user's **home currency**, a toolbar setting
  present on every screen in both apps, alongside dark mode and a hide-amounts privacy toggle.
- Dark mode is **true black** (`#000000`) with white text, not a tinted dark palette.

## Known limitations (both apps, current state)

- **No real authentication yet** — a single demo user stands in for a logged-in user
  (`web-app/lib/demoUser.ts`). The data model is already `userId`-scoped so adding auth later is
  additive, not a rewrite.
- **Passwords stored on Account records (login/transaction password) are plain text.** This is
  explicitly a prototype convenience. Before any real deployment: move these to `expo-secure-store`
  (iOS Keychain) on mobile and an encrypted field / secrets vault on the web backend. Never ship
  plain-text credential storage.
- **FX rates are fixed constants**, not live — see `app-logic/currency.ts`.
- **Preferences (dark mode, hidden amounts, home currency) are client-only** right now — they
  reset on reload / aren't synced between web and mobile. The `User` model in `web-app`'s Prisma
  schema already has `darkMode` / `hideAmounts` / `homeCurrency` columns ready for when this gets
  wired to a real "save my preferences" flow after auth exists.
