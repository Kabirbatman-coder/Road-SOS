import { magnitude3d } from "@/src/lib/crashDetection";

export interface RawSensorSample {
  timestamp: number;
  accX: number;
  accY: number;
  accZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

export interface AccidentMlFeatures {
  acc_x_mean: number;
  acc_x_std: number;
  acc_x_max: number;
  acc_x_min: number;
  acc_x_range: number;
  acc_y_mean: number;
  acc_y_std: number;
  acc_y_max: number;
  acc_y_min: number;
  acc_y_range: number;
  acc_z_mean: number;
  acc_z_std: number;
  acc_z_max: number;
  acc_z_min: number;
  acc_z_range: number;
  gyro_x_mean: number;
  gyro_x_std: number;
  gyro_x_max: number;
  gyro_x_min: number;
  gyro_x_range: number;
  gyro_y_mean: number;
  gyro_y_std: number;
  gyro_y_max: number;
  gyro_y_min: number;
  gyro_y_range: number;
  gyro_z_mean: number;
  gyro_z_std: number;
  gyro_z_max: number;
  gyro_z_min: number;
  gyro_z_range: number;
  acc_mag_mean: number;
  acc_mag_max: number;
  acc_mag_std: number;
  jerk_mean: number;
  jerk_max: number;
  jerk_std: number;
  gyro_mag_mean: number;
  gyro_mag_max: number;
  roll_mean: number;
  pitch_mean: number;
  acc_energy: number;
}

export const ML_FEATURE_ORDER: Array<keyof AccidentMlFeatures> = [
  "acc_x_mean",
  "acc_x_std",
  "acc_x_max",
  "acc_x_min",
  "acc_x_range",
  "acc_y_mean",
  "acc_y_std",
  "acc_y_max",
  "acc_y_min",
  "acc_y_range",
  "acc_z_mean",
  "acc_z_std",
  "acc_z_max",
  "acc_z_min",
  "acc_z_range",
  "gyro_x_mean",
  "gyro_x_std",
  "gyro_x_max",
  "gyro_x_min",
  "gyro_x_range",
  "gyro_y_mean",
  "gyro_y_std",
  "gyro_y_max",
  "gyro_y_min",
  "gyro_y_range",
  "gyro_z_mean",
  "gyro_z_std",
  "gyro_z_max",
  "gyro_z_min",
  "gyro_z_range",
  "acc_mag_mean",
  "acc_mag_max",
  "acc_mag_std",
  "jerk_mean",
  "jerk_max",
  "jerk_std",
  "gyro_mag_mean",
  "gyro_mag_max",
  "roll_mean",
  "pitch_mean",
  "acc_energy"
];

function clean(value: number) {
  return Number.isFinite(value) && !Number.isNaN(value) ? value : 0;
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function std(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const avg = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - avg) ** 2)));
}

function stats(values: number[]) {
  const safeValues = values.map(clean);
  const max = safeValues.length ? Math.max(...safeValues) : 0;
  const min = safeValues.length ? Math.min(...safeValues) : 0;

  return {
    mean: clean(mean(safeValues)),
    std: clean(std(safeValues)),
    max: clean(max),
    min: clean(min),
    range: clean(max - min)
  };
}

export function trimSensorSamples(
  samples: RawSensorSample[],
  now = Date.now(),
  windowMs = 5000
) {
  return samples.filter((sample) => now - sample.timestamp <= windowMs);
}

export function extractAccidentMlFeatures(samples: RawSensorSample[]): AccidentMlFeatures {
  const usable = samples.length ? samples : [{ timestamp: 0, accX: 0, accY: 0, accZ: 0, gyroX: 0, gyroY: 0, gyroZ: 0 }];
  const accX = stats(usable.map((sample) => sample.accX));
  const accY = stats(usable.map((sample) => sample.accY));
  const accZ = stats(usable.map((sample) => sample.accZ));
  const gyroX = stats(usable.map((sample) => sample.gyroX));
  const gyroY = stats(usable.map((sample) => sample.gyroY));
  const gyroZ = stats(usable.map((sample) => sample.gyroZ));
  const accMagnitudes = usable.map((sample) => magnitude3d(sample.accX, sample.accY, sample.accZ));
  const gyroMagnitudes = usable.map((sample) => magnitude3d(sample.gyroX, sample.gyroY, sample.gyroZ));
  const accMagStats = stats(accMagnitudes);
  const gyroMagStats = stats(gyroMagnitudes);
  const jerks = usable.slice(1).map((sample, index) => {
    const previous = usable[index];
    const dt = Math.max(0.001, (sample.timestamp - previous.timestamp) / 1000);
    return Math.abs(accMagnitudes[index + 1] - accMagnitudes[index]) / dt;
  });
  const jerkStats = stats(jerks);
  const rolls = usable.map((sample) => Math.atan2(sample.accY, sample.accZ));
  const pitches = usable.map((sample) =>
    Math.atan2(-sample.accX, Math.sqrt(sample.accY * sample.accY + sample.accZ * sample.accZ))
  );
  const accEnergy = mean(accMagnitudes.map((value) => value * value));

  const features: AccidentMlFeatures = {
    acc_x_mean: accX.mean,
    acc_x_std: accX.std,
    acc_x_max: accX.max,
    acc_x_min: accX.min,
    acc_x_range: accX.range,
    acc_y_mean: accY.mean,
    acc_y_std: accY.std,
    acc_y_max: accY.max,
    acc_y_min: accY.min,
    acc_y_range: accY.range,
    acc_z_mean: accZ.mean,
    acc_z_std: accZ.std,
    acc_z_max: accZ.max,
    acc_z_min: accZ.min,
    acc_z_range: accZ.range,
    gyro_x_mean: gyroX.mean,
    gyro_x_std: gyroX.std,
    gyro_x_max: gyroX.max,
    gyro_x_min: gyroX.min,
    gyro_x_range: gyroX.range,
    gyro_y_mean: gyroY.mean,
    gyro_y_std: gyroY.std,
    gyro_y_max: gyroY.max,
    gyro_y_min: gyroY.min,
    gyro_y_range: gyroY.range,
    gyro_z_mean: gyroZ.mean,
    gyro_z_std: gyroZ.std,
    gyro_z_max: gyroZ.max,
    gyro_z_min: gyroZ.min,
    gyro_z_range: gyroZ.range,
    acc_mag_mean: accMagStats.mean,
    acc_mag_max: accMagStats.max,
    acc_mag_std: accMagStats.std,
    jerk_mean: jerkStats.mean,
    jerk_max: jerkStats.max,
    jerk_std: jerkStats.std,
    gyro_mag_mean: gyroMagStats.mean,
    gyro_mag_max: gyroMagStats.max,
    roll_mean: clean(mean(rolls)),
    pitch_mean: clean(mean(pitches)),
    acc_energy: clean(accEnergy)
  };

  return ML_FEATURE_ORDER.reduce((normalized, key) => {
    normalized[key] = clean(features[key]);
    return normalized;
  }, {} as AccidentMlFeatures);
}
