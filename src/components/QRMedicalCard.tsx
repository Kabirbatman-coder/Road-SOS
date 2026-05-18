import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/src/components/Card";
import { theme } from "@/src/constants/theme";
import type { EmergencyProfile } from "@/src/types";

interface QRMedicalCardProps {
  profile: EmergencyProfile;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function QRMedicalCard({ profile }: QRMedicalCardProps) {
  return (
    <Card tone="light">
      <View style={styles.header}>
        <Text style={styles.name}>{profile.riderName}</Text>
        <Text style={styles.blood}>{profile.bloodGroup}</Text>
      </View>
      <Row label="Age" value={profile.age} />
      <Row label="Medical conditions" value={profile.medicalConditions} />
      <Row label="Allergies" value={profile.allergies} />
      <Row label="Emergency contact" value={`${profile.emergencyContactName} • ${profile.emergencyContactPhone}`} />
      <Row label="Vehicle number" value={profile.vehicleNumber} />
      <Row label="Insurance" value={profile.insuranceStatus} />
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    borderBottomColor: theme.colors.borderLight,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingBottom: 12
  },
  name: {
    color: theme.colors.textDark,
    flex: 1,
    fontSize: 22,
    fontWeight: "900"
  },
  blood: {
    backgroundColor: theme.colors.redSoft,
    borderRadius: 999,
    color: theme.colors.redDark,
    fontSize: 18,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  row: {
    marginTop: 10
  },
  label: {
    color: theme.colors.textDarkMuted,
    fontSize: 12,
    fontWeight: "800"
  },
  value: {
    color: theme.colors.textDark,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
    marginTop: 3
  }
});
