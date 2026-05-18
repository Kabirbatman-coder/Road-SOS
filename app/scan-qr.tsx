import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { QRMedicalCard } from "@/src/components/QRMedicalCard";
import { theme } from "@/src/constants/theme";
import { generateBystanderGuidance } from "@/src/lib/gemma";
import { defaultProfile, getProfileFromQrValue, parseQrProfileId } from "@/src/lib/profile";
import type { EmergencyProfile } from "@/src/types";

export default function ScanQrScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedValue, setScannedValue] = useState("");
  const [profile, setProfile] = useState<EmergencyProfile | null>(null);
  const [guidance, setGuidance] = useState("");

  async function handleScanned(result: { data: string }) {
    if (scanned) {
      return;
    }

    setScanned(true);
    setScannedValue(result.data);
    const foundProfile = await getProfileFromQrValue(result.data);
    setProfile(foundProfile);
    const guidanceProfile = foundProfile ?? {
      ...defaultProfile,
      qrProfileId: parseQrProfileId(result.data)
    };
    const generatedGuidance = await generateBystanderGuidance({ profile: guidanceProfile });
    setGuidance(generatedGuidance);
  }

  const demoProfile: EmergencyProfile = {
    ...defaultProfile,
    qrProfileId: parseQrProfileId(scannedValue || defaultProfile.qrProfileId),
    riderName: profile ? profile.riderName : "Demo Medical Profile"
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.kicker}>QR scanner</Text>
          <Text style={styles.title}>Scan Medical ID</Text>
          <Text style={styles.subtitle}>Camera scans QR codes and resolves local or Firestore rider profiles.</Text>
        </View>

        {!permission ? (
          <Card>
            <Text style={styles.copy}>Checking camera permission...</Text>
          </Card>
        ) : !permission.granted ? (
          <Card>
            <Text style={styles.copy}>Camera permission is required to scan emergency medical IDs.</Text>
            <Button title="Grant Camera Permission" onPress={requestPermission} />
          </Card>
        ) : (
          <View style={styles.cameraShell}>
            <CameraView
              style={styles.camera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={scanned ? undefined : handleScanned}
            >
              <View style={styles.scanFrame} />
            </CameraView>
          </View>
        )}

        {scanned ? (
          <>
            <Card title={profile ? "Matched Profile" : "Scanned QR Value"}>
              <Text style={styles.scannedValue}>{scannedValue}</Text>
              {!profile ? (
                <Text style={styles.copy}>
                  No stored profile matched this ID, so a demo medical card is shown for judging continuity.
                </Text>
              ) : null}
            </Card>
            <QRMedicalCard profile={profile ?? demoProfile} />
            {guidance ? (
              <Card title="On-Scene AI Advisor">
                <ScrollView style={styles.guidanceBox} nestedScrollEnabled>
                  <Text style={styles.guidanceText}>{guidance}</Text>
                </ScrollView>
              </Card>
            ) : null}
            <Button
              title="Scan Another QR"
              variant="secondary"
              onPress={() => {
                setScanned(false);
                setScannedValue("");
                setProfile(null);
                setGuidance("");
              }}
            />
          </>
        ) : null}

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
  cameraShell: {
    backgroundColor: theme.colors.black,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    height: 360,
    overflow: "hidden"
  },
  camera: {
    flex: 1
  },
  scanFrame: {
    borderColor: theme.colors.red,
    borderRadius: theme.radius.lg,
    borderWidth: 3,
    height: 220,
    left: "50%",
    marginLeft: -110,
    marginTop: -110,
    position: "absolute",
    top: "50%",
    width: 220
  },
  copy: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: 12
  },
  scannedValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 20,
    marginBottom: 12
  },
  guidanceBox: {
    maxHeight: 220
  },
  guidanceText: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23
  }
});
