/**
 * Central Gemma 4 API module for Road-SOS / GoldenHour.
 *
 * Every exported function has a rule-based fallback so the SOS flow never
 * silently fails if the model is slow, unavailable, or the network is down.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

import type { CrashScoreBreakdown } from "@/src/lib/crashDetection";
import type { EmergencyProfile } from "@/src/types";

const API_KEY = process.env.EXPO_PUBLIC_GEMMA_API_KEY ?? "";
const MODEL_NAME = "gemma-4-26b-a4b-it";

function getModel() {
  if (!API_KEY || API_KEY === "your_key_here") {
    throw new Error("EXPO_PUBLIC_GEMMA_API_KEY is not set. Add it to your .env file.");
  }

  const genai = new GoogleGenerativeAI(API_KEY);
  return genai.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 400,
    },
  });
}

async function callGemma(prompt: string): Promise<string> {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

function cleanJson(raw: string) {
  return raw.replace(/```json|```/g, "").trim();
}

function normaliseNone(value: string | null | undefined) {
  return value && value.trim() ? value : "none reported";
}

function getAccelerationPeak(breakdown: CrashScoreBreakdown) {
  return breakdown.accelerationMagnitude;
}

function getGyroPeak(breakdown: CrashScoreBreakdown) {
  return breakdown.gyroMagnitude;
}

export async function analyzeCrash(breakdown: CrashScoreBreakdown): Promise<string> {
  const {
    speedBeforeImpactKmh,
    crashConfidence,
    speedDropDetected,
    postImpactStillnessDetected,
    riskLevel,
  } = breakdown;
  const accelerationPeak = getAccelerationPeak(breakdown);
  const gyroPeak = getGyroPeak(breakdown);

  const prompt = `
You are an emergency crash analysis system. Based on sensor data from a road accident, write a concise 2-3 sentence crash report for paramedics. Be factual, clinical, and specific. Do not add disclaimers or caveats.

Sensor data:
- Speed before impact: ${speedBeforeImpactKmh !== null ? `${speedBeforeImpactKmh.toFixed(1)} km/h` : "unknown"}
- Peak acceleration: ${accelerationPeak.toFixed(2)}g (normal riding = ~1g)
- Peak rotation: ${gyroPeak.toFixed(2)} rad/s
- Crash confidence score: ${crashConfidence}/100
- Risk level: ${riskLevel}
- Speed dropped to near-zero after impact: ${speedDropDetected ? "yes" : "no"}
- Rider motionless after impact: ${postImpactStillnessDetected ? "yes" : "no"}

Write the crash report now. Start with "Accident detected at" and describe impact severity, likely mechanism, and whether the rider appears responsive based on post-impact movement.
`.trim();

  try {
    return await callGemma(prompt);
  } catch {
    const severity =
      crashConfidence >= 90 ? "high-severity" : crashConfidence >= 75 ? "moderate-severity" : "possible";
    const speed = speedBeforeImpactKmh
      ? `at approximately ${speedBeforeImpactKmh.toFixed(0)} km/h`
      : "at unknown speed";
    const stillness = postImpactStillnessDetected
      ? "Rider appears motionless post-impact."
      : "Some post-impact movement detected.";

    return `Accident detected - ${severity} impact ${speed}. Peak force: ${accelerationPeak.toFixed(1)}g, rotation: ${gyroPeak.toFixed(1)} rad/s. ${stillness} Confidence score: ${crashConfidence}/100.`;
  }
}

export interface EmergencyAlerts {
  familySms: string;
  policeWhatsApp: string;
}

export async function draftEmergencyAlerts(params: {
  riderName: string;
  locationLink: string;
  nearestHospital: string;
  etaText: string;
  crashReport: string;
}): Promise<EmergencyAlerts> {
  const { riderName, locationLink, nearestHospital, etaText, crashReport } = params;

  const prompt = `
You are an emergency alert system for road accidents in India. Write two short messages. Return ONLY valid JSON, nothing else.

Context:
- Rider: ${riderName}
- Crash summary: ${crashReport}
- Location: ${locationLink}
- Nearest hospital: ${nearestHospital}
- Ambulance ETA: ${etaText}

Return this exact JSON structure:
{
  "familySms": "A short SMS (max 160 chars) to the emergency contact. Mention the rider name, that an accident was detected, the location link, and which hospital they may be taken to.",
  "policeWhatsApp": "A WhatsApp message (max 200 chars) to traffic police. Mention ambulance is en route to the hospital, ask them to clear the route, and include the ETA."
}
`.trim();

  try {
    const parsed = JSON.parse(cleanJson(await callGemma(prompt))) as EmergencyAlerts;
    if (!parsed.familySms || !parsed.policeWhatsApp) {
      throw new Error("Gemma alert JSON was incomplete");
    }
    return parsed;
  } catch {
    return {
      familySms: `ALERT: ${riderName} may have been in a road accident. Location: ${locationLink}. Nearest hospital: ${nearestHospital}. Please call immediately.`,
      policeWhatsApp: `Emergency: Ambulance en route to ${nearestHospital}. ETA ${etaText}. Please clear traffic corridor. Accident at: ${locationLink}`,
    };
  }
}

export async function generateMedicalBriefing(params: {
  profile: EmergencyProfile;
  crashReport: string;
}): Promise<string> {
  const { profile, crashReport } = params;

  const prompt = `
You are a medical AI assistant supporting paramedics at an accident scene in India. Based on the rider's medical profile and the crash report, write a concise paramedic briefing. Be specific, actionable, and clinical. Do not add legal disclaimers.

Rider medical profile:
- Name: ${profile.riderName}, Age: ${profile.age}
- Blood group: ${profile.bloodGroup}
- Known medical conditions: ${normaliseNone(profile.medicalConditions)}
- Allergies: ${normaliseNone(profile.allergies)}
- Vehicle: ${profile.vehicleNumber}

Crash report:
${crashReport}

Write a 3-5 sentence briefing that:
1. States the rider's key medical facts (blood group, allergies)
2. Based on the crash mechanics, identifies which body regions to prioritise checking
3. Lists any medications or treatments to AVOID given their allergies/conditions
4. States whether trauma care is likely needed
`.trim();

  try {
    return await callGemma(prompt);
  } catch {
    const allergyWarning =
      profile.allergies && profile.allergies.toLowerCase() !== "none"
        ? `ALLERGY WARNING: Do not administer ${profile.allergies}.`
        : "No known allergies on file.";
    const conditions =
      profile.medicalConditions && profile.medicalConditions.toLowerCase() !== "none"
        ? `Known conditions: ${profile.medicalConditions}.`
        : "";

    return `Rider: ${profile.riderName}, ${profile.age} years old. Blood group: ${profile.bloodGroup}. ${allergyWarning} ${conditions} ${crashReport} Assess for trauma per standard protocol.`.trim();
  }
}

export async function generateBystanderGuidance(params: {
  profile: EmergencyProfile;
  sceneSituation?: string;
}): Promise<string> {
  const { profile, sceneSituation } = params;
  const sceneContext = sceneSituation
    ? `Scene description from bystander: "${sceneSituation}"`
    : "No scene description provided. Give general post-accident guidance.";

  const prompt = `
You are a first-aid guide for road accident bystanders in India. A bystander just scanned a rider's emergency QR code. Give them clear, numbered first-aid steps they can follow RIGHT NOW while waiting for the ambulance.

Rider's medical profile:
- Name: ${profile.riderName}
- Blood group: ${profile.bloodGroup}
- Allergies: ${normaliseNone(profile.allergies)}
- Medical conditions: ${normaliseNone(profile.medicalConditions)}

${sceneContext}

Write 4-6 numbered steps. Use simple language (not medical jargon). Start each step with an action verb. Include any specific warnings based on their allergies or conditions. End with "Ambulance has been alerted and is on the way."
`.trim();

  try {
    return await callGemma(prompt);
  } catch {
    const allergyNote =
      profile.allergies && profile.allergies.toLowerCase() !== "none"
        ? `\nWARNING: Do NOT give any medication - rider is allergic to: ${profile.allergies}.`
        : "";

    return `1. Keep the rider still - do not move them unless there is immediate danger.\n2. Check if they are conscious and breathing.\n3. Apply pressure to any visible bleeding wounds.\n4. Keep them warm and calm.\n5. Do not remove their helmet if they are unconscious.${allergyNote}\nAmbulance has been alerted and is on the way.`;
  }
}

export async function generateHospitalHandoff(params: {
  profile: EmergencyProfile;
  crashReport: string;
  medicalBriefing: string;
  etaText: string;
  nearestHospital: string;
}): Promise<string> {
  const { profile, crashReport, medicalBriefing, etaText, nearestHospital } = params;

  const prompt = `
You are generating a pre-arrival patient handoff report for the emergency department at ${nearestHospital}. This report will be read by the ER doctor before the patient arrives. Be structured, clinical, and brief.

Patient information:
- Name: ${profile.riderName}, Age: ${profile.age}
- Blood group: ${profile.bloodGroup}
- Allergies: ${normaliseNone(profile.allergies)}
- Medical history: ${normaliseNone(profile.medicalConditions)}
- Vehicle: ${profile.vehicleNumber}
- Insurance: ${profile.insuranceStatus}

Crash report: ${crashReport}

Paramedic briefing: ${medicalBriefing}

Ambulance ETA: ${etaText}

Write a structured handoff report with these sections (use these exact headings):
PATIENT: (name, age, blood group)
MECHANISM: (how the accident happened, impact severity)
SUSPECTED INJURIES: (based on crash mechanics)
CRITICAL ALERTS: (allergies, conditions - anything that affects treatment)
ETA: (arrival time)
`.trim();

  try {
    return await callGemma(prompt);
  } catch {
    return `PATIENT: ${profile.riderName}, ${profile.age} years, Blood group ${profile.bloodGroup}
MECHANISM: ${crashReport}
SUSPECTED INJURIES: Assess per standard trauma protocol based on mechanism above.
CRITICAL ALERTS: Allergies - ${profile.allergies || "none"}. Conditions - ${profile.medicalConditions || "none"}.
ETA: ${etaText}`;
  }
}

export async function generatePoliceCorridorAlert(params: {
  hospitalName: string;
  etaMinutes: number;
  trafficStatus: "Light" | "Moderate" | "Heavy";
  directionsUrl: string;
}): Promise<string> {
  const { hospitalName, etaMinutes, trafficStatus, directionsUrl } = params;

  const prompt = `
You are an emergency traffic coordination assistant in India. Write one short WhatsApp-style alert to traffic police for creating an ambulance corridor.

Context:
- Destination hospital: ${hospitalName}
- Ambulance ETA: ${etaMinutes} minutes
- Traffic status: ${trafficStatus}
- Directions URL: ${directionsUrl}

Write 1-2 sentences. Mention the destination hospital, ETA, traffic status, and ask police to clear signals and junctions on the route. Do not invent specific junction names unless present in the URL.
`.trim();

  try {
    return await callGemma(prompt);
  } catch {
    return `Ambulance en route to ${hospitalName}. ETA ${etaMinutes} minutes with ${trafficStatus.toLowerCase()} traffic. Please clear signals and junctions on the route: ${directionsUrl}`;
  }
}
