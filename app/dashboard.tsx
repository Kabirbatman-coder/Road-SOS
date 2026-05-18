import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/src/components/Button";
import { EmergencyEventCard } from "@/src/components/EmergencyEventCard";
import { StatusPill } from "@/src/components/StatusPill";
import { theme } from "@/src/constants/theme";
import {
  listenToAccidentEvents,
  seedSampleEmergencyEvent,
  updateAccidentStatus
} from "@/src/lib/emergencyEvents";
import { getFirebaseStatus } from "@/src/lib/firebase";
import type { AccidentEvent, AccidentEventStatus } from "@/src/types";

export default function DashboardScreen() {
  const [events, setEvents] = useState<AccidentEvent[]>([]);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);
  const firebaseStatus = getFirebaseStatus();

  useEffect(() => {
    const unsubscribe = listenToAccidentEvents(setEvents);
    return unsubscribe;
  }, []);

  async function handleStatusChange(eventId: string, status: AccidentEventStatus) {
    setSavingStatus(eventId);
    setEvents((current) =>
      current.map((event) => (event.eventId === eventId ? { ...event, status } : event))
    );
    try {
      await updateAccidentStatus(eventId, status);
    } finally {
      setSavingStatus(null);
    }
  }

  async function handleSeed() {
    const event = await seedSampleEmergencyEvent();
    setEvents((current) => [event, ...current.filter((item) => item.eventId !== event.eventId)]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>Responder dashboard</Text>
            <Text style={styles.title}>Ambulance Queue</Text>
            <Text style={styles.subtitle}>Live Firestore events when configured, local demo fallback otherwise.</Text>
          </View>
          <StatusPill label={firebaseStatus.configured ? "FIRESTORE" : "LOCAL"} tone={firebaseStatus.configured ? "good" : "warning"} />
        </View>

        <View style={styles.stats}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{events.length}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{events.filter((event) => event.status !== "RESOLVED").length}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{events.filter((event) => event.riskLevel === "Critical Crash").length}</Text>
            <Text style={styles.statLabel}>Critical</Text>
          </View>
        </View>

        <Button title="Seed Sample Emergency Event" variant="secondary" onPress={handleSeed} />

        <View style={styles.list}>
          {events.map((event) => (
            <View key={event.eventId} style={savingStatus === event.eventId ? styles.dimmed : undefined}>
              <EmergencyEventCard event={event} onStatusChange={handleStatusChange} />
            </View>
          ))}
        </View>
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
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between"
  },
  headerText: {
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
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0,
    marginTop: 6
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginTop: 6
  },
  stats: {
    flexDirection: "row",
    gap: 10
  },
  statBox: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    padding: 14
  },
  statValue: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0
  },
  statLabel: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 3
  },
  list: {
    gap: 14
  },
  dimmed: {
    opacity: 0.7
  }
});
