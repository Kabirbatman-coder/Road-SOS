import { generatePoliceCorridorAlert } from "@/src/lib/gemma";
import { buildDirectionsUrl } from "@/src/lib/location";
import type { EmergencyCorridorPlan, Hospital } from "@/src/types";

export const bhopalHospitals: Hospital[] = [
  {
    id: "aiims-bhopal",
    name: "AIIMS Bhopal Trauma Centre",
    latitude: 23.2068,
    longitude: 77.4569,
    capacityStatus: "Available",
    traumaAvailable: true,
    phone: "+91 755 298 2607"
  },
  {
    id: "hamidia",
    name: "Hamidia Hospital",
    latitude: 23.2599,
    longitude: 77.4018,
    capacityStatus: "Moderate",
    traumaAvailable: true,
    phone: "+91 755 254 0220"
  },
  {
    id: "bansal",
    name: "Bansal Hospital",
    latitude: 23.1847,
    longitude: 77.4318,
    capacityStatus: "Available",
    traumaAvailable: true,
    phone: "+91 755 408 6000"
  },
  {
    id: "jp-hospital",
    name: "J. P. Hospital",
    latitude: 23.2307,
    longitude: 77.4347,
    capacityStatus: "Busy",
    traumaAvailable: false,
    phone: "+91 755 255 7700"
  },
  {
    id: "chirayu",
    name: "Chirayu Medical College Hospital",
    latitude: 23.2633,
    longitude: 77.5268,
    capacityStatus: "Moderate",
    traumaAvailable: true,
    phone: "+91 755 667 9000"
  }
];

export function haversineDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
) {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(latitudeB - latitudeA);
  const dLon = toRadians(longitudeB - longitudeA);
  const lat1 = toRadians(latitudeA);
  const lat2 = toRadians(latitudeB);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function findNearestHospital(latitude?: number | null, longitude?: number | null) {
  const safeLatitude = latitude ?? 23.2336;
  const safeLongitude = longitude ?? 77.4344;

  return bhopalHospitals
    .map((hospital) => ({
      hospital,
      distanceKm: haversineDistanceKm(
        safeLatitude,
        safeLongitude,
        hospital.latitude,
        hospital.longitude
      )
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
}

export async function buildEmergencyCorridorPlan(
  latitude?: number | null,
  longitude?: number | null
): Promise<EmergencyCorridorPlan> {
  const nearest = findNearestHospital(latitude, longitude);
  const trafficStatus =
    nearest.distanceKm < 3 ? "Light" : nearest.distanceKm < 8 ? "Moderate" : "Heavy";
  const speedFactor = trafficStatus === "Light" ? 1.7 : trafficStatus === "Moderate" ? 2.6 : 3.5;
  const minutes = Math.max(5, Math.round(nearest.distanceKm * speedFactor));
  const directionsUrl = buildDirectionsUrl(nearest.hospital.latitude, nearest.hospital.longitude);
  const policeAlert = await generatePoliceCorridorAlert({
    hospitalName: nearest.hospital.name,
    etaMinutes: minutes,
    trafficStatus,
    directionsUrl
  });

  return {
    nearestHospital: nearest.hospital,
    distanceKm: Number(nearest.distanceKm.toFixed(1)),
    trafficStatus,
    etaText: `${minutes}-${minutes + 4} min simulated ETA`,
    suggestedRouteText: policeAlert,
    directionsUrl
  };
}
