# CLAUDE.md

This project's architecture, folder structure, data model, and roadmap are documented
in **[AGENTS.md](./AGENTS.md)** — read that first, it's the canonical reference.

## Commands

```bash
npm install                       # install deps
cp .env.example .env              # then fill in DATABASE_URL
npx prisma migrate dev --name X   # after any schema.prisma change
npx prisma studio                 # visual DB browser
npm run dev                       # local dev server
npm run build                     # production build (also runs prisma generate)
```

## Working conventions in this repo

- Never put Prisma queries or business logic directly in `app/`. Follow the feature
  module pattern in AGENTS.md: `features/<name>/server/` (DB), `features/<name>/lib/`
  (pure logic), `features/<name>/components/` (UI). `app/` is routing glue only.
- Validate all API route input with `zod` before touching the database.
- Every Prisma model is `userId`-scoped, even though auth isn't wired up yet
  (see `lib/demoUser.ts`). Keep it that way for every new model.
- Use the existing Tailwind design tokens (`ink`, `paper`, `ledger`, `line`, `moss`,
  `moss2`, `signal`, `gain`) — don't introduce new colors ad hoc.
- The Split (Splitwise-style) module must stay isolated: no foreign keys from
  `SplitGroup`/`SplitExpense`/etc. into `Transaction`, `Budget`, or `Category`. Only
  aggregate summary numbers (e.g. net amount owed) may surface in the dashboard.
- After changing `prisma/schema.prisma`, always run `npx prisma migrate dev` before
  writing code that depends on the new fields.
