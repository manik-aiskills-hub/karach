# Kharch — Web App

Stack: **Next.js 14 (App Router) + Prisma + PostgreSQL (Supabase) + Tailwind CSS**, deployed on **Vercel**.
Part of the `kharch` monorepo — see the root [AGENTS.md](../AGENTS.md) for how this relates to `ios-app` and `app-logic`.

## Architecture

Built as **plug-and-play feature modules** — see **[AGENTS.md](./AGENTS.md)** for the full
architecture reference (folder structure, conventions, data model, how to add the next feature).
`CLAUDE.md` has Claude Code-specific commands and points to the same doc.

Shared logic (currency conversion, the loan payoff simulator, the expense/transfer rule) lives in
the workspace package `@kharch/app-logic` — also used by `ios-app`. See root AGENTS.md.

## Feature roadmap

- [x] **Accounts** — checking/savings/cash/investment/credit, each with its own currency, plus
      location, account number, IFSC code, login/transaction password fields, and copy-to-clipboard
- [x] **Budgets** — category limits (home currency), spent vs. remaining computed live from Transactions
- [x] **Transactions** — Date / Category / Amount / From / To / Debit / Credit / Comments; From+To
      both set = internal transfer, excluded from spend totals
- [x] **Loans / debt** — borrowed & lent, each in its own currency, plus a repayment accelerator
      (avalanche/snowball) normalized to home currency
- [x] **Split** — Group (starts you+1, can grow) vs Direct (fixed at two people) circles, isolated
      from personal budgets, currency-aware balances
- [x] **Dashboard / overview** — net worth, monthly spend, loan position, split net, all in home currency
- [ ] Reports & insights (charts) — placeholder page exists, not yet built
- [ ] Bills & subscriptions
- [ ] Goals & savings
- [ ] Receipts
- [ ] Notifications
- [ ] Real authentication (replaces the demo-user stub)

The database schema (`prisma/schema.prisma`) already models every feature above so we won't need
breaking schema changes as we go.

## 1. Local setup

```bash
cd kharch          # repo root, not this folder — pnpm workspace install must run from root
pnpm install
cd web-app
cp .env.example .env      # then fill in DATABASE_URL (see step 2)
npx prisma migrate dev --name init
pnpm dev
```

Visit http://localhost:3000

## 2. Set up the database (Supabase — free tier)

1. Go to https://supabase.com → New project
2. Once created: **Project Settings → Database → Connection string → URI** (choose the "Transaction" pooler for serverless use with Vercel)
3. Paste it into `.env` as `DATABASE_URL`
4. Run `npx prisma migrate dev --name init` to create the tables

## 3. Push to GitHub

This app lives inside the `kharch` monorepo — push the whole `kharch/` folder as one repo (it
already contains `web-app/`, `ios-app/`, and `app-logic/`):

```bash
cd kharch
git init
git add .
git commit -m "Kharch: web-app, ios-app, shared app-logic"
git branch -M main
git remote add origin https://github.com/<your-username>/kharch.git
git push -u origin main
```

## 4. Deploy on Vercel

1. Go to https://vercel.com/new and import your GitHub repo
2. **Set the project Root Directory to `web-app`** (important — this is a monorepo, Vercel needs
   to know which folder is the Next.js app)
3. Add an environment variable: `DATABASE_URL` = your Supabase connection string
4. Deploy — Vercel auto-detects Next.js, no further config needed
5. Every future `git push` to `main` auto-deploys

## Notes

- Auth is stubbed with a single demo user (`lib/demoUser.ts`) so the data model behaves exactly
  like the multi-user version — real auth (NextAuth) will be its own feature added on top.
- Every table is already scoped by `userId`, so adding auth later won't require a schema rewrite.
- Every amount (transactions, loans, split expenses, account balances) is entered and stored in
  its own currency. The toolbar's home-currency setting only affects combined totals — see root
  AGENTS.md for the full rule.
