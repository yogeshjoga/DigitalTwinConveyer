"""
Belt health predictor.

Currently uses a physics-informed rule-based model.
Replace `predict()` with a trained ML model (RandomForest, LSTM, etc.)
when sufficient historical data is available.

Training data schema:
  features: [load_cell, impact_force, belt_speed, temperature, vibration, udl]
  targets:  [remaining_life_hours, tear_probability, burst_risk, overheat_risk, misalignment_risk]
"""
import math
import numpy as np
from dataclasses import dataclass
from typing import List


@dataclass
class SensorFeatures:
    load_cell: float       # kg
    impact_force: float    # kN
    belt_speed: float      # m/s
    temperature: float     # °C
    vibration: float       # mm/s
    udl: float             # kg/m


@dataclass
class PredictionResult:
    remaining_life_hours: float
    tear_probability: float
    burst_risk: float
    overheat_risk: float
    misalignment_risk: float
    maintenance_window_hours: float
    confidence_score: float


class BeltPredictor:
    """
    Physics-informed rule-based predictor.
    Swap `predict()` body with model.predict() when a trained model is ready.
    """

    # Thresholds
    LOAD_MAX   = 600.0   # kg
    TEMP_MAX   = 120.0   # °C
    VIB_MAX    = 20.0    # mm/s
    UDL_MAX    = 500.0   # kg/m
    SPEED_MAX  = 6.0     # m/s

    def _normalize(self, value: float, max_val: float) -> float:
        return min(max(value / max_val, 0.0), 1.0)

    def predict(self, features: SensorFeatures) -> PredictionResult:
        # Normalized stress factors (0–1)
        load_stress  = self._normalize(features.load_cell,   self.LOAD_MAX)
        temp_stress  = self._normalize(features.temperature - 20, self.TEMP_MAX - 20)
        vib_stress   = self._normalize(features.vibration,   self.VIB_MAX)
        udl_stress   = self._normalize(features.udl,         self.UDL_MAX)
        speed_stress = self._normalize(features.belt_speed,  self.SPEED_MAX)

        # Composite degradation index (weighted)
        degradation = (
            load_stress  * 0.30 +
            temp_stress  * 0.25 +
            vib_stress   * 0.20 +
            udl_stress   * 0.15 +
            speed_stress * 0.10
        )

        # Remaining life — exponential decay model
        # At degradation=0 → 2000h, at degradation=1 → ~50h
        remaining_life = 2000 * math.exp(-3.5 * degradation)

        # Risk probabilities
        tear_probability  = min(load_stress * 0.5 + vib_stress * 0.3 + udl_stress * 0.2, 1.0)
        burst_risk        = min(load_stress * 0.6 + udl_stress * 0.4, 1.0)
        overheat_risk     = min(temp_stress * 0.7 + speed_stress * 0.3, 1.0)
        misalignment_risk = min(vib_stress * 0.6 + speed_stress * 0.4, 1.0)

        # Maintenance window — schedule before 20% remaining life
        maintenance_window = remaining_life * 0.8

        # Confidence — higher when sensors are in normal range
        confidence = max(0.6, 1.0 - degradation * 0.4)

        return PredictionResult(
            remaining_life_hours=round(remaining_life, 1),
            tear_probability=round(tear_probability, 3),
            burst_risk=round(burst_risk, 3),
            overheat_risk=round(overheat_risk, 3),
            misalignment_risk=round(misalignment_risk, 3),
            maintenance_window_hours=round(maintenance_window, 1),
            confidence_score=round(confidence, 3),
        )

    def predict_batch(self, features_list: List[SensorFeatures]) -> List[PredictionResult]:
        return [self.predict(f) for f in features_list]


# Singleton
predictor = BeltPredictor()
