import React, { useState } from "react";
import { Screen, ChipPicker } from "../../src/components/ui";
import LoansSection from "../../src/sections/LoansSection";
import SplitSection from "../../src/sections/SplitSection";
import ReportsSection from "../../src/sections/ReportsSection";

type Section = "loans" | "split" | "reports";

const titles: Record<Section, { title: string; eyebrow: string; subtitle: string }> = {
  loans: {
    eyebrow: "Debt",
    title: "Loans",
    subtitle: "Money you've borrowed and lent, plus a fast-payoff plan.",
  },
  split: {
    eyebrow: "Shared",
    title: "Split",
    subtitle: "Kept isolated from your personal budgets — only the net figure reaches Overview.",
  },
  reports: {
    eyebrow: "Insights",
    title: "Reports",
    subtitle: "Spending trends by month, quarter, and year.",
  },
};

export default function More() {
  const [section, setSection] = useState<Section>("loans");
  const meta = titles[section];

  return (
    <Screen eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle}>
      <ChipPicker
        value={section}
        onChange={setSection}
        options={[
          { value: "loans", label: "Loans" },
          { value: "split", label: "Split" },
          { value: "reports", label: "Reports" },
        ]}
      />
      {section === "loans" ? <LoansSection /> : null}
      {section === "split" ? <SplitSection /> : null}
      {section === "reports" ? <ReportsSection /> : null}
    </Screen>
  );
}
