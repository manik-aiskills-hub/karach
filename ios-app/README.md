# Kharch — iOS App (Expo / React Native)

The mobile version of the Kharch finance app. Same feature set and design language as the web
prototype: Accounts, Budgets, Transactions, Loans (with repayment accelerator), Split, and Reports.

## Why Expo rather than native Swift

| | Expo (this) | Native Swift/SwiftUI |
|---|---|---|
| Mac required to run? | **No** — test on your iPhone via Expo Go | Yes, Xcode only runs on macOS |
| Language | TypeScript (same as your Next.js app) | Swift |
| Ship to App Store | Yes, via EAS Build (cloud, no Mac needed) | Requires Mac |
| Shares code/API with your web app | Yes | No |

If you later want a fully native app, this codebase still gives you a working product to validate
the design first.

## Run it on your iPhone (no Mac needed)

1. Install **Expo Go** from the iOS App Store on your iPhone.
2. On your computer:
   ```bash
   cd kharch-mobile
   pnpm install
   pnpm expo start
   ```
3. A QR code appears in the terminal. Open the **Camera** app on your iPhone and point it at the QR
   code, then tap the banner to open in Expo Go.
4. Your phone and computer must be on the same Wi-Fi network. If that fails, run
   `pnpm expo start --tunnel` instead.

## Run in the iOS Simulator (Mac only)

```bash
pnpm expo start --ios
```

## Build a real installable app (later)

```bash
pnpm add -g eas-cli
eas login
eas build --platform ios
```
EAS builds in the cloud, so this works from Windows/Linux too. You'll need an Apple Developer
account ($99/yr) to install on a physical device outside Expo Go or to ship to the App Store.

## Structure

```
app/                      expo-router file-based routes
  _layout.tsx             root — wraps everything in StoreProvider
  (tabs)/
    _layout.tsx           bottom tab bar
    index.tsx             Overview
    accounts.tsx          Accounts (details, copy buttons, password reveal)
    transactions.tsx      Transaction log
    budgets.tsx           Budgets
    more.tsx              Loans / Split / Reports switcher

src/
  theme.ts                light + true-black dark palettes
  lib/currency.ts         per-item currency, conversion only for combined totals
  lib/payoff.ts           avalanche/snowball simulator (pure, testable)
  state/store.tsx         all app state + actions + derived selectors
  components/ui.tsx       themed primitives (Screen, Card, Field, ChipPicker…)
  sections/               Loans, Split, Reports section components
```

Business logic lives in `src/`; `app/` is routing only — same separation as the web project's
`features/` convention (see the web repo's `AGENTS.md`).

## Design notes

- **Toolbar on every screen**: ☾/☀ dark mode · ◉/◎ hide amounts · currency chip (home currency).
- **Dark mode is true black** (`#000000`) with white text.
- **Currency**: every amount is entered *and displayed* in its own currency. Conversion happens only
  when summing across items (net worth, budgets, split balances) — those use your home currency.
- **Dropdowns replaced with chip pickers** — dropdowns are poor UX on mobile.
- Charts are drawn with plain `View`s, so there's no native chart dependency to configure.

## Known limits (prototype stage)

- **Data is in-memory only** — closing the app resets it. Next step is persistence
  (`expo-sqlite` or AsyncStorage) or wiring it to the Next.js API.
- **No authentication yet** — single implicit user, same as the web prototype.
- **Passwords are stored in plain memory.** A real build must use `expo-secure-store`
  (iOS Keychain). Do not ship as-is with real credentials.
- FX rates are fixed constants, not live.
- `Alert.prompt` (used for recording a loan payment) is iOS-only — it's a no-op on Android.
