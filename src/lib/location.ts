import * as Location from "expo-location";

import type { LocationSnapshot } from "@/src/types";

export function buildLocationLink(latitude?: number | null, longitude?: number | null) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return "https://www.google.com/maps/search/?api=1&query=Bhopal";
  }

  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function buildDirectionsUrl(latitude?: number | null, longitude?: number | null) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return "https://www.google.com/maps/dir/?api=1&destination=Bhopal";
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export async function requestLocationPermission() {
  const current = await Location.getForegroundPermissionsAsync();
  if (current.granted) {
    return current;
  }

  return Location.requestForegroundPermissionsAsync();
}

export async function getCurrentLocationSnapshot(): Promise<LocationSnapshot> {
  const permission = await requestLocationPermission();

  if (!permission.granted) {
    return {
      latitude: null,
      longitude: null,
      speedMps: null
    };
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    speedMps: position.coords.speed ?? null,
    accuracy: position.coords.accuracy,
    timestamp: position.timestamp
  };
}
