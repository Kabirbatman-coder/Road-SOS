import type { LocationSnapshot, SensorVector } from "@/src/types";

export type CrashRiskLevel =
  | "Normal"
  | "Unusual Motion"
  | "Possible Crash"
  | "Critical Crash";

export type CrashDetectionState =
  | "MONITORING"
  | "POSSIBLE_IMPACT"
  | "CONFIRMATION_WINDOW"
  | "SOS_COUNTDOWN_READY"
  | "COOLDOWN";

export interface MotionSample {
  timestamp: number;
  accelerationMagnitude: number;
  gyroMagnitude: number;
  speedKmh: number | null;
}

export interface ImpactSnapshot {
  timestamp: number;
  latitude: number | null;
  longitude: number | null;
  speedBeforeImpactKmh: number | null;
  accelerationPeak: number;
  gyroPeak: number;
}

export interface CrashDetectionContext {
  state: CrashDetectionState;
  rideStartedAt: number;
  hasMovedAbove10Kmh: boolean;
  impact: ImpactSnapshot | null;
  cooldownUntil: number | null;
}

export interface SensorSnapshot {
  accelerometer: SensorVector;
  gyroscope: SensorVector;
  currentGpsSpeedMps?: number | null;
  previousGpsSpeedMps?: number | null;
  speedBeforeImpactKmh?: number | null;
  riderWasMovingBeforeEvent?: boolean;
  speedDropDetected?: boolean;
  postImpactStillnessDetected?: boolean;
  shakePatternDetected?: boolean;
  manualBoost?: number;
  impactAccelerationPeak?: number;
  impactGyroPeak?: number;
}

export interface CrashScoreBreakdown {
  accelerationMagnitude: number;
  gyroMagnitude: number;
  currentSpeedKmh: number | null;
  previousSpeedKmh: number | null;
  speedBeforeImpactKmh: number | null;
  riderWasMovingBeforeEvent: boolean;
  speedDropDetected: boolean;
  postImpactStillnessDetected: boolean;
  shakePatternDetected: boolean;
  impactScore: number;
  rotationScore: number;
  movingScore: number;
  speedDropScore: number;
  stillnessScore: number;
  shakePenalty: number;
  notMovingPenalty: number;
  manualScore: number;
  crashConfidence: number;
  riskLevel: CrashRiskLevel;
}

export interface CrashDetectionInput {
  accelerometer: SensorVector;
  gyroscope: SensorVector;
  location: LocationSnapshot;
  previousGpsSpeedMps?: number | null;
  samples: MotionSample[];
  context: CrashDetectionContext;
  monitoringActive: boolean;
  now?: number;
}

export interface CrashDetectionResult {
  context: CrashDetectionContext;
  state: CrashDetectionState;
  breakdown: CrashScoreBreakdown;
  detectedReasons: string[];
  ignoredReason: string | null;
  rideDurationSeconds: number;
  hasMovedAbove10Kmh: boolean;
  speedDropDetected: boolean;
  postImpactStillnessDetected: boolean;
  shakePatternDetected: boolean;
}

const MIN_RIDE_DURATION_SECONDS = 15;
const MOVEMENT_ARMING_SPEED_KMH = 10;
const POSSIBLE_IMPACT_G = 3.5;
const HIGH_IMPACT_G = 5;
const ROTATION_SPIKE_RAD_PER_SECOND = 5;
const CONFIRMATION_WINDOW_SECONDS = 8;
const CONFIRMATION_TIMEOUT_SECONDS = 10;
const COOLDOWN_SECONDS = 20;
const COUNTDOWN_THRESHOLD = 75;

const emptyVector: SensorVector = { x: 0, y: 0, z: 0 };

export function createInitialCrashDetectionContext(now = Date.now()): CrashDetectionContext {
  return {
    state: "MONITORING",
    rideStartedAt: now,
    hasMovedAbove10Kmh: false,
    impact: null,
    cooldownUntil: null
  };
}

export function magnitude3d(x: number, y: number, z: number) {
  return Math.sqrt(x * x + y * y + z * z);
}

