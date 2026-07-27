import React from "react";
import { View, Text } from "react-native";
import { Screen, StatCard, Card, Row } from "../../src/components/ui";
import { useStore } from "../../src/state/store";
import { fmtHome } from "../../src/lib/currency";
import { spacing } from "../../src/theme";

export default function Overview() {
  const s = useStore();
  const nw = s.netWorth();
  const monthSpent = s.categories.reduce((sum, c) => sum + s.monthSpentForCategory(c.id), 0);

  const owedByMe = s.loans
    .filter((l) => l.direction === "TAKEN")
    .reduce((sum, l) => sum + s.toHome(Math.max(0, l.principal - l.paid), l.currency), 0);
  const owedToMe = s.loans
    .filter((l) => l.direction === "GIVEN")
    .reduce((sum, l) => sum + s.toHome(Math.max(0, l.principal - l.paid), l.currency), 0);

  const splitNet = s.groups.reduce((sum, g) => sum + (s.splitBalances(g)["me"] ?? 0), 0);

  const f = (v: number) => fmtHome(v, s.home, s.hidden);

  return (
    <Screen
      eyebrow="Overview"
      title="Welcome back"
      subtitle={`Totals convert to your home currency (${s.home}). Each individual item still shows the currency it was entered in.`}
    >
      <Row>
        <StatCard label="Net worth" value={f(nw.net)} />
        <StatCard label="Spent this month" value={f(monthSpent)} />
      </Row>
      <View style={{ height: spacing.md }} />
      <Row>
        <StatCard label="You owe (loans)" value={f(owedByMe)} color={s.palette.signal} />
        <StatCard label="Owed to you" value={f(owedToMe)} color={s.palette.gain} />
      </Row>
      <View style={{ height: spacing.md }} />
      <Row>
        <StatCard
          label="Split net (all)"
          value={f(splitNet)}
          color={splitNet >= 0 ? s.palette.gain : s.palette.signal}
        />
      </Row>

      <View style={{ height: spacing.lg }} />
      <Card>
        <Text style={{ fontSize: 17, fontWeight: "600", color: s.palette.ink }}>Where things live</Text>
        <Text style={{ fontSize: 14, color: s.palette.muted, marginTop: 6, lineHeight: 20 }}>
          <Text style={{ fontWeight: "600", color: s.palette.ink }}>Accounts</Text> = what you have.{" "}
          <Text style={{ fontWeight: "600", color: s.palette.ink }}>Budgets</Text> = the plan.{" "}
          <Text style={{ fontWeight: "600", color: s.palette.ink }}>Log</Text> = day-to-day spending.
          Budgets always reflects your logged transactions automatically.
        </Text>
      </Card>

      <Card>
        <Text style={{ fontSize: 17, fontWeight: "600", color: s.palette.ink }}>Toolbar</Text>
        <Text style={{ fontSize: 14, color: s.palette.muted, marginTop: 6, lineHeight: 20 }}>
          ☾ / ☀ switches dark mode · ◉ / ◎ hides all amounts · the currency chip sets your home
          currency for combined totals. All three appear on every screen.
        </Text>
      </Card>
    </Screen>
  );
}
