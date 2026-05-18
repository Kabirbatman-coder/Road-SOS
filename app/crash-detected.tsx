import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { CrashScoreMeter } from "@/src/components/CrashScoreMeter";
import { theme } from "@/src/constants/theme";
import { getSettings } from "@/src/lib/appSettings";
import { getRiskLevel } from "@/src/lib/crashDetection";
import { createAccidentEvent } from "@/src/lib/emergencyEvents";
import { draftEmergencyAlerts, generateHospitalHandoff, generateMedicalBriefing } from "@/src/lib/gemma";
import { buildEmergencyCorridorPlan } from "@/src/lib/hospitals";
import { buildLocationLink } from "@/src/lib/location";
import { defaultProfile, getProfile } from "@/src/lib/profile";
import { requestNotificationPermission } from "@/src/lib/permissions";

const CANCELLED_CRASH_KEY = "roadsos:lastCancelledCrash";

function numberParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export default function CrashDetectedScreen() {
  const params = useLocalSearchParams();
  const score = numberParam(params.score) ?? 60;
  const latitude = numberParam(params.latitude);
  const longitude = numberParam(params.longitude);
  const riskLevel = useMemo(() => getRiskLevel(score), [score]);
  const locationLink = buildLocationLink(latitude, longitude);
  const crashReport = Array.isArray(params.crashReport)
    ? params.crashReport[0] ?? ""
    : params.crashReport ?? "";

  const [seconds, setSeconds] = useState(30);
  const [triggering, setTriggering] = useState(false);
  const didTriggerRef = useRef(false);

  useEffect(() => {
    getSettings().then((settings) => setSeconds(settings.countdownSeconds));
  }, []);

  const triggerSos = useCallback(async () => {
    if (didTriggerRef.current) {
      return;
    }

    didTriggerRef.current = true;
    setTriggering(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined);

    const profile = (await getProfile()) ?? defaultProfile;
    const corridor = await buildEmergencyCorridorPlan(latitude, longitude);
    const medicalBriefing = await generateMedicalBriefing({ profile, crashReport });
    const handoffReport = await generateHospitalHandoff({
      profile,
      crashReport,
      medicalBriefing,
      etaText: corridor.etaText,
      nearestHospital: corridor.nearestHospital.name
    });
    const alerts = await draftEmergencyAlerts({
      riderName: profile.riderName,
      locationLink,
      nearestHospital: corridor.nearestHospital.name,
      etaText: corridor.etaText,
      crashReport
    });

    const event = await createAccidentEvent({
      riderId: profile.riderId,
      qrProfileId: profile.qrProfileId,
      riderName: profile.riderName,
      bloodGroup: profile.bloodGroup,
      medicalConditions: profile.medicalConditions,
      allergies: profile.allergies,
      emergencyContactName: profile.emergencyContactName,
      emergencyContactPhone: profile.emergencyContactPhone,
      vehicleNumber: profile.vehicleNumber,
      insuranceStatus: profile.insuranceStatus,
      latitude,
      longitude,
      locationLink,
      crashScore: Math.round(score),
      riskLevel,
      status: "SOS_TRIGGERED",
      dispatchMode: "SIMULATED",
      nearestHospital: corridor.nearestHospital.name,
      nearestHospitalDistanceKm: corridor.distanceKm,
      hospitalPhone: corridor.nearestHospital.phone,
      trafficStatus: corridor.trafficStatus,
      suggestedRouteText: corridor.suggestedRouteText,
      etaText: corridor.etaText,
      directionsUrl: corridor.directionsUrl,
      medicalBriefing,
      handoffReport,
      alerts
    });

    // This local notification only confirms the simulated workflow. A real
    // product would replace it with verified 112/emergency, SMS, and dispatch integrations.
    requestNotificationPermission()
      .then(() =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: "Road SOS simulated dispatch created",
            body: "Responder dashboard updated with rider medical profile."
          },
          trigger: null
        })
      )
      .catch(() => undefined);

    router.replace({
      pathname: "/sos-triggered",
      params: { eventId: event.eventId }
    });
  }, [crashReport, latitude, longitude, locationLink, riskLevel, score]);

  useEffect(() => {
    if (seconds <= 0) {
      triggerSos();
      return;
    }

    const timer = setTimeout(() => setSeconds((current) => current - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, triggerSos]);

  async function cancelSos() {
    await AsyncStorage.setItem(
      CANCELLED_CRASH_KEY,
      JSON.stringify({
        status: "CANCELLED",
        crashScore: score,
        riskLevel,
        latitude,
        longitude,
        cancelledAt: new Date().toISOString()
      })
    );
    router.replace("/");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.alertHeader}>
          <Text style={styles.kicker}>Countdown active</Text>
          <Text style={styles.title}>Possible Crash Detected</Text>
          <Text style={styles.subtitle}>SOS will trigger unless the rider cancels.</Text>
        </View>

        <CrashScoreMeter score={score} riskLevel={riskLevel} />

        <Card>
          <Text style={styles.countdown}>{seconds}</Text>
          <Text style={styles.countdownLabel}>seconds before simulated SOS</Text>
        </Card>

        <Card title="Latest Location">
          <Text style={styles.locationText}>
            {latitude?.toFixed(5) ?? "--"}, {longitude?.toFixed(5) ?? "--"}
          </Text>
          <Button title="Open Location Link" variant="secondary" onPress={() => Linking.openURL(locationLink)} />
        </Card>

        <Button title="I am safe - cancel SOS" variant="light" size="lg" onPress={cancelSos} disabled={triggering} />
        <Button title="Trigger SOS Now" variant="danger" size="lg" loading={triggering} onPress={triggerSos} />
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
  alertHeader: {
    backgroundColor: theme.colors.redDark,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg
  },
  kicker: {
    color: theme.colors.redSoft,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.white,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 8
  },
  subtitle: {
    color: theme.colors.redSoft,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    marginTop: 8
  },
  countdown: {
    color: theme.colors.text,
    fontSize: 76,
    fontWeight: "900",
    letterSpacing: 0,
    textAlign: "center"
  },
  countdownLabel: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },
  locationText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14
  }
});
