import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { StatusPill } from "@/src/components/StatusPill";
import { theme } from "@/src/constants/theme";
import { DEFAULT_SETTINGS, getSettings, resetSettings, saveSettings } from "@/src/lib/appSettings";
import { resetDemoData, seedSampleEmergencyEvent } from "@/src/lib/emergencyEvents";
import { getFirebaseStatus } from "@/src/lib/firebase";
import { getPermissionStatuses, requestMotionAndLocationPermissions } from "@/src/lib/permissions";
import { resetProfile } from "@/src/lib/profile";
import type { AppSettings } from "@/src/types";

type PermissionStatuses = Awaited<ReturnType<typeof getPermissionStatuses>>;

export default function SettingsScreen() {
  const firebaseStatus = getFirebaseStatus();
  const [permissions, setPermissions] = useState<PermissionStatuses | null>(null);
  const [draft, setDraft] = useState({
    possibleCrashThreshold: String(DEFAULT_SETTINGS.possibleCrashThreshold),
    criticalCrashThreshold: String(DEFAULT_SETTINGS.criticalCrashThreshold),
    countdownSeconds: String(DEFAULT_SETTINGS.countdownSeconds)
  });
  const [message, setMessage] = useState("");

  async function refresh() {
    const [storedSettings, statuses] = await Promise.all([getSettings(), getPermissionStatuses()]);
    setDraft({
      possibleCrashThreshold: String(storedSettings.possibleCrashThreshold),
      criticalCrashThreshold: String(storedSettings.criticalCrashThreshold),
      countdownSeconds: String(storedSettings.countdownSeconds)
    });
    setPermissions(statuses);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleSaveSettings() {
    const next: AppSettings = {
      possibleCrashThreshold: Number(draft.possibleCrashThreshold),
      criticalCrashThreshold: Number(draft.criticalCrashThreshold),
      countdownSeconds: Number(draft.countdownSeconds)
    };
    await saveSettings(next);
    setMessage("Crash thresholds saved.");
  }

  async function handleReset() {
    await Promise.all([resetDemoData(), resetProfile(), resetSettings()]);
    await refresh();
    setMessage("Local demo data reset.");
  }

  async function handleSeed() {
    await seedSampleEmergencyEvent();
    setMessage("Sample emergency event added.");
  }

  async function handleRequestPermissions() {
    await requestMotionAndLocationPermissions();
    await refresh();
    setMessage("Permission request completed.");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>Settings</Text>
          <Text style={styles.title}>Demo Controls</Text>
          <Text style={styles.subtitle}>Tune thresholds and verify platform readiness before judging.</Text>
        </View>

        <Card title="Firebase Connection">
          <View style={styles.rowBetween}>
            <Text style={styles.copy}>{firebaseStatus.mode}</Text>
            <StatusPill label={firebaseStatus.configured ? "Configured" : "Local"} tone={firebaseStatus.configured ? "good" : "warning"} />
          </View>
          {!firebaseStatus.configured ? (
            <Text style={styles.warning}>Firebase not configured - using local demo mode</Text>
          ) : null}
        </Card>

        <Card title="Permissions Status">
          <Text style={styles.copy}>Accelerometer: {permissions?.accelerometer ?? "--"}</Text>
          <Text style={styles.copy}>Gyroscope: {permissions?.gyroscope ?? "--"}</Text>
          <Text style={styles.copy}>Location: {permissions?.location ?? "--"}</Text>
          <Text style={styles.copy}>Notifications: {permissions?.notifications ?? "--"}</Text>
          <Button title="Request Sensor + Location Permissions" variant="secondary" onPress={handleRequestPermissions} />
        </Card>

        <Card title="Crash Threshold Settings">
          <SettingInput
            label="Possible crash threshold"
            value={draft.possibleCrashThreshold}
            onChangeText={(value) => setDraft((current) => ({ ...current, possibleCrashThreshold: value }))}
          />
          <SettingInput
            label="Critical crash threshold"
            value={draft.criticalCrashThreshold}
            onChangeText={(value) => setDraft((current) => ({ ...current, criticalCrashThreshold: value }))}
          />
          <SettingInput
            label="Countdown seconds"
            value={draft.countdownSeconds}
            onChangeText={(value) => setDraft((current) => ({ ...current, countdownSeconds: value }))}
          />
          <Button title="Save Settings" onPress={handleSaveSettings} />
        </Card>

        <Card title="Demo Data">
          <Button title="Seed Sample Emergency Event" variant="secondary" onPress={handleSeed} />
          <Button title="Reset Demo Data" variant="danger" onPress={handleReset} />
        </Card>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Button title="Back Home" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingInput({
  label,
  value,
  onChangeText
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        keyboardType="number-pad"
        onChangeText={onChangeText}
        placeholderTextColor={theme.colors.textDarkMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: theme.colors.background,
    flex: 1
  },
  container: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl
  },
  header: {
    gap: 7
  },
  kicker: {
    color: theme.colors.red,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  copy: {
    color: theme.colors.textMuted,
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22,
    marginBottom: 8
  },
  warning: {
    color: theme.colors.amber,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 8
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8
  },
  input: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.borderLight,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    color: theme.colors.textDark,
    fontSize: 16,
    fontWeight: "800",
    minHeight: 48,
    paddingHorizontal: 14
  },
  message: {
    color: theme.colors.green,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  }
});
