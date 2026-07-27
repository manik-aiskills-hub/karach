import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  Screen, Card, StatCard, Row, Field, Button, ChipPicker, Mono, Divider, Empty,
} from "../../src/components/ui";
import { useStore, ACCOUNT_TYPES, AccountType, Account } from "../../src/state/store";
import { CurrencyCode, CURRENCIES, fmtRaw, fmtHome } from "../../src/lib/currency";
import { spacing, radius } from "../../src/theme";

function DetailRow({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  const { palette } = useStore();
  if (!value) return null;
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", paddingVertical: 6,
      borderTopWidth: 1, borderTopColor: palette.line,
    }}>
      <Mono style={{ width: 96, fontSize: 10 }}>{label.toUpperCase()}</Mono>
      <Text style={{ flex: 1, color: palette.ink, fontSize: 13 }} numberOfLines={1}>{value}</Text>
      {copyable ? (
        <TouchableOpacity
          onPress={async () => {
            await Clipboard.setStringAsync(value);
            Alert.alert("Copied", `${label} copied to clipboard`);
          }}
          style={{
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm,
            borderWidth: 1, borderColor: palette.line,
          }}
        >
          <Text style={{ color: palette.moss2, fontSize: 11, fontWeight: "600" }}>Copy</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function SecretRow({ label, value }: { label: string; value: string }) {
  const { palette } = useStore();
  const [shown, setShown] = useState(false);
  if (!value) return null;
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", paddingVertical: 6,
      borderTopWidth: 1, borderTopColor: palette.line,
    }}>
      <Mono style={{ width: 96, fontSize: 10 }}>{label.toUpperCase()}</Mono>
      <Text style={{ flex: 1, color: palette.ink, fontSize: 13 }}>{shown ? value : "••••••••"}</Text>
      <TouchableOpacity
        onPress={() => setShown((v) => !v)}
        style={{
          paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm,
          borderWidth: 1, borderColor: palette.line,
        }}
      >
        <Text style={{ color: palette.moss2, fontSize: 11, fontWeight: "600" }}>{shown ? "Hide" : "Show"}</Text>
      </TouchableOpacity>
    </View>
  );
}

/** Copies name + number + IFSC together — the set you'd actually send someone. */
function ShareBlock({ account }: { account: Account }) {
  const { palette } = useStore();
  const parts = [
    `Name: ${account.name}`,
    account.number ? `Account number: ${account.number}` : "",
    account.ifsc ? `IFSC: ${account.ifsc}` : "",
  ].filter(Boolean);
  if (parts.length <= 1) return null;
  return (
    <TouchableOpacity
      onPress={async () => {
        await Clipboard.setStringAsync(parts.join("\n"));
        Alert.alert("Copied", "Name, number and IFSC copied — ready to send.");
      }}
      style={{
        marginTop: spacing.md, paddingVertical: 10, borderRadius: radius.sm,
        backgroundColor: palette.moss, alignItems: "center",
      }}
    >
      <Text style={{ color: palette.paper, fontWeight: "600", fontSize: 13 }}>
        Copy all payment details
      </Text>
    </TouchableOpacity>
  );
}

