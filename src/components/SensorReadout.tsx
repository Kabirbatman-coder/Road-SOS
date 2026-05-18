import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/src/components/Card";
import { theme } from "@/src/constants/theme";
import type { LocationSnapshot, SensorVector } from "@/src/types";

interface SensorReadoutProps {
  accelerometer: SensorVector;
  accelerationMagnitude: number;
  gyroscope: SensorVector;
  gyroMagnitude: number;
  location: LocationSnapshot;
  speedKmh: number | null;
}

function fmt(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "--";
  }

  return value.toFixed(digits);
}

function ReadoutRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function SensorReadout({
  accelerometer,
  accelerationMagnitude,
  gyroscope,
  gyroMagnitude,
  location,
  speedKmh
}: SensorReadoutProps) {
  return (
    <Card title="Live Sensor Feed">
      <View style={styles.grid}>
        <ReadoutRow label="Accel X" value={`${fmt(accelerometer.x)} g`} />
        <ReadoutRow label="Accel Y" value={`${fmt(accelerometer.y)} g`} />
        <ReadoutRow label="Accel Z" value={`${fmt(accelerometer.z)} g`} />
        <ReadoutRow label="Total accel" value={`${fmt(accelerationMagnitude)} g`} />
        <ReadoutRow label="Gyro X" value={`${fmt(gyroscope.x)} rad/s`} />
        <ReadoutRow label="Gyro Y" value={`${fmt(gyroscope.y)} rad/s`} />
        <ReadoutRow label="Gyro Z" value={`${fmt(gyroscope.z)} rad/s`} />
        <ReadoutRow label="Rotation" value={`${fmt(gyroMagnitude)} rad/s`} />
        <ReadoutRow label="Latitude" value={fmt(location.latitude, 5)} />
        <ReadoutRow label="Longitude" value={fmt(location.longitude, 5)} />
        <ReadoutRow label="GPS speed" value={speedKmh === null ? "--" : `${fmt(speedKmh, 1)} km/h`} />
        <ReadoutRow label="Accuracy" value={location.accuracy ? `${fmt(location.accuracy, 0)} m` : "--"} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  row: {
    backgroundColor: theme.colors.elevated,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    minHeight: 58,
    padding: 10,
    width: "48%"
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 5
  },
  value: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "900"
  }
});
