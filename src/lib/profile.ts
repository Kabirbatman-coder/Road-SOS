import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { db, isFirebaseConfigured } from "@/src/lib/firebase";
import type { EmergencyProfile } from "@/src/types";

const PROFILE_KEY = "roadsos:profile";

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const defaultProfile: EmergencyProfile = {
  riderId: "rider_demo_kabir",
  qrProfileId: "qr_demo_kabir",
  riderName: "Kabir Khan",
  age: "24",
  bloodGroup: "B+",
  medicalConditions: "None",
  allergies: "None",
  emergencyContactName: "Parent / Guardian",
  emergencyContactPhone: "+91 90000 00000",
  vehicleNumber: "MP XX XX XXXX",
  insuranceStatus: "Active",
  updatedAt: new Date().toISOString()
};

export function normalizeProfile(profile: Partial<EmergencyProfile>): EmergencyProfile {
  return {
    ...defaultProfile,
    ...profile,
    riderId: profile.riderId || defaultProfile.riderId,
    qrProfileId: profile.qrProfileId || makeId("qr"),
    updatedAt: new Date().toISOString()
  };
}

export async function saveProfile(profile: EmergencyProfile) {
  const normalized = normalizeProfile(profile);
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(normalized));

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "profiles", normalized.qrProfileId), normalized, { merge: true });
  }

  return normalized;
}

export async function getProfile(
  profileId?: string,
  options: { includeDefault?: boolean } = { includeDefault: true }
): Promise<EmergencyProfile | null> {
  if (profileId && isFirebaseConfigured && db) {
    const snapshot = await getDoc(doc(db, "profiles", profileId));
    if (snapshot.exists()) {
      return normalizeProfile(snapshot.data() as EmergencyProfile);
    }
  }

  const stored = await AsyncStorage.getItem(PROFILE_KEY);
  if (stored) {
    const parsed = normalizeProfile(JSON.parse(stored));
    if (!profileId || parsed.qrProfileId === profileId || parsed.riderId === profileId) {
      return parsed;
    }
  }

  if (options.includeDefault && !profileId) {
    return defaultProfile;
  }

  return null;
}

export function parseQrProfileId(value: string) {
  const trimmed = value.trim();
  const localMatch = trimmed.match(/roadsos:\/\/medical-profile\/([^/?#]+)/i);
  const webMatch = trimmed.match(/\/medical-profile\/([^/?#]+)/i);

  if (localMatch?.[1]) {
    return decodeURIComponent(localMatch[1]);
  }

  if (webMatch?.[1]) {
    return decodeURIComponent(webMatch[1]);
  }

  return trimmed;
}

export async function getProfileFromQrValue(value: string) {
  const profileId = parseQrProfileId(value);
  return getProfile(profileId, { includeDefault: false });
}

export async function resetProfile() {
  await AsyncStorage.removeItem(PROFILE_KEY);
}
