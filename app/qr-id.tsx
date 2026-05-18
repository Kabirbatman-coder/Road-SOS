import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { QRMedicalCard } from "@/src/components/QRMedicalCard";
import { theme } from "@/src/constants/theme";
import { defaultProfile, getProfile, saveProfile } from "@/src/lib/profile";
import type { EmergencyProfile } from "@/src/types";

export default function QrIdScreen() {
  const [profile, setProfile] = useState<EmergencyProfile>(defaultProfile);

  useEffect(() => {
    getProfile().then(async (stored) => {
      const current = stored ?? defaultProfile;
      setProfile(current);
      await saveProfile(current);
    });
  }, []);

  const qrValue = `roadsos://medical-profile/${encodeURIComponent(profile.qrProfileId)}`;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>QR medical ID</Text>
          <Text style={styles.title}>Rider Emergency Profile</Text>
          <Text style={styles.subtitle}>A responder can scan this code and read key medical details.</Text>
        </View>

        <Card tone="light" style={styles.qrCard}>
          <View style={styles.qrWrap}>
            <QRCode value={qrValue} size={220} backgroundColor={theme.colors.white} color={theme.colors.black} />
          </View>
          <Text style={styles.qrValue}>{qrValue}</Text>
        </Card>

        <QRMedicalCard profile={profile} />

        <Card>
          <Text style={styles.legal}>
            QR is intended as a separate emergency medical ID. Do not place on number plate/HSRP.
          </Text>
        </Card>

        <Button title="Edit Emergency Profile" onPress={() => router.push("/profile")} />
        <Button title="Back Home" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
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
  qrCard: {
    alignItems: "center",
    gap: 14
  },
  qrWrap: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 16
  },
  qrValue: {
    color: theme.colors.textDarkMuted,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 18,
    textAlign: "center"
  },
  legal: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19
  }
});
