import type { CrashRiskLevel } from "@/src/lib/crashDetection";

export type AccidentEventStatus =
  | "SOS_TRIGGERED"
  | "ACCEPTED"
  | "EN_ROUTE"
  | "RESOLVED"
  | "CANCELLED";

export type DispatchMode = "SIMULATED";

export interface EmergencyAlerts {
  familySms: string;
  policeWhatsApp: string;
}

export interface EmergencyProfile {
  riderId: string;
  qrProfileId: string;
  riderName: string;
  age: string;
  bloodGroup: string;
  medicalConditions: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  vehicleNumber: string;
  insuranceStatus: string;
  updatedAt?: string;
}

export interface SensorVector {
  x: number;
  y: number;
  z: number;
}

export interface LocationSnapshot {
  latitude: number | null;
  longitude: number | null;
  speedMps: number | null;
  accuracy?: number | null;
  timestamp?: number;
}

export interface Hospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  capacityStatus: "Available" | "Moderate" | "Busy";
  traumaAvailable: boolean;
  phone: string;
}

export interface EmergencyCorridorPlan {
  nearestHospital: Hospital;
  distanceKm: number;
  trafficStatus: "Light" | "Moderate" | "Heavy";
  etaText: string;
  suggestedRouteText: string;
  directionsUrl: string;
}

export interface AccidentEvent {
  eventId: string;
  riderId: string;
  qrProfileId: string;
  riderName: string;
  bloodGroup: string;
  medicalConditions: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  vehicleNumber: string;
  insuranceStatus: string;
  latitude: number | null;
  longitude: number | null;
  locationLink: string;
  crashScore: number;
  riskLevel: CrashRiskLevel;
  status: AccidentEventStatus;
  dispatchMode: DispatchMode;
  createdAt: string;
  nearestHospital: string;
  nearestHospitalDistanceKm: number;
  hospitalPhone: string;
  trafficStatus: "Light" | "Moderate" | "Heavy";
  suggestedRouteText: string;
  etaText: string;
  directionsUrl: string;
  medicalBriefing: string;
  handoffReport: string;
  alerts: EmergencyAlerts;
}

export interface AppSettings {
  possibleCrashThreshold: number;
  criticalCrashThreshold: number;
  countdownSeconds: number;
}
