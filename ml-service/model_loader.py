from __future__ import annotations

from pathlib import Path
from typing import Dict, List

import joblib
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "conditionScore",
    "waterLeak",
    "wiringExposed",
    "crackWidth",
    "toiletFunctionality",
    "buildingAge",
    "totalStudents",
    "isGirlsSchool",
]

DEFAULT_IMPORTANCE = {
    "conditionScore": 1.0,
    "waterLeak": 0.9,
    "wiringExposed": 0.9,
    "crackWidth": 0.8,
    "toiletFunctionality": 0.7,
    "buildingAge": 0.7,
    "totalStudents": 0.5,
    "isGirlsSchool": 0.25,
}


class FixAheadModelService:
    def __init__(self, model_path: str | Path | None = None) -> None:
        base_dir = Path(__file__).resolve().parent
        resolved_path = Path(model_path) if model_path else base_dir.parent / "model.pkl"
        self.model_path = resolved_path.resolve()
        self.artifact = None
        self.model = None
        self.feature_columns: List[str] = FEATURE_COLUMNS.copy()
        self.feature_importance: Dict[str, float] = DEFAULT_IMPORTANCE.copy()

    def load(self) -> None:
        artifact = joblib.load(self.model_path)
        self.artifact = artifact
        self.model = artifact["model"]
        self.feature_columns = artifact.get("feature_columns", FEATURE_COLUMNS)
        self.feature_importance = artifact.get("feature_importance", DEFAULT_IMPORTANCE)

    def _frame(self, payload: Dict[str, float]) -> pd.DataFrame:
        row = {feature: payload[feature] for feature in self.feature_columns}
        return pd.DataFrame([row], columns=self.feature_columns)

    def predict(self, payload: Dict[str, float]) -> Dict[str, object]:
        if self.model is None:
            raise RuntimeError("Model has not been loaded.")

        frame = self._frame(payload)
        prediction = self.model.predict(frame)
        prediction_array = np.asarray(prediction, dtype=float)
        if prediction_array.ndim == 1:
            prediction_array = prediction_array.reshape(1, -1)

        risk_score = float(np.clip(prediction_array[0, 0], 0, 100))
        failure_window_days = int(round(float(np.clip(prediction_array[0, 1], 30, 60))))
        reason = self.generate_reason(payload)

        return {
            "riskScore": round(risk_score, 2),
            "failureWindowDays": failure_window_days,
            "reason": reason,
        }

    def generate_reason(self, payload: Dict[str, float]) -> List[str]:
        ordered_features = [
            feature
            for feature, _ in sorted(
                self.feature_importance.items(),
                key=lambda item: item[1],
                reverse=True,
            )
        ]
        top_features = set(ordered_features[:5] or FEATURE_COLUMNS)

        threshold_checks = [
            ("waterLeak", payload["waterLeak"] >= 1, "water leakage detected"),
            ("wiringExposed", payload["wiringExposed"] >= 1, "wiring exposed"),
            ("conditionScore", payload["conditionScore"] <= 45, "low condition score"),
            ("crackWidth", payload["crackWidth"] >= 3, "visible structural crack"),
            (
                "toiletFunctionality",
                payload["toiletFunctionality"] <= 60,
                "low toilet functionality",
            ),
            ("buildingAge", payload["buildingAge"] >= 25, "high building age"),
            ("totalStudents", payload["totalStudents"] >= 500, "high student load"),
            ("isGirlsSchool", payload["isGirlsSchool"] >= 1, "high priority girls school impact"),
        ]

        reasons = [
            message
            for feature, condition, message in threshold_checks
            if condition and feature in top_features
        ]

        if not reasons:
            reasons = [
                message for _, condition, message in threshold_checks if condition
            ]

        if not reasons:
            reasons = ["stable observed conditions with no dominant risk trigger"]

        return reasons[:3]
