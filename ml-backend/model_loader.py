from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from schemas import FEATURE_ORDER


MODEL_PATH = Path(__file__).with_name("accident_model_real.pkl")


class AccidentModelService:
    def __init__(self) -> None:
        self.model: Any | None = None
        self.error: str | None = None
        self.load()

    @property
    def loaded(self) -> bool:
        return self.model is not None

    def load(self) -> None:
        if not MODEL_PATH.exists():
            self.model = None
            self.error = f"Model file not found: {MODEL_PATH}"
            return

        try:
            self.model = joblib.load(MODEL_PATH)
            # Local Windows/Expo demos can fail when a pickled RandomForest
            # tries to spawn parallel workers from inside uvicorn. Single-threaded
            # prediction is plenty fast for one phone and avoids WinError 5.
            if hasattr(self.model, "n_jobs"):
                self.model.n_jobs = 1
            self.error = None
        except Exception as exc:  # noqa: BLE001 - startup must not crash.
            self.model = None
            self.error = str(exc)

    def predict(self, feature_values: dict[str, float]) -> tuple[str, float]:
        if self.model is None:
            raise RuntimeError(self.error or "Model is not loaded")

        ordered = [float(feature_values.get(name, 0) or 0) for name in FEATURE_ORDER]
        frame = pd.DataFrame([ordered], columns=FEATURE_ORDER)

        raw_prediction = self.model.predict(frame)[0]
        prediction = self._normalise_prediction(raw_prediction)
        probability = self._predict_probability(frame, prediction)

        return prediction, probability

    def _predict_probability(self, frame: pd.DataFrame, prediction: str) -> float:
        if not hasattr(self.model, "predict_proba"):
            return 0.75 if prediction == "accident" else 0.25

        probabilities = np.asarray(self.model.predict_proba(frame)[0], dtype=float)
        classes = list(getattr(self.model, "classes_", []))
        accident_index = self._accident_class_index(classes)

        if accident_index is None or accident_index >= len(probabilities):
            return float(np.max(probabilities)) if prediction == "accident" else float(1 - np.max(probabilities))

        return float(probabilities[accident_index])

    @staticmethod
    def _normalise_prediction(raw_prediction: Any) -> str:
        value = str(raw_prediction).strip().lower()
        if value in {"1", "true", "accident", "crash", "yes"}:
            return "accident"
        return "normal"

    @staticmethod
    def _accident_class_index(classes: list[Any]) -> int | None:
        for index, class_name in enumerate(classes):
            if str(class_name).strip().lower() in {"1", "true", "accident", "crash", "yes"}:
                return index
        if len(classes) >= 2:
            return 1
        return None


def risk_level(probability: float) -> str:
    if probability >= 0.9:
        return "CRITICAL"
    if probability >= 0.8:
        return "HIGH"
    if probability >= 0.55:
        return "MEDIUM"
    return "LOW"


model_service = AccidentModelService()
