import React, { useState } from "react";
import { View, Text, Alert } from "react-native";
import {
  Screen, Card, Field, Button, ChipPicker, Mono, ProgressBar, Divider, Empty,
} from "../../src/components/ui";
import { useStore } from "../../src/state/store";
import { fmtHome } from "../../src/lib/currency";
import { spacing } from "../../src/theme";

export default function Budgets() {
  const s = useStore();
  const [newCat, setNewCat] = useState("");
  const [catId, setCatId] = useState(s.categories[0]?.id ?? "");
  const [limit, setLimit] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  function saveBudget() {
    const l = parseFloat(limit);
    if (!catId || isNaN(l) || l <= 0) {
      Alert.alert("Missing info", "Pick a category and enter a positive limit.");
      return;
    }
    s.setBudget(catId, l);
    setLimit("");
    setFormOpen(false);
  }

  function saveCategory() {
    if (!newCat.trim()) return;
    s.addCategory(newCat.trim());
    setNewCat("");
  }

  return (
    <Screen
      eyebrow={monthName}
      title="Budgets"
      subtitle={`The plan: a monthly limit per category. Spent is computed live from your logged transactions and shown in ${s.home}.`}
    >
      <Button
        title={formOpen ? "Cancel" : "+ Set a budget"}
        variant={formOpen ? "outline" : "primary"}
        onPress={() => setFormOpen((v) => !v)}
      />

      {formOpen ? (
        <Card>
          <ChipPicker
            label="Category"
            value={catId}
            onChange={setCatId}
            options={s.categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <Field
            label={`Monthly limit (${s.home})`}
            value={limit}
            onChangeText={setLimit}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
          <Button title="Save budget" onPress={saveBudget} />

          <Divider />
          <Field label="New category" value={newCat} onChangeText={setNewCat} placeholder="e.g. Subscriptions" />
          <Button title="Add category" variant="dark" onPress={saveCategory} />
        </Card>
      ) : null}

      <Divider />

      {s.budgets.length === 0 ? <Empty text="No budgets set for this month yet." /> : null}

      {s.budgets.map((b) => {
        const cat = s.categories.find((c) => c.id === b.categoryId);
        const spent = s.monthSpentForCategory(b.categoryId);
        const pct = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
        const remaining = b.limit - spent;
        const over = pct >= 100;
        return (
          <Card key={b.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: s.palette.ink }}>
                {cat?.name ?? "Unknown"}
              </Text>
              <Text style={{ fontSize: 14, color: s.palette.muted }}>
                {fmtHome(spent, s.home, s.hidden)} / {fmtHome(b.limit, s.home, s.hidden)}
              </Text>
            </View>
            <ProgressBar pct={pct} color={over ? s.palette.signal : s.palette.moss} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm }}>
              <Mono>{pct}% used</Mono>
              <Mono style={{ color: over ? s.palette.signal : s.palette.muted }}>
                {remaining >= 0
                  ? `${fmtHome(remaining, s.home, s.hidden)} left`
                  : `${fmtHome(Math.abs(remaining), s.home, s.hidden)} over`}
              </Mono>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}
