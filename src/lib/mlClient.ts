import type { AccidentMlFeatures } from "@/src/lib/mlFeatureExtraction";

export type MlPredictionLabel = "accident" | "normal";
export type MlRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface MlPredictionContext {
  gpsSpeedKmh: number | null;
  wasMoving: boolean;
  postImpactStillness: boolean;
  suddenSpeedDrop: boolean;
}

export interface MlPredictionResult {
  prediction: MlPredictionLabel;
  probability: number;
  riskLevel: MlRiskLevel;
  modelUsed: boolean;
}

const API_URL = process.env.EXPO_PUBLIC_ML_API_URL ?? "";
const REQUEST_TIMEOUT_MS = 3000;

export function getMlApiBaseUrl() {
  return API_URL.replace(/\/$/, "");
}

export async function checkMlBackendHealth() {
  const baseUrl = getMlApiBaseUrl();
  if (!baseUrl) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetch(`${baseUrl}/health`, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return false;
    }

    const json = (await response.json()) as { modelLoaded?: boolean };
    return Boolean(json.modelLoaded);
  } catch {
    return false;
  }
}

export async function predictAccident(
  features: AccidentMlFeatures,
  context: MlPredictionContext
): Promise<MlPredictionResult | null> {
  const baseUrl = getMlApiBaseUrl();
  if (!baseUrl) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const response = await fetch(`${baseUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ features, context }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as MlPredictionResult;
    return {
      prediction: json.prediction === "accident" ? "accident" : "normal",
      probability: Math.max(0, Math.min(1, Number(json.probability) || 0)),
      riskLevel: json.riskLevel ?? "LOW",
      modelUsed: Boolean(json.modelUsed)
    };
  } catch {
    return null;
  }
}
