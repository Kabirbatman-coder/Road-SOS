import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/src/components/Button";
import { Card } from "@/src/components/Card";
import { StatusPill } from "@/src/components/StatusPill";
import { theme } from "@/src/constants/theme";
import { getAccidentEventById } from "@/src/lib/emergencyEvents";
import type { AccidentEvent } from "@/src/types";

export default function SosTriggeredScreen() {
  const params = useLocalSearchParams();
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId;
  const [event, setEvent] = useState<AccidentEvent | null>(null);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let active = true;
    getAccidentEventById(eventId).then((foundEvent) => {
      if (active) {
        setEvent(foundEvent);
      }
    });

    return () => {
      active = false;
    };
  }, [eventId]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <StatusPill label="SIMULATED DISPATCH" tone="danger" />
          <Text style={styles.title}>Auto SOS Triggered</Text>
          <Text style={styles.subtitle}>Emergency dispatch simulated for MVP.</Text>
        </View>

        <Card title="Response Packet">
          <Text style={styles.item}>GPS location shared</Text>
          <Text style={styles.item}>Mock emergency contact notification prepared</Text>
          <Text style={styles.item}>Responder dashboard updated</Text>
          <Text style={styles.item}>Medical profile attached</Text>
          <Text style={styles.note}>No actual emergency service, ambulance, SMS, or WhatsApp alert was contacted.</Text>
        </Card>

        {event?.handoffReport ? (
          <Card title="Hospital Handoff Report">
            <Text style={styles.briefing}>{event.handoffReport}</Text>
          </Card>
        ) : null}

        {event?.medicalBriefing ? (
          <Card title="Medical Briefing">
            <Text style={styles.briefing}>{event.medicalBriefing}</Text>
          </Card>
        ) : null}

        {eventId ? (
          <Card title="Event ID">
            <Text style={styles.eventId}>{eventId}</Text>
          </Card>
        ) : null}

        <Button title="View Responder Dashboard" size="lg" onPress={() => router.replace("/dashboard")} />
        <Button title="Back Home" variant="ghost" onPress={() => router.replace("/")} />
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
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: 12,
    padding: theme.spacing.lg
  },
  title: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: "900",
    letterSpacing: 0
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 16,
    fontWeight: "800"
  },
  item: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 26
  },
  note: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
    marginTop: 12
  },
  eventId: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "900"
  },
  briefing: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23
  }
});
