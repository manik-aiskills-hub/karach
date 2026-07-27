"use client";

import { usePrefs } from "./PreferencesProvider";
import { currencyObj } from "@/lib/currency";

export default function Toolbar() {
  const { isDark, toggleDark, hideAmounts, toggleHideAmounts, homeCurrency, cycleHomeCurrency } = usePrefs();
  const c = currencyObj(homeCurrency);

  return (
    <div className="mb-8 flex gap-2">
      <button
        onClick={toggleDark}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="flex h-9 w-9 items-center justify-center rounded border border-line bg-ledger text-ink hover:bg-moss/10"
      >
        {isDark ? "☀" : "☾"}
      </button>
      <button
        onClick={toggleHideAmounts}
        title={hideAmounts ? "Show amounts" : "Hide amounts"}
        className="flex h-9 w-9 items-center justify-center rounded border border-line bg-ledger text-ink hover:bg-moss/10"
      >
        {hideAmounts ? "◎" : "◉"}
      </button>
      <button
        onClick={cycleHomeCurrency}
        title="Home currency for combined totals (each item still shows the currency it was entered in)"
        className="flex h-9 items-center justify-center gap-1 rounded border border-line bg-ledger px-3 font-mono text-xs text-ink hover:bg-moss/10"
      >
        {c.symbol} {c.code}
      </button>
    </div>
  );
}
