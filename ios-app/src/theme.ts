export type Palette = {
  ink: string;      // primary text
  paper: string;    // screen background
  ledger: string;   // card background
  line: string;     // borders
  moss: string;     // brand / primary action
  moss2: string;    // brand emphasis
  signal: string;   // negative / liability / debit
  gain: string;     // positive / asset / credit
  muted: string;    // secondary text
};

export const lightPalette: Palette = {
  ink: "#10221A",
  paper: "#F5F3ED",
  ledger: "#E4E0D3",
  line: "#CFC9B8",
  moss: "#2F5D50",
  moss2: "#1E4038",
  signal: "#C9642B",
  gain: "#2F6B4F",
  muted: "rgba(16,34,26,0.55)",
};

// True black, white text — per spec, not a tinted dark green.
export const darkPalette: Palette = {
  ink: "#FFFFFF",
  paper: "#000000",
  ledger: "#141414",
  line: "#333333",
  moss: "#4CD3A5",
  moss2: "#7CE8C2",
  signal: "#FF9459",
  gain: "#5FE8A8",
  muted: "rgba(255,255,255,0.55)",
};

export const radius = { sm: 4, md: 8, pill: 999 };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// iOS system fonts — no custom font loading step required to run the app.
export const fonts = {
  display: undefined as string | undefined, // system, used at large sizes with weight
  mono: "Menlo",
};
