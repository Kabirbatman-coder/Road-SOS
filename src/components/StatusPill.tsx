import { StyleSheet, Text, View } from "react-native";

import { theme } from "@/src/constants/theme";

type Tone = "neutral" | "good" | "warning" | "danger" | "info";

interface StatusPillProps {
  label: string;
  tone?: Tone;
}

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  return (
    <View style={[styles.pill, styles[tone]]}>
      <Text style={[styles.text, styles[`${tone}Text`]]}>{label}</Text>
    </View>
  );
}

export function riskTone(label: string): Tone {
  if (label.includes("Critical")) {
    return "danger";
  }

  if (label.includes("Possible")) {
    return "warning";
  }

  if (label.includes("Unusual")) {
    return "info";
  }

  return "good";
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  text: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0
  },
  neutral: {
    backgroundColor: "#E5E7EB"
  },
  good: {
    backgroundColor: theme.colors.greenSoft
  },
  warning: {
    backgroundColor: theme.colors.amberSoft
  },
  danger: {
    backgroundColor: theme.colors.redSoft
  },
  info: {
    backgroundColor: theme.colors.blueSoft
  },
  neutralText: {
    color: "#374151"
  },
  goodText: {
    color: "#166534"
  },
  warningText: {
    color: "#92400E"
  },
  dangerText: {
    color: theme.colors.redDark
  },
  infoText: {
    color: "#1D4ED8"
  }
});
