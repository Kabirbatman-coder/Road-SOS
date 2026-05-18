import AsyncStorage from "@react-native-async-storage/async-storage";

import type { AppSettings } from "@/src/types";

const SETTINGS_KEY = "roadsos:settings";

export const DEFAULT_SETTINGS: AppSettings = {
  possibleCrashThreshold: 75,
  criticalCrashThreshold: 90,
  countdownSeconds: 30
};

export async function getSettings(): Promise<AppSettings> {
  const stored = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!stored) {
    return DEFAULT_SETTINGS;
  }

  return {
    ...DEFAULT_SETTINGS,
    ...JSON.parse(stored)
  };
}

export async function saveSettings(settings: AppSettings) {
  const normalized: AppSettings = {
    possibleCrashThreshold: Number(settings.possibleCrashThreshold) || DEFAULT_SETTINGS.possibleCrashThreshold,
    criticalCrashThreshold: Number(settings.criticalCrashThreshold) || DEFAULT_SETTINGS.criticalCrashThreshold,
    countdownSeconds: Number(settings.countdownSeconds) || DEFAULT_SETTINGS.countdownSeconds
  };

  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function resetSettings() {
  await AsyncStorage.removeItem(SETTINGS_KEY);
  return DEFAULT_SETTINGS;
}
