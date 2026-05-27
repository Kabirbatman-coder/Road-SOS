from typing import Literal

from pydantic import BaseModel, Field


FEATURE_ORDER = [
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
    "acc_energy",
]


class AccidentFeatures(BaseModel):
    acc_x_mean: float = 0
    acc_x_std: float = 0
    acc_x_max: float = 0
    acc_x_min: float = 0
    acc_x_range: float = 0
    acc_y_mean: float = 0
    acc_y_std: float = 0
    acc_y_max: float = 0
    acc_y_min: float = 0
    acc_y_range: float = 0
    acc_z_mean: float = 0
    acc_z_std: float = 0
    acc_z_max: float = 0
    acc_z_min: float = 0
    acc_z_range: float = 0
    gyro_x_mean: float = 0
    gyro_x_std: float = 0
    gyro_x_max: float = 0
    gyro_x_min: float = 0
    gyro_x_range: float = 0
    gyro_y_mean: float = 0
    gyro_y_std: float = 0
    gyro_y_max: float = 0
    gyro_y_min: float = 0
    gyro_y_range: float = 0
    gyro_z_mean: float = 0
    gyro_z_std: float = 0
    gyro_z_max: float = 0
    gyro_z_min: float = 0
    gyro_z_range: float = 0
    acc_mag_mean: float = 0
    acc_mag_max: float = 0
    acc_mag_std: float = 0
    jerk_mean: float = 0
    jerk_max: float = 0
    jerk_std: float = 0
    gyro_mag_mean: float = 0
    gyro_mag_max: float = 0
    roll_mean: float = 0
    pitch_mean: float = 0
    acc_energy: float = 0


class PredictionContext(BaseModel):
    gpsSpeedKmh: float | None = None
    wasMoving: bool = False
    postImpactStillness: bool = False
    suddenSpeedDrop: bool = False


class PredictionRequest(BaseModel):
    features: AccidentFeatures
    context: PredictionContext = Field(default_factory=PredictionContext)


class PredictionResponse(BaseModel):
    prediction: Literal["accident", "normal"]
    probability: float
    riskLevel: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    modelUsed: bool
