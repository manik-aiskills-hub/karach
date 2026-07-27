import React, { useMemo, useState } from "react";
import { View, Text, Alert } from "react-native";
import {
  Card, StatCard, Row, Field, Button, ChipPicker, Mono, ProgressBar, Divider, Empty,
} from "../components/ui";
import { useStore } from "../state/store";
import { CurrencyCode, CURRENCIES, fmtRaw, fmtHome } from "../lib/currency";
import { calculatePayoffPlan, DebtInput } from "../lib/payoff";
import { spacing } from "../theme";

export default function LoansSection() {
  const s = useStore();

  const [direction, setDirection] = useState<"TAKEN" | "GIVEN">("TAKEN");
  const [counterparty, setCounterparty] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [principal, setPrincipal] = useState("");
  const [rate, setRate] = useState("");
  const [minPay, setMinPay] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const [extra, setExtra] = useState("200");
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");

  const withBalance = s.loans.map((l) => ({ ...l, balance: Math.max(0, l.principal - l.paid) }));
  const taken = withBalance.filter((l) => l.direction === "TAKEN" && l.balance > 0);
  const given = withBalance.filter((l) => l.direction === "GIVEN" && l.balance > 0);

  const owedByMe = taken.reduce((sum, l) => sum + s.toHome(l.balance, l.currency), 0);
  const owedToMe = given.reduce((sum, l) => sum + s.toHome(l.balance, l.currency), 0);

  // Payoff comparison needs one common unit — convert to home currency for this calc only.
  const plan = useMemo(() => {
    const debts: DebtInput[] = taken.map((l) => ({
      id: l.id,
      name: l.counterparty,
      balance: s.toHome(l.balance, l.currency),
      interestRate: l.interestRate,
      minPayment: s.toHome(l.minPayment || 0, l.currency),
    }));
    return calculatePayoffPlan(debts, parseFloat(extra) || 0, strategy);
  }, [s.loans, s.home, extra, strategy]);

  function submit() {
    const p = parseFloat(principal);
    if (!counterparty.trim() || isNaN(p) || p <= 0) {
      Alert.alert("Missing info", "Enter a name and a positive principal amount.");
      return;
    }
    s.addLoan({
      direction,
      counterparty: counterparty.trim(),
      currency,
      principal: p,
      interestRate: parseFloat(rate) || 0,
      minPayment: parseFloat(minPay) || 0,
    });
    setCounterparty(""); setPrincipal(""); setRate(""); setMinPay("");
    setFormOpen(false);
  }

  function pay(id: string, currencyCode: CurrencyCode) {
    Alert.prompt?.(
      "Record payment",
      `Amount in ${currencyCode}`,
      (text) => {
        const amt = parseFloat(text);
        if (!isNaN(amt) && amt > 0) s.recordLoanPayment(id, amt);
      },
      "plain-text",
      "",
      "decimal-pad"
    );
  }

  return (
    <View>
      <Row>
        <StatCard label="You owe" value={fmtHome(owedByMe, s.home, s.hidden)} color={s.palette.signal} />
        <StatCard label="Owed to you" value={fmtHome(owedToMe, s.home, s.hidden)} color={s.palette.gain} />
      </Row>

      <View style={{ height: spacing.lg }} />

      <Button
        title={formOpen ? "Cancel" : "+ Add loan"}
        variant={formOpen ? "outline" : "primary"}
        onPress={() => setFormOpen((v) => !v)}
      />

      {formOpen ? (
        <Card>
          <ChipPicker
            label="Direction"
            value={direction}
            onChange={setDirection}
            options={[
              { value: "TAKEN", label: "I borrowed" },
              { value: "GIVEN", label: "I lent" },
            ]}
          />
          <Field
            label={direction === "GIVEN" ? "Borrower" : "Lender"}
            value={counterparty}
            onChangeText={setCounterparty}
            placeholder={direction === "GIVEN" ? "e.g. Sam" : "e.g. HDFC Bank"}
          />
          <ChipPicker
            label="Currency"
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} ${c.symbol}` }))}
          />
          <Field label="Principal" value={principal} onChangeText={setPrincipal} placeholder="0.00" keyboardType="decimal-pad" />
          <Field label="Annual interest %" value={rate} onChangeText={setRate} placeholder="0" keyboardType="decimal-pad" />
          <Field label="Monthly minimum" value={minPay} onChangeText={setMinPay} placeholder="0.00" keyboardType="decimal-pad" />
          <Button title="Save loan" onPress={submit} />
        </Card>
      ) : null}

      <Divider />

      {withBalance.length === 0 ? <Empty text="No loans yet." /> : null}

      {withBalance.map((l) => {
        const pct = l.principal > 0 ? Math.round((l.paid / l.principal) * 100) : 0;
        return (
          <Card key={l.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: s.palette.ink, flex: 1 }}>
                {l.counterparty}
              </Text>
              <Text style={{ fontSize: 14, color: s.palette.muted }}>
                {fmtRaw(l.balance, l.currency, s.hidden)} left
              </Text>
            </View>
            <Mono style={{ marginTop: 4 }}>
              {l.direction === "TAKEN" ? "borrowed" : "lent"} · {l.currency} · {l.interestRate}% APR
            </Mono>
            <ProgressBar pct={pct} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm }}>
              <Mono>{pct}% paid off</Mono>
              <Text
                onPress={() => pay(l.id, l.currency)}
                style={{ color: s.palette.moss2, fontSize: 12, fontWeight: "600" }}
              >
                Record payment
              </Text>
            </View>
          </Card>
        );
      })}

      {taken.length > 0 ? (
        <>
          <Divider />
          <Text style={{ fontSize: 20, fontWeight: "700", color: s.palette.ink, marginBottom: 4 }}>
            Repay them fast
          </Text>
          <Text style={{ fontSize: 13, color: s.palette.muted, marginBottom: spacing.md, lineHeight: 19 }}>
            Shown in {s.home} so debts in different currencies can be compared directly.
          </Text>

          <Field
            label={`Extra monthly payment (${s.home})`}
            value={extra}
            onChangeText={setExtra}
            keyboardType="decimal-pad"
          />
          <ChipPicker
            value={strategy}
            onChange={setStrategy}
            options={[
              { value: "avalanche", label: "Avalanche (cheapest)" },
              { value: "snowball", label: "Snowball (fastest wins)" },
            ]}
          />

          <Card>
            <Mono>
              DEBT-FREE IN {plan.totalMonths} MONTH{plan.totalMonths === 1 ? "" : "S"} · TOTAL INTEREST{" "}
              {fmtHome(plan.totalInterestPaid, s.home, s.hidden)}
            </Mono>
            <View style={{ marginTop: spacing.md }}>
              {plan.entries.map((e, i) => (
                <View
                  key={e.id}
                  style={{
                    paddingVertical: 8,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: s.palette.line,
                  }}
                >
                  <Text style={{ color: s.palette.ink, fontSize: 14 }}>
                    <Text style={{ color: s.palette.moss2, fontWeight: "700" }}>#{e.order} </Text>
                    {e.name}
                  </Text>
                  <Mono style={{ marginTop: 2 }}>
                    paid off month {e.payoffMonth} · {fmtHome(e.totalInterestPaid, s.home, s.hidden)} interest
                  </Mono>
                </View>
              ))}
            </View>
          </Card>
        </>
      ) : null}
    </View>
  );
}
