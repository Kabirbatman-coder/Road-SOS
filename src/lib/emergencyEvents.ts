import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc
} from "firebase/firestore";

import { db, isFirebaseConfigured } from "@/src/lib/firebase";
import { buildEmergencyCorridorPlan } from "@/src/lib/hospitals";
import { buildLocationLink } from "@/src/lib/location";
import { defaultProfile, getProfile } from "@/src/lib/profile";
import type { AccidentEvent, AccidentEventStatus } from "@/src/types";

const EVENTS_KEY = "roadsos:accidentEvents";

function makeEventId() {
  return `event_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function readLocalEvents() {
  const stored = await AsyncStorage.getItem(EVENTS_KEY);
  return stored ? (JSON.parse(stored) as AccidentEvent[]) : [];
}

async function writeLocalEvents(events: AccidentEvent[]) {
  await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

export async function createAccidentEvent(
  event: Omit<AccidentEvent, "eventId" | "createdAt"> & Partial<Pick<AccidentEvent, "eventId" | "createdAt">>
) {
  const normalized: AccidentEvent = {
    ...event,
    eventId: event.eventId ?? makeEventId(),
    createdAt: event.createdAt ?? new Date().toISOString()
  };

  const localEvents = await readLocalEvents();
  await writeLocalEvents([normalized, ...localEvents.filter((item) => item.eventId !== normalized.eventId)]);

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "accidentEvents", normalized.eventId), normalized, { merge: true });
  }

  return normalized;
}

export async function getAccidentEvents() {
  const localEvents = await readLocalEvents();
  return localEvents.length ? localEvents : getSampleAccidentEvents();
}

export async function getAccidentEventById(eventId: string) {
  if (isFirebaseConfigured && db) {
    const snapshot = await getDoc(doc(db, "accidentEvents", eventId));
    if (snapshot.exists()) {
      return snapshot.data() as AccidentEvent;
    }
  }

  const events = await getAccidentEvents();
  return events.find((event) => event.eventId === eventId) ?? null;
}

export function listenToAccidentEvents(callback: (events: AccidentEvent[]) => void) {
  if (isFirebaseConfigured && db) {
    const eventsQuery = query(collection(db, "accidentEvents"), orderBy("createdAt", "desc"));
    return onSnapshot(
      eventsQuery,
      async (snapshot) => {
        const events = snapshot.docs.map((item) => item.data() as AccidentEvent);
        callback(events.length ? events : await getSampleAccidentEvents());
      },
      async () => {
        callback(await getAccidentEvents());
      }
    );
  }

  let active = true;
  getAccidentEvents().then((events) => {
    if (active) {
      callback(events);
    }
  });

  return () => {
    active = false;
  };
}

export async function updateAccidentStatus(eventId: string, status: AccidentEventStatus) {
  const localEvents = await readLocalEvents();
  const updated = localEvents.map((event) =>
    event.eventId === eventId ? { ...event, status } : event
  );
  await writeLocalEvents(updated);

  if (isFirebaseConfigured && db) {
    await updateDoc(doc(db, "accidentEvents", eventId), { status });
  }
}

export async function seedSampleEmergencyEvent() {
  const profile = (await getProfile()) ?? defaultProfile;
  const latitude = 23.2336;
  const longitude = 77.4344;
  const corridor = await buildEmergencyCorridorPlan(latitude, longitude);

  return createAccidentEvent({
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
    locationLink: buildLocationLink(latitude, longitude),
    crashScore: 86,
    riskLevel: "Critical Crash",
    status: "SOS_TRIGGERED",
    dispatchMode: "SIMULATED",
    nearestHospital: corridor.nearestHospital.name,
    nearestHospitalDistanceKm: corridor.distanceKm,
    hospitalPhone: corridor.nearestHospital.phone,
    trafficStatus: corridor.trafficStatus,
    suggestedRouteText: corridor.suggestedRouteText,
    etaText: corridor.etaText,
    directionsUrl: corridor.directionsUrl,
    medicalBriefing: `Paramedic briefing for ${profile.riderName}. Blood group: ${profile.bloodGroup}. Known medical conditions: ${profile.medicalConditions}. Allergies: ${profile.allergies}.`,
    handoffReport: `Hospital handoff: ${profile.riderName}, blood group ${profile.bloodGroup}. Nearest hospital: ${corridor.nearestHospital.name}. ETA: ${corridor.etaText}. Medical conditions: ${profile.medicalConditions}. Allergies: ${profile.allergies}.`,
    alerts: {
      familySms: `Emergency alert: ${profile.riderName} may have been in a crash. Live location: ${buildLocationLink(
        latitude,
        longitude
      )}. Nearest hospital: ${corridor.nearestHospital.name}. ETA: ${corridor.etaText}.`,
      policeWhatsApp: `Road SOS alert: possible crash involving ${profile.riderName}. Location: ${buildLocationLink(
        latitude,
        longitude
      )}. Nearest hospital: ${corridor.nearestHospital.name}. ETA: ${corridor.etaText}.`
    }
  });
}

export async function resetDemoData() {
  await AsyncStorage.removeItem(EVENTS_KEY);
}

export async function getSampleAccidentEvents(): Promise<AccidentEvent[]> {
  const latitude = 23.2336;
  const longitude = 77.4344;
  const corridor = await buildEmergencyCorridorPlan(latitude, longitude);

  return [
    {
      eventId: "sample_event_bhopal",
      riderId: defaultProfile.riderId,
      qrProfileId: defaultProfile.qrProfileId,
      riderName: defaultProfile.riderName,
      bloodGroup: defaultProfile.bloodGroup,
      medicalConditions: defaultProfile.medicalConditions,
      allergies: defaultProfile.allergies,
      emergencyContactName: defaultProfile.emergencyContactName,
      emergencyContactPhone: defaultProfile.emergencyContactPhone,
      vehicleNumber: defaultProfile.vehicleNumber,
      insuranceStatus: defaultProfile.insuranceStatus,
      latitude,
      longitude,
      locationLink: buildLocationLink(latitude, longitude),
      crashScore: 78,
      riskLevel: "Possible Crash",
      status: "SOS_TRIGGERED",
      dispatchMode: "SIMULATED",
      createdAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
      nearestHospital: corridor.nearestHospital.name,
      nearestHospitalDistanceKm: corridor.distanceKm,
      hospitalPhone: corridor.nearestHospital.phone,
      trafficStatus: corridor.trafficStatus,
      suggestedRouteText: corridor.suggestedRouteText,
      etaText: corridor.etaText,
      directionsUrl: corridor.directionsUrl,
      medicalBriefing: `Paramedic briefing for ${defaultProfile.riderName}. Blood group: ${defaultProfile.bloodGroup}. Known medical conditions: ${defaultProfile.medicalConditions}. Allergies: ${defaultProfile.allergies}.`,
      handoffReport: `Hospital handoff: ${defaultProfile.riderName}, blood group ${defaultProfile.bloodGroup}. Nearest hospital: ${corridor.nearestHospital.name}. ETA: ${corridor.etaText}. Medical conditions: ${defaultProfile.medicalConditions}. Allergies: ${defaultProfile.allergies}.`,
      alerts: {
        familySms: `Emergency alert: ${defaultProfile.riderName} may have been in a crash. Live location: ${buildLocationLink(
          latitude,
          longitude
        )}. Nearest hospital: ${corridor.nearestHospital.name}. ETA: ${corridor.etaText}.`,
        policeWhatsApp: `Road SOS alert: possible crash involving ${defaultProfile.riderName}. Location: ${buildLocationLink(
          latitude,
          longitude
        )}. Nearest hospital: ${corridor.nearestHospital.name}. ETA: ${corridor.etaText}.`
      }
    }
  ];
}
