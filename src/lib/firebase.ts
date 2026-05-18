import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.length > 0
);

export const firebaseApp: FirebaseApp | null = isFirebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null;

export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null;

export function getFirebaseStatus() {
  return {
    configured: isFirebaseConfigured,
    mode: isFirebaseConfigured ? "Firestore connected" : "Firebase not configured - using local demo mode"
  };
}
