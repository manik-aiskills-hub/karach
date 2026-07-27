"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { CurrencyCode } from "@/lib/currency";

type Prefs = {
  isDark: boolean;
  toggleDark: () => void;
  hideAmounts: boolean;
  toggleHideAmounts: () => void;
  homeCurrency: CurrencyCode;
  cycleHomeCurrency: () => void;
};

const PrefsContext = createContext<Prefs | null>(null);

const CODES: CurrencyCode[] = ["USD", "EUR", "INR"];

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside <PreferencesProvider>");
  return ctx;
}

// NOTE: These are client-only for now (no persistence across sessions/devices).
// The User model already has darkMode/hideAmounts/homeCurrency columns ready
// for when this is wired to a "save my preferences" API call after auth lands.
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [homeIndex, setHomeIndex] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const value: Prefs = {
    isDark,
    toggleDark: () => setIsDark((v) => !v),
    hideAmounts,
    toggleHideAmounts: () => setHideAmounts((v) => !v),
    homeCurrency: CODES[homeIndex],
    cycleHomeCurrency: () => setHomeIndex((i) => (i + 1) % CODES.length),
  };

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}
