import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Card, Field, Button, ChipPicker, Mono, Divider, Empty } from "../components/ui";
import { useStore, SplitGroup } from "../state/store";
import { CurrencyCode, CURRENCIES, fmtRaw, fmtHome } from "../lib/currency";
import { spacing, radius } from "../theme";

export default function SplitSection() {
  const s = useStore();
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const group = s.groups.find((g) => g.id === openGroupId) ?? null;
  return group ? (
    <GroupDetail group={group} onBack={() => setOpenGroupId(null)} />
  ) : (
    <GroupList onOpen={setOpenGroupId} />
  );
}

function GroupList({ onOpen }: { onOpen: (id: string) => void }) {
  const s = useStore();
  const [name, setName] = useState("");
  const [friend, setFriend] = useState("");
  const [type, setType] = useState<"GROUP" | "DIRECT">("GROUP");
  const [formOpen, setFormOpen] = useState(false);

  function create() {
    if (!name.trim() || !friend.trim()) {
      Alert.alert("Missing info", "Enter a name for the split and the other person's name.");
      return;
    }
    const id = s.addSplitGroup(name.trim(), friend.trim(), type);
    setName(""); setFriend(""); setFormOpen(false);
    onOpen(id);
  }

  return (
    <View>
      <Text style={{ fontSize: 13, color: s.palette.muted, marginBottom: spacing.lg, lineHeight: 19 }}>
        A <Text style={{ fontWeight: "700", color: s.palette.ink }}>Group</Text> starts as you + 1 and can
        grow. A <Text style={{ fontWeight: "700", color: s.palette.ink }}>Direct</Text> split is you and one
        person, fixed — no one else can be added.
      </Text>

      {s.groups.length === 0 ? <Empty text="No splits yet." /> : null}

      {s.groups.map((g) => {
        const bal = s.splitBalances(g)["me"] ?? 0;
        const settled = Math.abs(bal) < 0.01;
        const others = g.members.filter((m) => m.id !== "me").map((m) => m.name).join(", ");
        return (
          <TouchableOpacity key={g.id} onPress={() => onOpen(g.id)} activeOpacity={0.7}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: s.palette.ink, flex: 1 }}>
                  {g.name}
                </Text>
                <Text style={{
                  fontSize: 13, fontWeight: "600",
                  color: settled ? s.palette.muted : bal > 0 ? s.palette.gain : s.palette.signal,
                }}>
                  {settled
                    ? "settled up"
                    : bal > 0
                      ? `owed ${fmtHome(bal, s.home, s.hidden)}`
                      : `you owe ${fmtHome(Math.abs(bal), s.home, s.hidden)}`}
                </Text>
              </View>
              <Mono style={{ marginTop: 4 }}>
                {g.type === "DIRECT" ? "direct" : "group"} · with {others}
              </Mono>
            </Card>
          </TouchableOpacity>
        );
      })}

      <Divider />

      <Button
        title={formOpen ? "Cancel" : "+ Start a new split"}
        variant={formOpen ? "outline" : "primary"}
        onPress={() => setFormOpen((v) => !v)}
      />

      {formOpen ? (
        <Card>
          <Field label="Split name" value={name} onChangeText={setName} placeholder="e.g. Roommates" />
          <Field label="Their name (the +1)" value={friend} onChangeText={setFriend} placeholder="e.g. Jordan" />
          <ChipPicker
            label="Type"
            value={type}
            onChange={setType}
            options={[
              { value: "GROUP", label: "Group (can add more)" },
              { value: "DIRECT", label: "Direct (just us two)" },
            ]}
          />
          <Button title="Create split" onPress={create} />
        </Card>
      ) : null}
    </View>
  );
}

function GroupDetail({ group, onBack }: { group: SplitGroup; onBack: () => void }) {
  const s = useStore();
  const bal = s.splitBalances(group);

  const [desc, setDesc] = useState("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState(group.members[0]?.id ?? "me");
  const [newMember, setNewMember] = useState("");

  function addExpense() {
    const amt = parseFloat(amount);
    if (!desc.trim() || isNaN(amt) || amt <= 0) {
      Alert.alert("Missing info", "Enter a description and a positive amount.");
      return;
    }
    s.addSplitExpense({ groupId: group.id, description: desc.trim(), amount: amt, currency, paidById });
    setDesc(""); setAmount("");
  }

  const expenses = s.splitExpenses
    .filter((e) => e.groupId === group.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: spacing.md }}>
        <Text style={{ color: s.palette.moss2, fontSize: 14, fontWeight: "600" }}>← All splits</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 24, fontWeight: "700", color: s.palette.ink }}>{group.name}</Text>
      <Mono style={{ marginTop: 4, marginBottom: spacing.lg }}>
        {group.type === "DIRECT" ? "DIRECT · FIXED AT TWO PEOPLE" : "GROUP · CAN ADD PEOPLE"} · BALANCES IN {s.home}
      </Mono>

      {/* Members + balances */}
      {group.members.map((m) => {
        const v = bal[m.id] ?? 0;
        const settled = Math.abs(v) < 0.01;
        return (
          <Card key={m.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: s.palette.ink }}>
                {m.name}{m.id === "me" ? " (you)" : ""}
              </Text>
              <Text style={{
                fontSize: 13, fontWeight: "600",
                color: settled ? s.palette.muted : v > 0 ? s.palette.gain : s.palette.signal,
              }}>
                {settled
                  ? "settled up"
                  : v > 0
                    ? `is owed ${fmtHome(v, s.home, s.hidden)}`
                    : `owes ${fmtHome(Math.abs(v), s.home, s.hidden)}`}
              </Text>
            </View>
          </Card>
        );
      })}

      {group.type === "GROUP" ? (
        <Card>
          <Field label="Add a person" value={newMember} onChangeText={setNewMember} placeholder="e.g. Jordan" />
          <Button
            title="Add to group"
            variant="dark"
            onPress={() => {
              if (!newMember.trim()) return;
              s.addSplitMember(group.id, newMember.trim());
              setNewMember("");
            }}
          />
        </Card>
      ) : (
        <Mono style={{ marginBottom: spacing.lg }}>
          Direct split — fixed at two people, no one else can be added.
        </Mono>
      )}

      <Divider />

      <Text style={{ fontSize: 18, fontWeight: "700", color: s.palette.ink, marginBottom: spacing.md }}>
        Add an expense
      </Text>
      <Card>
        <Field label="Description" value={desc} onChangeText={setDesc} placeholder="e.g. Dinner" />
        <ChipPicker
          label="Currency"
          value={currency}
          onChange={setCurrency}
          options={CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} ${c.symbol}` }))}
        />
        <Field label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
        <ChipPicker
          label="Paid by"
          value={paidById}
          onChange={setPaidById}
          options={group.members.map((m) => ({ value: m.id, label: m.name }))}
        />
        <Button title="Add & split equally" onPress={addExpense} />
      </Card>

      {expenses.length === 0 ? <Empty text="No expenses in this split yet." /> : null}

      {expenses.map((e) => {
        const payer = group.members.find((m) => m.id === e.paidById);
        return (
          <Card key={e.id}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
              <Text style={{ fontSize: 15, color: s.palette.ink, flex: 1 }}>{e.description}</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: s.palette.ink }}>
                {fmtRaw(e.amount, e.currency, s.hidden)}
              </Text>
            </View>
            <Mono style={{ marginTop: 4 }}>
              {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · paid by{" "}
              {payer?.name ?? "—"} · {e.currency}
            </Mono>
          </Card>
        );
      })}
    </View>
  );
}
