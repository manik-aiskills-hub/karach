import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Each maps to an RGB triple CSS variable so toggling the `.dark`
        // class on <html> re-themes every existing bg-*/text-*/border-*
        // utility automatically — no need to add dark: variants everywhere.
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        ledger: "rgb(var(--color-ledger) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        moss: "rgb(var(--color-moss) / <alpha-value>)",
        moss2: "rgb(var(--color-moss2) / <alpha-value>)",
        signal: "rgb(var(--color-signal) / <alpha-value>)",
        gain: "rgb(var(--color-gain) / <alpha-value>)",
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};
export default config;
