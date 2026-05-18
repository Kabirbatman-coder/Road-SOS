import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Accelerometer, Gyroscope } from "expo-sensors";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { CrashScoreMeter } from "@/src/components/CrashScoreMeter";
import { SensorReadout } from "@/src/components/SensorReadout";
import { StatusPill, riskTone } from "@/src/components/StatusPill";
import { theme } from "@/src/constants/theme";
import { getSettings } from "@/src/lib/appSettings";
import {
  calculateCrashScore,
  createInitialCrashDetectionContext,
  getRiskLevel,
  kmhFromMetersPerSecond,
  magnitude3d,
  shouldStartCountdown,
  updateCrashDetectionState,
  type CrashDetectionResult,
  type MotionSample
} from "@/src/lib/crashDetection";
import { analyzeCrash } from "@/src/lib/gemma";
import { getCurrentLocationSnapshot } from "@/src/lib/location";
import { requestMotionAndLocationPermissions } from "@/src/lib/permissions";
import type { AppSettings, LocationSnapshot, SensorVector } from "@/src/types";

const emptyVector: SensorVector = { x: 0, y: 0, z: 0 };
const initialLocation: LocationSnapshot = { latitude: null, longitude: null, speedMps: null };

function distanceMeters(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(latitudeB - latitudeA);
  const dLon = toRadians(longitudeB - longitudeA);
  const lat1 = toRadians(latitudeA);
  const lat2 = toRadians(latitudeB);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createInitialResult(now = Date.now()): CrashDetectionResult {
  const context = createInitialCrashDetectionContext(now);
  const breakdown = calculateCrashScore({
    accelerometer: emptyVector,
    gyroscope: emptyVector,
    riderWasMovingBeforeEvent: false
  });

  return {
    context,
    state: context.state,
    breakdown,
    detectedReasons: ["Live readings are within normal ride range"],
    ignoredReason: "Ignored: rider not moving",
    rideDurationSeconds: 0,
    hasMovedAbove10Kmh: false,
    speedDropDetected: false,
    postImpactStillnessDetected: false,
    shakePatternDetected: false
  };
}

export default function RideScreen() {
  const [accelerometer, setAccelerometer] = useState<SensorVector>(emptyVector);
  const [gyroscope, setGyroscope] = useState<SensorVector>(emptyVector);
  const [location, setLocation] = useState<LocationSnapshot>(initialLocation);
  const [settings, setSettings] = useState<AppSettings>({
    possibleCrashThreshold: 75,
    criticalCrashThreshold: 90,
    countdownSeconds: 30
  });
  const [permissions, setPermissions] = useState("Requesting sensors and location...");
  const [monitoring, setMonitoring] = useState(true);
  const [detectionResult, setDetectionResult] = useState<CrashDetectionResult>(() =>
    createInitialResult()
  );

  const previousSpeedRef = useRef<number | null>(null);
  const hasNavigatedRef = useRef(false);
  const crashReportRef = useRef("");
  const contextRef = useRef(createInitialCrashDetectionContext());
  const samplesRef = useRef<MotionSample[]>([]);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (!monitoring) {
      return;
    }

    let mounted = true;
    let accelerometerSubscription: { remove: () => void } | null = null;
    let gyroscopeSubscription: { remove: () => void } | null = null;
    let locationSubscription: Location.LocationSubscription | null = null;

    async function startSensors() {
      try {
        const permissionResult = await requestMotionAndLocationPermissions();
        if (!mounted) {
          return;
        }

        setPermissions(
          `Accelerometer ${permissionResult.accelerometerAvailable ? "available" : "unavailable"} - Gyroscope ${
            permissionResult.gyroscopeAvailable ? "available" : "unavailable"
          } - Location ${permissionResult.locationGranted ? "granted" : "not granted"}`
        );

        Accelerometer.setUpdateInterval(250);
        Gyroscope.setUpdateInterval(250);

        accelerometerSubscription = Accelerometer.addListener((reading) => {
          setAccelerometer(reading);
        });

        gyroscopeSubscription = Gyroscope.addListener((reading) => {
          setGyroscope(reading);
        });

        const currentLocation = await getCurrentLocationSnapshot().catch(() => initialLocation);
        if (mounted) {
          setLocation(currentLocation);
        }

        if (permissionResult.locationGranted) {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              distanceInterval: 1,
              timeInterval: 1000
            },
            (position) => {
              setLocation((current) => {
                previousSpeedRef.current = current.speedMps;

                let inferredSpeedMps: number | null = null;
                if (
                  current.latitude !== null &&
                  current.longitude !== null &&
                  current.timestamp &&
                  position.timestamp > current.timestamp
                ) {
                  const meters = distanceMeters(
                    current.latitude,
                    current.longitude,
                    position.coords.latitude,
                    position.coords.longitude
                  );
                  inferredSpeedMps = meters / ((position.timestamp - current.timestamp) / 1000);
                }

                return {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  speedMps: position.coords.speed ?? inferredSpeedMps,
                  accuracy: position.coords.accuracy,
                  timestamp: position.timestamp
                };
              });
            }
          );
        }
      } catch (error) {
        if (mounted) {
          setPermissions("Sensor setup failed. Check device permissions and Expo Go support.");
        }
      }
    }

    startSensors();

    return () => {
      mounted = false;
      accelerometerSubscription?.remove();
      gyroscopeSubscription?.remove();
      locationSubscription?.remove();
    };
  }, [monitoring]);

  useEffect(() => {
    const now = Date.now();
    const accelerationMagnitude = magnitude3d(accelerometer.x, accelerometer.y, accelerometer.z);
    const gyroMagnitude = magnitude3d(gyroscope.x, gyroscope.y, gyroscope.z);
    const currentSpeedKmh = kmhFromMetersPerSecond(location.speedMps);
    const currentSample: MotionSample = {
      timestamp: now,
      accelerationMagnitude,
      gyroMagnitude,
      speedKmh: currentSpeedKmh
    };

    const result = updateCrashDetectionState({
      accelerometer,
      gyroscope,
      location,
      previousGpsSpeedMps: previousSpeedRef.current,
      samples: samplesRef.current,
      context: contextRef.current,
      monitoringActive: monitoring,
      now
    });

    samplesRef.current = [...samplesRef.current, currentSample].filter(
      (sample) => now - sample.timestamp <= 10000
    );
    contextRef.current = result.context;
    setDetectionResult(result);

    if (
      monitoring &&
      !hasNavigatedRef.current &&
      shouldStartCountdown(result, settings.possibleCrashThreshold)
    ) {
      hasNavigatedRef.current = true;
      setMonitoring(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
      analyzeCrash(result.breakdown)
        .then((crashReport) => {
          crashReportRef.current = crashReport;
          router.replace({
            pathname: "/crash-detected",
            params: {
              score: String(Math.round(result.breakdown.crashConfidence)),
              riskLevel: result.breakdown.riskLevel,
              latitude: location.latitude === null ? "" : String(location.latitude),
              longitude: location.longitude === null ? "" : String(location.longitude),
              crashReport
            }
          });
        })
        .catch(() => {
          router.replace({
            pathname: "/crash-detected",
            params: {
              score: String(Math.round(result.breakdown.crashConfidence)),
              riskLevel: result.breakdown.riskLevel,
              latitude: location.latitude === null ? "" : String(location.latitude),
              longitude: location.longitude === null ? "" : String(location.longitude),
              crashReport: crashReportRef.current
            }
          });
        });
    }
  }, [accelerometer, gyroscope, location, monitoring, settings.possibleCrashThreshold]);

  const breakdown = detectionResult.breakdown;
  const currentSpeedKmh = kmhFromMetersPerSecond(location.speedMps);
  const cooldownSeconds =
    detectionResult.context.cooldownUntil && detectionResult.context.cooldownUntil > Date.now()
      ? Math.ceil((detectionResult.context.cooldownUntil - Date.now()) / 1000)
      : 0;

  function handleManualDemoTrigger() {
    hasNavigatedRef.current = true;
    setMonitoring(false);
    router.replace({
      pathname: "/crash-detected",
      params: {
        score: "95",
        riskLevel: getRiskLevel(95),
        latitude: location.latitude === null ? "" : String(location.latitude),
        longitude: location.longitude === null ? "" : String(location.longitude)
      }
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleBlock}>
            <Text style={styles.kicker}>Active ride monitoring</Text>
            <Text style={styles.title}>Live Crash Detection</Text>
          </View>
          <StatusPill label={monitoring ? "Monitoring" : "Paused"} tone={monitoring ? "good" : "neutral"} />
        </View>

        <CrashScoreMeter score={breakdown.crashConfidence} riskLevel={breakdown.riskLevel} />

        <Card title="Crash Detection State">
          <View style={styles.stateHeader}>
            <StatusPill label={detectionResult.state.replaceAll("_", " ")} tone={stateTone(detectionResult.state)} />
            <StatusPill
              label={detectionResult.hasMovedAbove10Kmh ? "Movement armed" : "Movement not armed"}
              tone={detectionResult.hasMovedAbove10Kmh ? "good" : "warning"}
            />
          </View>

          <View style={styles.signalGrid}>
            <Signal label="Ride duration" value={`${detectionResult.rideDurationSeconds.toFixed(0)} sec`} />
            <Signal label="GPS speed" value={currentSpeedKmh === null ? "--" : `${currentSpeedKmh.toFixed(1)} km/h`} />
            <Signal label="Acceleration" value={`${breakdown.accelerationMagnitude.toFixed(2)} g`} />
            <Signal label="Gyroscope" value={`${breakdown.gyroMagnitude.toFixed(2)} rad/s`} />
          </View>

          {detectionResult.ignoredReason ? (
            <Text style={styles.ignored}>
              {cooldownSeconds > 0 ? `Ignored: cooldown active (${cooldownSeconds}s)` : detectionResult.ignoredReason}
            </Text>
          ) : null}
        </Card>

        <Card title="Risk Explanation">
          <View style={styles.reasonHeader}>
            <StatusPill label={breakdown.riskLevel} tone={riskTone(breakdown.riskLevel)} />
            <Text style={styles.threshold}>Countdown requires score 75+ and confirmation</Text>
          </View>
          {detectionResult.detectedReasons.map((reason) => (
            <Text key={reason} style={styles.reason}>
              {reason}
            </Text>
          ))}
          <Text style={styles.simNote}>
            Shaking and rotation alone are ignored. The detector waits for movement before impact plus a speed drop or
            post-impact stillness before opening SOS countdown.
          </Text>
        </Card>

        <SensorReadout
          accelerometer={accelerometer}
          accelerationMagnitude={breakdown.accelerationMagnitude}
          gyroscope={gyroscope}
          gyroMagnitude={breakdown.gyroMagnitude}
          location={location}
          speedKmh={currentSpeedKmh}
        />

        <Card title="Monitoring Status">
          <Text style={styles.statusText}>{permissions}</Text>
          <Text style={styles.statusText}>Possible crash threshold: {Math.max(settings.possibleCrashThreshold, 75)}</Text>
          <Text style={styles.statusText}>Critical crash threshold: {settings.criticalCrashThreshold}</Text>
          <Text style={styles.statusText}>
            Confirmation signals: {detectionResult.speedDropDetected ? "speed drop" : "no speed drop"} /{" "}
            {detectionResult.postImpactStillnessDetected ? "stillness" : "no stillness"}
          </Text>
        </Card>

        <Button title="Stop Monitoring" variant="ghost" onPress={() => router.replace("/")} />
        <Button title="Backup Demo Trigger" variant="danger" onPress={handleManualDemoTrigger} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.signalBox}>
      <Text style={styles.signalLabel}>{label}</Text>
      <Text style={styles.signalValue}>{value}</Text>
    </View>
  );
}

function stateTone(state: CrashDetectionResult["state"]) {
  if (state === "SOS_COUNTDOWN_READY") {
    return "danger";
  }

  if (state === "CONFIRMATION_WINDOW" || state === "POSSIBLE_IMPACT") {
    return "warning";
  }

  if (state === "COOLDOWN") {
    return "info";
  }

  return "good";
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
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  titleBlock: {
    flex: 1
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
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 6
  },
  stateHeader: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12
  },
  signalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  signalBox: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    minHeight: 58,
    padding: 10,
    width: "48%"
  },
  signalLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 5
  },
  signalValue: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900"
  },
  ignored: {
    color: theme.colors.amber,
    fontSize: 14,
    fontWeight: "900",
    lineHeight: 21,
    marginTop: 12
  },
  reasonHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  threshold: {
    color: theme.colors.textMuted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "right"
  },
  reason: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 22,
    marginBottom: 4
  },
  simNote: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 10
  },
  statusText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 22
  }
});
