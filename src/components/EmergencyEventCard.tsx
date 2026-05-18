import { Linking, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { StatusPill, riskTone } from "@/src/components/StatusPill";
import { theme } from "@/src/constants/theme";
import type { AccidentEvent, AccidentEventStatus } from "@/src/types";

interface EmergencyEventCardProps {
  event: AccidentEvent;
  onStatusChange: (eventId: string, status: AccidentEventStatus) => void;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function EmergencyEventCard({ event, onStatusChange }: EmergencyEventCardProps) {
  return (
    <Card tone="light" style={styles.card}>
      <View style={styles.top}>
        <View style={styles.titleBlock}>
          <Text style={styles.name}>{event.riderName}</Text>
          <Text style={styles.meta}>{new Date(event.createdAt).toLocaleString()}</Text>
        </View>
        <StatusPill label={event.riskLevel} tone={riskTone(event.riskLevel)} />
      </View>

      <View style={styles.metrics}>
        <Detail label="Blood" value={event.bloodGroup} />
        <Detail label="Score" value={`${event.crashScore}/100`} />
        <Detail label="Status" value={event.status.replaceAll("_", " ")} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accident Location</Text>
        <Text style={styles.copy}>
          {event.latitude?.toFixed(5) ?? "--"}, {event.longitude?.toFixed(5) ?? "--"}
        </Text>
        <Button title="Open Google Maps" variant="secondary" size="sm" onPress={() => Linking.openURL(event.locationLink)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Corridor</Text>
        <Text style={styles.copy}>{event.nearestHospital}</Text>
        <Text style={styles.subcopy}>
          {event.nearestHospitalDistanceKm} km • {event.etaText} • Traffic {event.trafficStatus}
        </Text>
        <Text style={styles.subcopy}>{event.suggestedRouteText}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Medical + Contact</Text>
        <Text style={styles.subcopy}>Conditions: {event.medicalConditions}</Text>
        <Text style={styles.subcopy}>Allergies: {event.allergies}</Text>
        <Text style={styles.subcopy}>
          Contact: {event.emergencyContactName} ({event.emergencyContactPhone})
        </Text>
      </View>

      <View style={styles.actions}>
        <Button title="Accept" variant="light" size="sm" onPress={() => onStatusChange(event.eventId, "ACCEPTED")} />
        <Button title="En Route" variant="secondary" size="sm" onPress={() => onStatusChange(event.eventId, "EN_ROUTE")} />
        <Button title="Resolved" variant="ghost" size="sm" onPress={() => onStatusChange(event.eventId, "RESOLVED")} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 14
  },
  top: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  titleBlock: {
    flex: 1
  },
  name: {
    color: theme.colors.textDark,
    fontSize: 20,
    fontWeight: "900"
  },
  meta: {
    color: theme.colors.textDarkMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 4
  },
  metrics: {
    flexDirection: "row",
    gap: 8
  },
  detail: {
    backgroundColor: theme.colors.cardMuted,
    borderRadius: theme.radius.md,
    flex: 1,
    padding: 10
  },
  detailLabel: {
    color: theme.colors.textDarkMuted,
    fontSize: 11,
    fontWeight: "800"
  },
  detailValue: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 4
  },
  section: {
    gap: 8
  },
  sectionTitle: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: "900"
  },
  copy: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: "800"
  },
  subcopy: {
    color: theme.colors.textDarkMuted,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  }
});
