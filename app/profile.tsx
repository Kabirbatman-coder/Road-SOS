import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { theme } from "@/src/constants/theme";
import { defaultProfile, getProfile, saveProfile } from "@/src/lib/profile";
import type { EmergencyProfile } from "@/src/types";

const fields: Array<{ key: keyof EmergencyProfile; label: string; keyboard?: "default" | "number-pad" | "phone-pad" }> = [
  { key: "riderName", label: "Rider name" },
  { key: "age", label: "Age", keyboard: "number-pad" },
  { key: "bloodGroup", label: "Blood group" },
  { key: "medicalConditions", label: "Medical conditions" },
  { key: "allergies", label: "Allergies" },
  { key: "emergencyContactName", label: "Emergency contact name" },
  { key: "emergencyContactPhone", label: "Emergency contact phone", keyboard: "phone-pad" },
  { key: "vehicleNumber", label: "Vehicle number" },
  { key: "insuranceStatus", label: "Insurance status" }
];

export default function ProfileScreen() {
  const [profile, setProfile] = useState<EmergencyProfile>(defaultProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile().then((stored) => {
      if (stored) {
        setProfile(stored);
      }
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const normalized = await saveProfile(profile);
      setProfile(normalized);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.title}>Emergency Profile</Text>
            <Text style={styles.subtitle}>Stored locally and synced to Firestore when Firebase env vars exist.</Text>
          </View>

          <Card>
            {fields.map((field) => (
              <View key={field.key} style={styles.field}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={styles.input}
                  value={String(profile[field.key] ?? "")}
                  keyboardType={field.keyboard ?? "default"}
                  placeholderTextColor={theme.colors.textDarkMuted}
                  onChangeText={(value) =>
                    setProfile((current) => ({
                      ...current,
                      [field.key]: value
                    }))
                  }
                />
              </View>
            ))}

            <View style={styles.qrBox}>
              <Text style={styles.qrLabel}>QR Profile ID</Text>
              <Text style={styles.qrValue}>{profile.qrProfileId}</Text>
            </View>
          </Card>

          {saved ? <Text style={styles.success}>Profile saved for demo response flow.</Text> : null}

          <Button title="Save Emergency Profile" loading={saving} onPress={handleSave} />
          <Button title="Back Home" variant="ghost" onPress={() => router.back()} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    gap: 8
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
  field: {
    marginBottom: 14
  },
  label: {
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
    fontWeight: "700",
    minHeight: 48,
    paddingHorizontal: 14
  },
  qrBox: {
    backgroundColor: theme.colors.elevated,
    borderRadius: theme.radius.md,
    padding: 12
  },
  qrLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  qrValue: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 5
  },
  success: {
    color: theme.colors.green,
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center"
  }
});
