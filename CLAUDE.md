# CLAUDE.md

Architecture, structure, and conventions are documented in **[AGENTS.md](./AGENTS.md)** — read
that first. Each app also has its own doc: `web-app/AGENTS.md` and `ios-app/README.md`.

## Commands (run from this root directory)

```bash
pnpm install                  # installs everything for both apps in one go

pnpm web                      # runs the Next.js dev server
pnpm ios                      # runs Expo (scan the QR code with your iPhone)

pnpm typecheck:web            # tsc --noEmit for web-app
pnpm typecheck:ios            # tsc --noEmit for ios-app
```

Always use **pnpm**, never npm or yarn, in this repo.

## Working conventions

- Shared, framework-free logic goes in `app-logic/`, not duplicated between `web-app` and
  `ios-app`. See AGENTS.md → "Why a shared app-logic package" before adding new business logic
  that both apps might need.
- Inside `web-app`, follow its own feature-module pattern (`features/<name>/server|lib|components`)
  — documented in `web-app/AGENTS.md`.
- Every amount is entered and displayed in its own currency; conversion only happens for combined
  totals via the home-currency toolbar setting. Don't add a feature that silently converts an
  individual line item's displayed currency.
- Dark mode is true black (`#000000`) / white text — don't reintroduce a tinted dark palette.
- After changing `web-app/prisma/schema.prisma`, run `npx prisma migrate dev` inside `web-app/`
  before writing code against the new fields.
