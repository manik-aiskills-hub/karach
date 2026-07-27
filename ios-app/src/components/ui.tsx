import React from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ViewStyle, TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from "../state/store";
import { spacing, radius, fonts } from "../theme";

export function Screen({ title, eyebrow, subtitle, children }: {
  title: string; eyebrow?: string; subtitle?: string; children: React.ReactNode;
}) {
  const { palette, isDark, toggleDark, hidden, toggleHidden, home, cycleHome } = useStore();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.paper }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl * 2 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Persistent toolbar — present on every screen */}
        <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
          <IconButton label={isDark ? "☀" : "☾"} onPress={toggleDark} />
          <IconButton label={hidden ? "◎" : "◉"} onPress={toggleHidden} />
          <IconButton label={home} onPress={cycleHome} wide />
        </View>

        {eyebrow ? <Text style={[styles.eyebrow, { color: palette.moss2 }]}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={[styles.title, { color: palette.ink }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: palette.muted }]}>{subtitle}</Text> : null}
        <View style={{ marginTop: spacing.lg }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function IconButton({ label, onPress, wide }: { label: string; onPress: () => void; wide?: boolean }) {
  const { palette } = useStore();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        minWidth: wide ? 56 : 38, height: 38, borderRadius: radius.sm,
        borderWidth: 1, borderColor: palette.line, backgroundColor: palette.ledger,
        alignItems: "center", justifyContent: "center", paddingHorizontal: wide ? 10 : 0,
      }}
    >
      <Text style={{ color: palette.ink, fontSize: wide ? 13 : 16, fontFamily: wide ? fonts.mono : undefined }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { palette } = useStore();
  return (
    <View style={[{
      backgroundColor: palette.ledger, borderColor: palette.line, borderWidth: 1,
      borderRadius: radius.sm, padding: spacing.lg, marginBottom: spacing.md,
    }, style]}>
      {children}
    </View>
  );
}

export function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  const { palette } = useStore();
  return (
    <View style={{
      flex: 1, minWidth: "45%", backgroundColor: palette.ledger, borderColor: palette.line,
      borderWidth: 1, borderRadius: radius.sm, padding: spacing.md,
    }}>
      <Text style={[styles.statLabel, { color: palette.muted }]}>{label.toUpperCase()}</Text>
      <Text style={{ fontSize: 22, fontWeight: "600", marginTop: 4, color: color ?? palette.ink }}>
        {value}
      </Text>
    </View>
  );
}

export function ProgressBar({ pct, color }: { pct: number; color?: string }) {
  const { palette } = useStore();
  return (
    <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: palette.line, overflow: "hidden", marginTop: spacing.md }}>
      <View style={{ height: "100%", width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color ?? palette.moss }} />
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, secure }: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; keyboardType?: "default" | "numeric" | "decimal-pad"; secure?: boolean;
}) {
  const { palette } = useStore();
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[styles.fieldLabel, { color: palette.muted }]}>{label.toUpperCase()}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        keyboardType={keyboardType ?? "default"}
        secureTextEntry={secure}
        autoCapitalize="none"
        style={{
          borderWidth: 1, borderColor: palette.line, borderRadius: radius.sm,
          backgroundColor: palette.paper, color: palette.ink,
          paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 15,
        }}
      />
    </View>
  );
}

/** Horizontal chip picker — replaces dropdowns, far better on mobile. */
export function ChipPicker<T extends string>({ label, options, value, onChange }: {
  label?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { palette } = useStore();
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={[styles.fieldLabel, { color: palette.muted }]}>{label.toUpperCase()}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <TouchableOpacity
                key={o.value}
                onPress={() => onChange(o.value)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill,
                  backgroundColor: active ? palette.moss : palette.ledger,
                  borderWidth: 1, borderColor: active ? palette.moss : palette.line,
                }}
              >
                <Text style={{ color: active ? palette.paper : palette.muted, fontSize: 13, fontWeight: active ? "600" : "400" }}>
                  {o.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

export function Button({ title, onPress, variant }: {
  title: string; onPress: () => void; variant?: "primary" | "dark" | "outline";
}) {
  const { palette } = useStore();
  const v = variant ?? "primary";
  const bg = v === "primary" ? palette.moss : v === "dark" ? palette.ink : "transparent";
  const fg = v === "outline" ? palette.moss2 : palette.paper;
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: bg, borderRadius: radius.sm, paddingVertical: 12,
        alignItems: "center", marginBottom: spacing.md,
        borderWidth: v === "outline" ? 1 : 0, borderColor: palette.line,
      }}
    >
      <Text style={{ color: fg, fontWeight: "600", fontSize: 15 }}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", gap: spacing.md, flexWrap: "wrap" }}>{children}</View>;
}

export function Mono({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  const { palette } = useStore();
  return <Text style={[{ fontFamily: fonts.mono, fontSize: 12, color: palette.muted }, style]}>{children}</Text>;
}

export function Divider() {
  const { palette } = useStore();
  return <View style={{ height: 1, backgroundColor: palette.line, marginVertical: spacing.xl }} />;
}

export function Empty({ text }: { text: string }) {
  const { palette } = useStore();
  return (
    <View style={{ borderWidth: 1, borderStyle: "dashed", borderColor: palette.line, borderRadius: radius.sm, padding: spacing.xl }}>
      <Text style={{ color: palette.muted, textAlign: "center", fontSize: 14 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { fontSize: 11, letterSpacing: 0.6, fontFamily: fonts.mono },
  title: { fontSize: 32, fontWeight: "700", marginTop: 2 },
  subtitle: { fontSize: 14, marginTop: 6, lineHeight: 20 },
  statLabel: { fontSize: 10, letterSpacing: 0.4, fontFamily: fonts.mono },
  fieldLabel: { fontSize: 10, letterSpacing: 0.4, marginBottom: 4, fontFamily: fonts.mono },
});
