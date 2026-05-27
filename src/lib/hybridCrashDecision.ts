import type { MlPredictionResult } from "@/src/lib/mlClient";

export interface HybridCrashDecisionInput {
  mlPrediction: MlPredictionResult | null;
  ruleScore: number;
  gpsSpeedKmh: number | null;
  wasMoving: boolean;
  postImpactStillness: boolean;
  suddenSpeedDrop: boolean;
  shakePatternDetected: boolean;
}

export interface HybridCrashDecision {
  shouldStartCountdown: boolean;
  finalDecision: "START_SOS_COUNTDOWN" | "NORMAL" | "UNUSUAL_MOTION" | "IGNORED";
  reason: string;
  reasons: string[];
}

export function makeHybridCrashDecision(input: HybridCrashDecisionInput): HybridCrashDecision {
  const reasons: string[] = [];
  const hasConfirmation = input.postImpactStillness || input.suddenSpeedDrop;

  if (input.shakePatternDetected) {
    return {
      shouldStartCountdown: false,
      finalDecision: "IGNORED",
      reason: "Ignored - phone shaking pattern",
      reasons: ["Ignored: phone shaking pattern"]
    };
  }

  if (!input.wasMoving) {
    return {
      shouldStartCountdown: false,
      finalDecision: "IGNORED",
      reason: "Ignored - rider not moving",
      reasons: ["Ignored: rider not moving"]
    };
  }

  if (input.suddenSpeedDrop) {
    reasons.push("Sudden speed drop confirmed");
  }

  if (input.postImpactStillness) {
    reasons.push("Post-impact stillness confirmed");
  }

  if (input.mlPrediction?.prediction === "accident") {
    reasons.push(`ML accident probability ${(input.mlPrediction.probability * 100).toFixed(0)}%`);
  }

  if (input.mlPrediction?.prediction === "accident" && input.mlPrediction.probability >= 0.8 && hasConfirmation) {
    return {
      shouldStartCountdown: true,
      finalDecision: "START_SOS_COUNTDOWN",
      reason: "ML accident signal plus post-impact confirmation",
      reasons
    };
  }

  if (input.mlPrediction?.prediction === "accident" && input.mlPrediction.probability >= 0.9 && input.ruleScore >= 70) {
    return {
      shouldStartCountdown: true,
      finalDecision: "START_SOS_COUNTDOWN",
      reason: "High-confidence ML signal agrees with rule score",
      reasons
    };
  }

  if (!input.mlPrediction && input.ruleScore >= 75 && hasConfirmation) {
    return {
      shouldStartCountdown: true,
      finalDecision: "START_SOS_COUNTDOWN",
      reason: "ML backend offline - rule-based confirmation used",
      reasons: [...reasons, "ML backend unavailable"]
    };
  }

  if (input.mlPrediction?.prediction === "normal" && input.ruleScore >= 95 && hasConfirmation) {
    return {
      shouldStartCountdown: true,
      finalDecision: "START_SOS_COUNTDOWN",
      reason: "Extreme rule score with confirmation overrides normal ML result",
      reasons
    };
  }

  if (!hasConfirmation && (input.mlPrediction?.prediction === "accident" || input.ruleScore >= 50)) {
    return {
      shouldStartCountdown: false,
      finalDecision: "UNUSUAL_MOTION",
      reason: "Ignored - no post-impact confirmation",
      reasons: [...reasons, "Ignored: no post-impact confirmation"]
    };
  }

  return {
    shouldStartCountdown: false,
    finalDecision: input.ruleScore >= 50 ? "UNUSUAL_MOTION" : "NORMAL",
    reason: input.ruleScore >= 50 ? "Unusual motion observed" : "Normal ride pattern",
    reasons: reasons.length ? reasons : ["Live readings are within normal ride range"]
  };
}