export default function Accounts() {
  const s = useStore();
  const nw = s.netWorth();

  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [balance, setBalance] = useState("");
  const [location, setLocation] = useState("");
  const [number, setNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [logPass, setLogPass] = useState("");
  const [tranPass, setTranPass] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  function submit() {
    const bal = parseFloat(balance);
    if (!name.trim() || isNaN(bal)) {
      Alert.alert("Missing info", "Account name and a numeric balance are required.");
      return;
    }
    s.addAccount({
      name: name.trim(), institution: institution.trim(), type, currency, balance: bal,
      location: location.trim(), number: number.trim(), ifsc: ifsc.trim(), logPass, tranPass,
    });
    setName(""); setInstitution(""); setBalance(""); setLocation("");
    setNumber(""); setIfsc(""); setLogPass(""); setTranPass("");
    setFormOpen(false);
  }

  return (
    <Screen
      eyebrow="What you have"
      title="Accounts"
      subtitle={`Each account shows its own currency. Net worth converts everything to ${s.home}.`}
    >
      <Row>
        <StatCard label="Assets" value={fmtHome(nw.assets, s.home, s.hidden)} color={s.palette.gain} />
        <StatCard label="Liabilities" value={fmtHome(nw.liabilities, s.home, s.hidden)} color={s.palette.signal} />
      </Row>
      <View style={{ height: spacing.md }} />
      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
          <Text style={{ fontSize: 17, fontWeight: "600", color: s.palette.ink }}>Net worth</Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: s.palette.ink }}>
            {fmtHome(nw.net, s.home, s.hidden)}
          </Text>
        </View>
      </Card>

      <Button
        title={formOpen ? "Cancel" : "+ Add account"}
        variant={formOpen ? "outline" : "dark"}
        onPress={() => setFormOpen((v) => !v)}
      />

      {formOpen ? (
        <Card>
          <Field label="Account name" value={name} onChangeText={setName} placeholder="e.g. Main Checking" />
          <Field label="Institution" value={institution} onChangeText={setInstitution} placeholder="e.g. HDFC Bank" />
          <ChipPicker
            label="Type"
            value={type}
            onChange={setType}
            options={ACCOUNT_TYPES.map((t) => ({ value: t.id, label: t.label }))}
          />
          <ChipPicker
            label="Currency"
            value={currency}
            onChange={setCurrency}
            options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} ${c.symbol}` }))}
          />
          <Field label="Balance" value={balance} onChangeText={setBalance} placeholder="0.00" keyboardType="decimal-pad" />
          <Field label="Location" value={location} onChangeText={setLocation} placeholder="e.g. Mumbai, India" />
          <Field label="Account number" value={number} onChangeText={setNumber} placeholder="e.g. 50100234567890" />
          <Field label="IFSC code" value={ifsc} onChangeText={setIfsc} placeholder="e.g. HDFC0001234" />
          <Field label="Login password" value={logPass} onChangeText={setLogPass} placeholder="••••••••" secure />
          <Field label="Transaction password" value={tranPass} onChangeText={setTranPass} placeholder="••••••••" secure />
          <Button title="Save account" onPress={submit} />
          <Mono style={{ fontSize: 10, lineHeight: 15 }}>
            Credit cards: enter the amount owed as a positive number — treated as a liability.
            Passwords are held in memory only in this prototype; a real build must encrypt them
            (iOS Keychain) and never store them in plain text.
          </Mono>
        </Card>
      ) : null}

      <Divider />

      {s.accounts.length === 0 ? <Empty text="No accounts yet." /> : null}

      {s.accounts.map((a) => {
        const kind = ACCOUNT_TYPES.find((t) => t.id === a.type);
        const isLiability = kind?.kind === "liability";
        return (
          <Card key={a.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: s.palette.ink, flex: 1 }}>
                {a.name}
              </Text>
              <Text style={{
                fontSize: 15, fontWeight: "600",
                color: isLiability ? s.palette.signal : s.palette.ink,
              }}>
                {isLiability ? "-" : ""}{fmtRaw(a.balance, a.currency, s.hidden)}
              </Text>
            </View>
            <Mono style={{ marginTop: 4 }}>
              {kind?.label} · {isLiability ? "liability" : "asset"} · {a.currency}
              {a.institution ? ` · ${a.institution}` : ""}
              {a.location ? ` · ${a.location}` : ""}
            </Mono>

            <View style={{ marginTop: spacing.md }}>
              <DetailRow label="Name" value={a.name} copyable />
              <DetailRow label="Number" value={a.number} copyable />
              <DetailRow label="IFSC" value={a.ifsc} copyable />
              <SecretRow label="Login pass" value={a.logPass} />
              <SecretRow label="Tran pass" value={a.tranPass} />
            </View>

            <ShareBlock account={a} />

            <TouchableOpacity onPress={() => s.removeAccount(a.id)} style={{ marginTop: spacing.md }}>
              <Text style={{ color: s.palette.signal, fontSize: 12 }}>Remove account</Text>
            </TouchableOpacity>
          </Card>
        );
      })}
    </Screen>
  );
}
