// Cross-cutting utility: every amount in this app is entered and stored in its
// OWN currency (never silently converted for display). Conversion only happens
// when combining multiple items into one total (net worth, budget spend,
// report aggregates, split balances) — those use the user's home currency.
//
// This lives in lib/ rather than inside one feature because every feature that
// touches money (accounts, transactions, budgets, loans, split, reports) needs it.

export type CurrencyCode = "USD" | "EUR" | "INR";

export type Currency = {
  code: CurrencyCode;
  symbol: string;
  /** Fixed demo rate: units of this currency per 1 USD. Not live FX. */
  rate: number;
};

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", rate: 1 },
  { code: "EUR", symbol: "€", rate: 0.92 },
  { code: "INR", symbol: "₹", rate: 83.1 },
];

export function currencyObj(code: string | null | undefined): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function toUSD(amount: number, from: string | null | undefined): number {
  return amount / currencyObj(from).rate;
}

/** Convert an amount from one currency to another (via USD as the pivot). */
export function convertCurrency(
  amount: number,
  from: string | null | undefined,
  to: string | null | undefined
): number {
  return toUSD(amount, from) * currencyObj(to).rate;
}
/** Alias kept for call sites written against the shorter name. */
export const convert = convertCurrency;

/** Format a raw amount in ITS OWN currency — use for every individual line item. */
export function fmtRaw(amount: number, code: string | null | undefined, hidden = false): string {
  if (hidden) return "••••";
  return currencyObj(code).symbol + amount.toFixed(2);
}

/** Format a number already expressed in home-currency units — use only for combined totals. */
export function fmtHome(value: number, home: string, hidden = false): string {
  if (hidden) return "••••";
  return currencyObj(home).symbol + value.toFixed(2);
}