export function kmhFromMetersPerSecond(speed?: number | null) {
  if (speed === undefined || speed === null || Number.isNaN(speed) || speed < 0) {
    return null;
  }

  return speed * 3.6;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getRiskLevel(score: number): CrashRiskLevel {
  if (score >= 90) {
    return "Critical Crash";
  }

  if (score >= 75) {
    return "Possible Crash";
  }

  if (score >= 50) {
    return "Unusual Motion";
  }

  return "Normal";
}

function samplesInWindow(samples: MotionSample[], now: number, seconds: number) {
  const start = now - seconds * 1000;
  return samples.filter((sample) => sample.timestamp >= start && sample.timestamp <= now);
}

function samplesAfter(samples: MotionSample[], timestamp: number, now: number) {
  return samples.filter((sample) => sample.timestamp >= timestamp && sample.timestamp <= now);
}

function maxRecentSpeedKmh(samples: MotionSample[], now: number, seconds: number) {
  const speeds = samplesInWindow(samples, now, seconds)
    .map((sample) => sample.speedKmh)
    .filter((speed): speed is number => speed !== null && speed >= 0);

  return speeds.length ? Math.max(...speeds) : null;
}

function minPostImpactSpeedKmh(samples: MotionSample[]) {
  const speeds = samples
    .map((sample) => sample.speedKmh)
    .filter((speed): speed is number => speed !== null && speed >= 0);

  return speeds.length ? Math.min(...speeds) : null;
}

export function detectShakePattern(samples: MotionSample[]) {
  if (samples.length < 6) {
    return false;
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const durationSeconds = (last.timestamp - first.timestamp) / 1000;

  if (durationSeconds < 3) {
    return false;
  }

  const spikeSamples = samples.filter(
    (sample) => sample.accelerationMagnitude > 2.2 || sample.gyroMagnitude > 3.5
  );
  const spikeRatio = spikeSamples.length / samples.length;

  // A real crash should have one impact followed by confirmation. Repeated
  // motion spikes for several seconds usually mean the phone is being shaken
  // by hand, so the state machine rejects it before any SOS countdown.
  return spikeSamples.length >= 6 && spikeRatio >= 0.45;
}

export function detectPostImpactStillness(samples: MotionSample[]) {
  if (samples.length < 8) {
    return false;
  }

  const first = samples[0];
  const last = samples[samples.length - 1];
  const durationSeconds = (last.timestamp - first.timestamp) / 1000;

  if (durationSeconds < 8) {
    return false;
  }

  const stableSamples = samples.filter(
    (sample) =>
      sample.accelerationMagnitude >= 0.75 &&
      sample.accelerationMagnitude <= 1.25 &&
      sample.gyroMagnitude <= 0.45
  );
  const stableRatio = stableSamples.length / samples.length;

  // Stillness after impact is a strong crash confirmation signal. It prevents
  // a single throw, shake, or rapid rotation from immediately becoming an SOS.
  return stableRatio >= 0.72;
}

export function calculateCrashScore(input: SensorSnapshot): CrashScoreBreakdown {
  const accelerationMagnitude = magnitude3d(
    input.accelerometer.x,
    input.accelerometer.y,
    input.accelerometer.z
  );
  const gyroMagnitude = magnitude3d(input.gyroscope.x, input.gyroscope.y, input.gyroscope.z);
  const currentSpeedKmh = kmhFromMetersPerSecond(input.currentGpsSpeedMps);
  const previousSpeedKmh = kmhFromMetersPerSecond(input.previousGpsSpeedMps);
  const speedBeforeImpactKmh =
    input.speedBeforeImpactKmh ?? previousSpeedKmh ?? currentSpeedKmh ?? null;
  const accelerationPeak = input.impactAccelerationPeak ?? accelerationMagnitude;
  const gyroPeak = input.impactGyroPeak ?? gyroMagnitude;
  const riderWasMovingBeforeEvent = Boolean(input.riderWasMovingBeforeEvent);
  const speedDropDetected =
    Boolean(input.speedDropDetected) ||
    (speedBeforeImpactKmh !== null && currentSpeedKmh !== null && speedBeforeImpactKmh > 15 && currentSpeedKmh < 5);
  const postImpactStillnessDetected = Boolean(input.postImpactStillnessDetected);
  const shakePatternDetected = Boolean(input.shakePatternDetected);

  const impactScore = accelerationPeak > HIGH_IMPACT_G ? 40 : accelerationPeak > POSSIBLE_IMPACT_G ? 25 : 0;
  const rotationScore = gyroPeak > ROTATION_SPIKE_RAD_PER_SECOND ? 15 : 0;
  const movingScore = riderWasMovingBeforeEvent ? 20 : 0;
  const speedDropScore = speedDropDetected ? 20 : 0;
  const stillnessScore = postImpactStillnessDetected ? 25 : 0;
  const shakePenalty = shakePatternDetected ? -35 : 0;
  const notMovingPenalty = !riderWasMovingBeforeEvent && impactScore > 0 ? -30 : 0;
  const manualScore = Math.max(0, Math.min(input.manualBoost ?? 0, 100));
  const crashConfidence = clampScore(
    impactScore +
      rotationScore +
      movingScore +
      speedDropScore +
      stillnessScore +
      shakePenalty +
      notMovingPenalty +
      manualScore
  );

  return {
    accelerationMagnitude,
    gyroMagnitude,
    currentSpeedKmh,
    previousSpeedKmh,
    speedBeforeImpactKmh,
    riderWasMovingBeforeEvent,
    speedDropDetected,
    postImpactStillnessDetected,
    shakePatternDetected,
    impactScore,
    rotationScore,
    movingScore,
    speedDropScore,
    stillnessScore,
    shakePenalty,
    notMovingPenalty,
    manualScore,
    crashConfidence,
    riskLevel: getRiskLevel(crashConfidence)
  };
}

function buildDetectedReasons(breakdown: CrashScoreBreakdown) {
  const reasons: string[] = [];

  if (breakdown.impactScore >= 40) {
    reasons.push("High impact detected");
  } else if (breakdown.impactScore > 0) {
    reasons.push("Strong impact detected");
  }

  if (breakdown.rotationScore > 0) {
    reasons.push("Sharp rotation detected");
  }

  if (breakdown.movingScore > 0) {
    reasons.push("Rider movement confirmed before impact");
  }

  if (breakdown.speedDropScore > 0) {
    reasons.push("Sudden speed drop detected");
  }

  if (breakdown.stillnessScore > 0) {
    reasons.push("Post-impact stillness detected");
  }

  if (breakdown.shakePenalty < 0) {
    reasons.push("Continuous shaking pattern detected");
  }

  if (breakdown.manualScore > 0) {
    reasons.push("Backup demo trigger activated");
  }

  return reasons.length ? reasons : ["Live readings are within normal ride range"];
}

export function getCrashReasons(breakdown: CrashScoreBreakdown) {
  return buildDetectedReasons(breakdown);
}

function scoreForState(input: {
  accelerometer: SensorVector;
  gyroscope: SensorVector;
  currentGpsSpeedMps?: number | null;
  previousGpsSpeedMps?: number | null;
  riderWasMovingBeforeEvent: boolean;
  impact: ImpactSnapshot | null;
  speedDropDetected?: boolean;
  postImpactStillnessDetected?: boolean;
  shakePatternDetected?: boolean;
}) {
  return calculateCrashScore({
    accelerometer: input.accelerometer,
    gyroscope: input.gyroscope,
    currentGpsSpeedMps: input.currentGpsSpeedMps,
    previousGpsSpeedMps: input.previousGpsSpeedMps,
    speedBeforeImpactKmh: input.impact?.speedBeforeImpactKmh ?? null,
    riderWasMovingBeforeEvent: input.riderWasMovingBeforeEvent,
    impactAccelerationPeak: input.impact?.accelerationPeak,
    impactGyroPeak: input.impact?.gyroPeak,
    speedDropDetected: input.speedDropDetected,
    postImpactStillnessDetected: input.postImpactStillnessDetected,
    shakePatternDetected: input.shakePatternDetected
  });
}

export function updateCrashDetectionState(input: CrashDetectionInput): CrashDetectionResult {
  const now = input.now ?? Date.now();
  const currentSpeedKmh = kmhFromMetersPerSecond(input.location.speedMps);
  const accelerationMagnitude = magnitude3d(
    input.accelerometer.x,
    input.accelerometer.y,
    input.accelerometer.z
  );
  const gyroMagnitude = magnitude3d(input.gyroscope.x, input.gyroscope.y, input.gyroscope.z);
  const rideDurationSeconds = Math.max(0, (now - input.context.rideStartedAt) / 1000);
  const hasMovedAbove10Kmh =
    input.context.hasMovedAbove10Kmh ||
    Boolean(currentSpeedKmh !== null && currentSpeedKmh > MOVEMENT_ARMING_SPEED_KMH) ||
    input.samples.some(
      (sample) => sample.speedKmh !== null && sample.speedKmh > MOVEMENT_ARMING_SPEED_KMH
    );
  const context: CrashDetectionContext = {
    ...input.context,
    hasMovedAbove10Kmh
  };
  const currentSample: MotionSample = {
    timestamp: now,
    accelerationMagnitude,
    gyroMagnitude,
    speedKmh: currentSpeedKmh
  };
  const samples = [...input.samples, currentSample].filter(
    (sample) => now - sample.timestamp <= 10000
  );
  const activeWindowReady =
    input.monitoringActive &&
    rideDurationSeconds >= MIN_RIDE_DURATION_SECONDS &&
    hasMovedAbove10Kmh;
  const possibleImpact = accelerationMagnitude > POSSIBLE_IMPACT_G;
  const highImpact = accelerationMagnitude > HIGH_IMPACT_G;

  let nextContext: CrashDetectionContext = context;
  let ignoredReason: string | null = null;
  let speedDropDetected = false;
  let postImpactStillnessDetected = false;
  let shakePatternDetected = false;
  let breakdown = scoreForState({
    accelerometer: input.accelerometer,
    gyroscope: input.gyroscope,
    currentGpsSpeedMps: input.location.speedMps,
    previousGpsSpeedMps: input.previousGpsSpeedMps,
    riderWasMovingBeforeEvent: activeWindowReady,
    impact: context.impact
  });

  if (!input.monitoringActive) {
    ignoredReason = "Ignored: monitoring paused";
  } else if (context.state === "COOLDOWN") {
    if (context.cooldownUntil && now < context.cooldownUntil) {
      ignoredReason = "Ignored: cooldown active";
      nextContext = context;
    } else {
      nextContext = {
        ...context,
        state: "MONITORING",
        impact: null,
        cooldownUntil: null
      };
    }
  }

  if (nextContext.state === "MONITORING") {
    if (!hasMovedAbove10Kmh) {
      ignoredReason = "Ignored: rider not moving";
    }

    if (rideDurationSeconds < MIN_RIDE_DURATION_SECONDS && hasMovedAbove10Kmh) {
      ignoredReason = "Ignored: ride warm-up active";
    }

    if (possibleImpact && !activeWindowReady) {
      // Movement context is required because phone shakes while stationary are
      // common during demos and should never become crash events by themselves.
      ignoredReason = "Ignored: rider not moving";
      nextContext = {
        ...context,
        state: "COOLDOWN",
        impact: null,
        cooldownUntil: now + COOLDOWN_SECONDS * 1000
      };
    } else if (possibleImpact && activeWindowReady) {
      const recentSpeed = maxRecentSpeedKmh(samples, now, 10);
      const speedBeforeImpactKmh =
        input.previousGpsSpeedMps !== undefined
          ? kmhFromMetersPerSecond(input.previousGpsSpeedMps)
          : recentSpeed;
      const impact: ImpactSnapshot = {
        timestamp: now,
        latitude: input.location.latitude,
        longitude: input.location.longitude,
        speedBeforeImpactKmh: speedBeforeImpactKmh ?? recentSpeed ?? currentSpeedKmh,
        accelerationPeak: accelerationMagnitude,
        gyroPeak: gyroMagnitude
      };

      nextContext = {
        ...context,
        state: "POSSIBLE_IMPACT",
        impact,
        cooldownUntil: null
      };
      breakdown = scoreForState({
        accelerometer: input.accelerometer,
        gyroscope: input.gyroscope,
        currentGpsSpeedMps: input.location.speedMps,
        previousGpsSpeedMps: input.previousGpsSpeedMps,
        riderWasMovingBeforeEvent: true,
        impact
      });
      ignoredReason = highImpact ? null : ignoredReason;
    }
  } else if (nextContext.state === "POSSIBLE_IMPACT" && nextContext.impact) {
    const elapsedSeconds = (now - nextContext.impact.timestamp) / 1000;
    const updatedImpact = {
      ...nextContext.impact,
      accelerationPeak: Math.max(nextContext.impact.accelerationPeak, accelerationMagnitude),
      gyroPeak: Math.max(nextContext.impact.gyroPeak, gyroMagnitude)
    };

    nextContext = {
      ...nextContext,
      impact: updatedImpact,
      state: elapsedSeconds >= 0.5 ? "CONFIRMATION_WINDOW" : "POSSIBLE_IMPACT"
    };
    breakdown = scoreForState({
      accelerometer: input.accelerometer,
      gyroscope: input.gyroscope,
      currentGpsSpeedMps: input.location.speedMps,
      previousGpsSpeedMps: input.previousGpsSpeedMps,
      riderWasMovingBeforeEvent: true,
      impact: updatedImpact
    });
  } else if (nextContext.state === "CONFIRMATION_WINDOW" && nextContext.impact) {
    const elapsedSeconds = (now - nextContext.impact.timestamp) / 1000;
    const postImpactSamples = samplesAfter(samples, nextContext.impact.timestamp + 500, now);
    const updatedImpact = {
      ...nextContext.impact,
      accelerationPeak: Math.max(nextContext.impact.accelerationPeak, accelerationMagnitude),
      gyroPeak: Math.max(nextContext.impact.gyroPeak, gyroMagnitude)
    };
    const minSpeedAfterImpactKmh = minPostImpactSpeedKmh(postImpactSamples);

    speedDropDetected =
      updatedImpact.speedBeforeImpactKmh !== null &&
      updatedImpact.speedBeforeImpactKmh > 15 &&
      minSpeedAfterImpactKmh !== null &&
      minSpeedAfterImpactKmh < 5;
    postImpactStillnessDetected = detectPostImpactStillness(postImpactSamples);
    shakePatternDetected = detectShakePattern(postImpactSamples);

    breakdown = scoreForState({
      accelerometer: input.accelerometer,
      gyroscope: input.gyroscope,
      currentGpsSpeedMps: input.location.speedMps,
      previousGpsSpeedMps: input.previousGpsSpeedMps,
      riderWasMovingBeforeEvent: true,
      impact: updatedImpact,
      speedDropDetected,
      postImpactStillnessDetected,
      shakePatternDetected
    });

    nextContext = {
      ...nextContext,
      impact: updatedImpact
    };

    if (shakePatternDetected && elapsedSeconds >= 3) {
      ignoredReason = "Ignored: phone shaking pattern";
      nextContext = {
        ...nextContext,
        state: "COOLDOWN",
        impact: null,
        cooldownUntil: now + COOLDOWN_SECONDS * 1000
      };
    } else if (
      elapsedSeconds >= CONFIRMATION_WINDOW_SECONDS &&
      breakdown.crashConfidence >= COUNTDOWN_THRESHOLD &&
      (speedDropDetected || postImpactStillnessDetected)
    ) {
      nextContext = {
        ...nextContext,
        state: "SOS_COUNTDOWN_READY",
        impact: updatedImpact,
        cooldownUntil: null
      };
    } else if (elapsedSeconds >= CONFIRMATION_TIMEOUT_SECONDS) {
      ignoredReason = "Ignored: no post-impact confirmation";
      nextContext = {
        ...nextContext,
        state: "COOLDOWN",
        impact: null,
        cooldownUntil: now + COOLDOWN_SECONDS * 1000
      };
    } else {
      ignoredReason = "Ignored: waiting for post-impact confirmation";
    }
  } else if (nextContext.state === "SOS_COUNTDOWN_READY" && nextContext.impact) {
    postImpactStillnessDetected = true;
    breakdown = scoreForState({
      accelerometer: input.accelerometer,
      gyroscope: input.gyroscope,
      currentGpsSpeedMps: input.location.speedMps,
      previousGpsSpeedMps: input.previousGpsSpeedMps,
      riderWasMovingBeforeEvent: true,
      impact: nextContext.impact,
      postImpactStillnessDetected: true
    });
  }

  return {
    context: nextContext,
    state: nextContext.state,
    breakdown,
    detectedReasons: buildDetectedReasons(breakdown),
    ignoredReason,
    rideDurationSeconds,
    hasMovedAbove10Kmh,
    speedDropDetected,
    postImpactStillnessDetected,
    shakePatternDetected
  };
}

export function shouldStartCountdown(
  result: CrashDetectionResult,
  threshold = COUNTDOWN_THRESHOLD
) {
  const scoreThreshold = Math.max(threshold, COUNTDOWN_THRESHOLD);

  return (
    result.state === "SOS_COUNTDOWN_READY" &&
    result.breakdown.crashConfidence >= scoreThreshold &&
    result.hasMovedAbove10Kmh &&
    (result.speedDropDetected || result.postImpactStillnessDetected)
  );
}

export const crashDetectionConstants = {
  MIN_RIDE_DURATION_SECONDS,
  MOVEMENT_ARMING_SPEED_KMH,
  POSSIBLE_IMPACT_G,
  HIGH_IMPACT_G,
  ROTATION_SPIKE_RAD_PER_SECOND,
  CONFIRMATION_WINDOW_SECONDS,
  CONFIRMATION_TIMEOUT_SECONDS,
  COOLDOWN_SECONDS,
  COUNTDOWN_THRESHOLD
};
