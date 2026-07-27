import React, { useMemo, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { Card, ChipPicker, Mono, Divider, Empty } from "../components/ui";
import { useStore } from "../state/store";
import { fmtHome } from "../lib/currency";
import { spacing, radius } from "../theme";

type Period = "monthly" | "quarterly" | "yearly";

export default function ReportsSection() {
  const s = useStore();
  const [period, setPeriod] = useState<Period>("monthly");

  const isExpense = (t: (typeof s.transactions)[number]) =>
    !t.isTransfer && t.direction !== "CREDIT";

  const buckets = useMemo(() => {
    const map: Record<string, { total: number; order: number }> = {};
    s.transactions.filter(isExpense).forEach((t) => {
      const d = new Date(t.date);
      const amt = s.toHome(t.amount, t.currency);
      let key: string;
      if (period === "monthly") {
        key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      } else if (period === "quarterly") {
        key = `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
      } else {
        key = String(d.getFullYear());
      }
      if (!map[key]) map[key] = { total: 0, order: d.getTime() };
      map[key].total += amt;
      map[key].order = Math.max(map[key].order, d.getTime());
    });
    return Object.entries(map)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([label, v]) => ({ label, total: v.total }));
  }, [s.transactions, s.home, period]);

  const catTotals = useMemo(() => {
    const map: Record<string, number> = {};
    s.categories.forEach((c) => (map[c.id] = 0));
    s.transactions.filter(isExpense).forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] ?? 0) + s.toHome(t.amount, t.currency);
    });
    return s.categories
      .map((c) => ({ name: c.name, total: map[c.id] ?? 0 }))
      .sort((a, b) => b.total - a.total);
  }, [s.transactions, s.categories, s.home]);

  const maxBucket = Math.max(1, ...buckets.map((b) => b.total));
  const maxCat = Math.max(1, ...catTotals.map((c) => c.total));

  if (s.hidden) {
    return (
      <View>
        <ChipPicker
          value={period}
          onChange={setPeriod}
          options={[
            { value: "monthly", label: "Monthly" },
            { value: "quarterly", label: "Quarterly" },
            { value: "yearly", label: "Yearly" },
          ]}
        />
        <Empty text="Amounts are hidden — tap the ◎ icon to show charts." />
      </View>
    );
  }

  return (
    <View>
      <Text style={{ fontSize: 13, color: s.palette.muted, marginBottom: spacing.md, lineHeight: 19 }}>
        Built from 18 months of seeded history, converted to {s.home} so periods are comparable.
      </Text>

      <ChipPicker
        value={period}
        onChange={setPeriod}
        options={[
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "yearly", label: "Yearly" },
        ]}
      />

      {buckets.length === 0 ? <Empty text="No spending data yet." /> : null}

      {/* Vertical bar chart, horizontally scrollable for monthly */}
      {buckets.length > 0 ? (
        <Card>
          <Mono style={{ marginBottom: spacing.md }}>SPEND PER PERIOD</Mono>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 10, height: 160 }}>
              {buckets.map((b) => (
                <View key={b.label} style={{ alignItems: "center", width: 46 }}>
                  <Text style={{ fontSize: 9, color: s.palette.muted, marginBottom: 4 }}>
                    {Math.round(b.total)}
                  </Text>
                  <View
                    style={{
                      width: 26,
                      height: Math.max(4, (b.total / maxBucket) * 110),
                      backgroundColor: s.palette.moss,
                      borderRadius: radius.sm,
                    }}
                  />
                  <Text style={{ fontSize: 9, color: s.palette.muted, marginTop: 6 }} numberOfLines={1}>
                    {b.label}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </Card>
      ) : null}

      <Divider />

      <Text style={{ fontSize: 18, fontWeight: "700", color: s.palette.ink, marginBottom: spacing.md }}>
        Category breakdown
      </Text>
      <Card>
        {catTotals.map((c) => (
          <View key={c.name} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
              <Text style={{ color: s.palette.ink, fontSize: 13 }}>{c.name}</Text>
              <Text style={{ color: s.palette.muted, fontSize: 13 }}>
                {fmtHome(c.total, s.home, s.hidden)}
              </Text>
            </View>
            <View style={{ height: 6, backgroundColor: s.palette.line, borderRadius: radius.pill, overflow: "hidden" }}>
              <View style={{
                height: "100%",
                width: `${(c.total / maxCat) * 100}%`,
                backgroundColor: s.palette.moss,
              }} />
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}
