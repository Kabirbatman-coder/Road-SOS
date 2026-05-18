import { StyleSheet, Text, View } from "react-native";

import { StatusPill, riskTone } from "@/src/components/StatusPill";
import { theme } from "@/src/constants/theme";
import type { CrashRiskLevel } from "@/src/lib/crashDetection";

interface CrashScoreMeterProps {
  score: number;
  riskLevel: CrashRiskLevel;
}

export function CrashScoreMeter({ score, riskLevel }: CrashScoreMeterProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const barColor =
    clamped >= 90 ? theme.colors.red : clamped >= 75 ? theme.colors.amber : clamped >= 50 ? theme.colors.blue : theme.colors.green;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.label}>Crash Confidence</Text>
          <Text style={styles.score}>{Math.round(clamped)}</Text>
        </View>
        <StatusPill label={riskLevel} tone={riskTone(riskLevel)} />
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.scale}>
        <Text style={styles.scaleText}>0</Text>
        <Text style={styles.scaleText}>50</Text>
        <Text style={styles.scaleText}>75</Text>
        <Text style={styles.scaleText}>90</Text>
        <Text style={styles.scaleText}>100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.md
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "800"
  },
  score: {
    color: theme.colors.text,
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: 0
  },
  track: {
    backgroundColor: theme.colors.elevated,
    borderRadius: 999,
    height: 14,
    overflow: "hidden"
  },
  fill: {
    borderRadius: 999,
    height: "100%"
  },
  scale: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8
  },
  scaleText: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: "700"
  }
});
