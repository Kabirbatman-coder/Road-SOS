import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { theme } from "@/src/constants/theme";

const modules = [
  {
    title: "Auto SOS",
    copy: "Live motion and GPS readings create a crash confidence score before emergency escalation."
  },
  {
    title: "Emergency Corridor",
    copy: "Responder dashboard suggests a nearest trauma-capable hospital and routing link."
  },
  {
    title: "QR Medical ID",
    copy: "Medical profile is available through a rider QR code for first responders."
  }
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Two-wheeler emergency response MVP</Text>
          <Text style={styles.title}>Road SOS</Text>
          <Text style={styles.tagline}>Automatic accident detection for two-wheeler riders</Text>
        </View>

        <Button
          title="Start Ride Monitoring"
          size="lg"
          onPress={() => router.push("/ride")}
          style={styles.primaryButton}
        />

        <View style={styles.actionGrid}>
          <Button title="Emergency Profile" variant="secondary" onPress={() => router.push("/profile")} />
          <Button title="Responder Dashboard" variant="secondary" onPress={() => router.push("/dashboard")} />
          <Button title="My QR Medical ID" variant="secondary" onPress={() => router.push("/qr-id")} />
          <Button title="Scan QR" variant="secondary" onPress={() => router.push("/scan-qr")} />
        </View>

        <View style={styles.modules}>
          {modules.map((module) => (
            <Card key={module.title} title={module.title}>
              <Text style={styles.cardCopy}>{module.copy}</Text>
            </Card>
          ))}
        </View>

        <Button title="Settings" variant="ghost" onPress={() => router.push("/settings")} />

        <Text style={styles.disclaimer}>
          Road SOS MVP is for demonstration only and should not be relied on for real emergency response.
        </Text>
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
  hero: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    padding: theme.spacing.lg
  },
  kicker: {
    color: theme.colors.red,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: 0
  },
  tagline: {
    color: theme.colors.textMuted,
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 25,
    marginTop: 8
  },
  primaryButton: {
    marginTop: 4
  },
  actionGrid: {
    gap: 10
  },
  modules: {
    gap: 12,
    marginTop: 4
  },
  cardCopy: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21
  },
  disclaimer: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    textAlign: "center"
  }
});
