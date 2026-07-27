import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Screen, Card, Field, Button, ChipPicker, Mono, Divider, Empty } from "../../src/components/ui";
import { useStore } from "../../src/state/store";
import { CurrencyCode, CURRENCIES, fmtRaw } from "../../src/lib/currency";
import { spacing } from "../../src/theme";

export default function Transactions() {
  const s = useStore();

  const [categoryId, setCategoryId] = useState(s.categories[0]?.id ?? "");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [amount, setAmount] = useState("");
  const [direction, setDirection] = useState<"DEBIT" | "CREDIT">("DEBIT");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [note, setNote] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const accountOptions = [
    { value: "", label: "— none —" },
    ...s.accounts.map((a) => ({ value: a.id, label: a.name })),
  ];

  function submit() {
    const amt = parseFloat(amount);
    if (!categoryId || isNaN(amt) || amt <= 0) {
      Alert.alert("Missing info", "Pick a category and enter a positive amount.");
      return;
    }
    s.addTransaction({
      categoryId, amount: amt, currency, date: new Date().toISOString(),
      note: note.trim(), direction, fromAccountId, toAccountId,
    });
    setAmount(""); setNote(""); setFromAccountId(""); setToAccountId("");
    setFormOpen(false);
  }

  const recent = [...s.transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30);

  const accName = (id: string) => s.accounts.find((a) => a.id === id)?.name ?? "";

  const isTransferPreview = Boolean(fromAccountId) && Boolean(toAccountId);

  return (
    <Screen
      eyebrow="Day-to-day"
      title="Transactions"
      subtitle="Log spending in whatever currency it happened in. Filling both From and To makes it an internal transfer — excluded from budgets and reports."
    >
      <Button
        title={formOpen ? "Cancel" : "+ Log transaction"}
        variant={formOpen ? "outline" : "primary"}
        onPress={() => setFormOpen((v) => !v)}
      />

      {formOpen ? (
        <Card>
          <ChipPicker
            label="Category"
            value={categoryId}
            onChange={setCategoryId}
            options={s.categories.map((c) => ({ value: c.id, label: c.name }))}
          />
          <ChipPicker
            label="Currency"
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} ${c.symbol}` }))}
          />
          <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
          <ChipPicker
            label="Debit / Credit"
            value={direction}
            onChange={setDirection}
            options={[
              { value: "DEBIT", label: "Debit (out)" },
              { value: "CREDIT", label: "Credit (in)" },
            ]}
          />
          <ChipPicker label="From account" value={fromAccountId} onChange={setFromAccountId} options={accountOptions} />
          <ChipPicker label="To account" value={toAccountId} onChange={setToAccountId} options={accountOptions} />
          {isTransferPreview ? (
            <Mono style={{ color: s.palette.moss2, marginBottom: spacing.md }}>
              Both accounts set — this will be recorded as an internal transfer, not an expense.
            </Mono>
          ) : null}
          <Field label="Comments" value={note} onChangeText={setNote} placeholder="e.g. Trader Joe's" />
          <Button title="Save transaction" onPress={submit} />
        </Card>
      ) : null}

      <Divider />

      {recent.length === 0 ? <Empty text="No transactions yet." /> : null}

      {recent.map((t) => {
        const cat = s.categories.find((c) => c.id === t.categoryId);
        const d = new Date(t.date);
        const isDebit = t.direction === "DEBIT";
        return (
          <Card key={t.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: s.palette.ink, flex: 1 }}>
                {cat?.name ?? "Uncategorised"}
              </Text>
              <Text style={{
                fontSize: 15, fontWeight: "600",
                color: t.isTransfer ? s.palette.muted : isDebit ? s.palette.signal : s.palette.gain,
              }}>
                {fmtRaw(t.amount, t.currency, s.hidden)}
              </Text>
            </View>

            <Mono style={{ marginTop: 4 }}>
              {d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {"  ·  "}
              {t.isTransfer ? "TRANSFER" : isDebit ? "DEBIT" : "CREDIT"}
              {t.currency !== s.home ? `  ·  ${t.currency}` : ""}
            </Mono>

            {t.fromAccountId || t.toAccountId ? (
              <Mono style={{ marginTop: 2 }}>
                {t.fromAccountId ? `From ${accName(t.fromAccountId)}` : ""}
                {t.fromAccountId && t.toAccountId ? "  →  " : ""}
                {t.toAccountId ? `To ${accName(t.toAccountId)}` : ""}
              </Mono>
            ) : null}

            {t.note ? (
              <Text style={{ color: s.palette.muted, fontSize: 13, marginTop: 6 }}>{t.note}</Text>
            ) : null}

            <TouchableOpacity onPress={() => s.removeTransaction(t.id)} style={{ marginTop: spacing.md }}>
              <Text style={{ color: s.palette.signal, fontSize: 12 }}>Remove</Text>
            </TouchableOpacity>
          </Card>
        );
      })}

      <Mono style={{ marginTop: spacing.md }}>
        Showing the 30 most recent. Seed data includes 18 months of history used by Reports.
      </Mono>
    </Screen>
  );
}
