"""
/predict endpoint — accepts latest sensor readings and returns ML predictions.
"""
from fastapi import APIRouter
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import httpx
import os

from models.belt_predictor import predictor, SensorFeatures

router = APIRouter()

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

# Safe fallback sensor values — realistic mid-range readings
FALLBACK_SENSORS = {
    "loadCell": 260.0,
    "impactForce": 9.0,
    "beltSpeed": 2.5,
    "temperature": 38.0,
    "vibration": 2.2,
    "udl": 210.0,
}


class PredictRequest(BaseModel):
    load_cell:    float = Field(..., ge=0,  le=600,  description="Load cell reading (kg)")
    impact_force: float = Field(..., ge=0,  le=50,   description="Impact force (kN)")
    belt_speed:   float = Field(..., ge=0.1,le=6,    description="Belt speed (m/s)")
    temperature:  float = Field(..., ge=0,  le=200,  description="Temperature (°C)")
    vibration:    float = Field(..., ge=0,  le=20,   description="Vibration (mm/s)")
    udl:          float = Field(..., ge=0,  le=500,  description="UDL (kg/m)")


class PredictResponse(BaseModel):
    timestamp:                str
    remaining_life_hours:     float
    tear_probability:         float
    burst_risk:               float
    overheat_risk:            float
    misalignment_risk:        float
    maintenance_window_hours: float
    confidence_score:         float
    # Extra context for AI chat
    load_cell:    float
    temperature:  float
    vibration:    float
    belt_speed:   float
    udl:          float


def _safe_float(val, default: float) -> float:
    """Return val if it's a valid finite number, else default."""
    try:
        f = float(val)
        if f != f:  # NaN check
            return default
        return f
    except (TypeError, ValueError):
        return default


@router.get("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict_from_backend():
    """Fetch latest sensor data from backend and return predictions."""
    data = FALLBACK_SENSORS.copy()
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{BACKEND_URL}/api/sensors/live",
                headers={"ngrok-skip-browser-warning": "true"},
            )
            resp.raise_for_status()
            raw = resp.json()
            # Merge only valid values
            for k, fk in [
                ("loadCell", "loadCell"), ("impactForce", "impactForce"),
                ("beltSpeed", "beltSpeed"), ("temperature", "temperature"),
                ("vibration", "vibration"), ("udl", "udl"),
            ]:
                v = _safe_float(raw.get(k), FALLBACK_SENSORS.get(fk, 0))
                data[fk] = v
    except Exception:
        pass  # use fallback

    features = SensorFeatures(
        load_cell=_safe_float(data.get("loadCell"), 260),
        impact_force=_safe_float(data.get("impactForce"), 9),
        belt_speed=max(_safe_float(data.get("beltSpeed"), 2.5), 0.1),
        temperature=_safe_float(data.get("temperature"), 38),
        vibration=_safe_float(data.get("vibration"), 2.2),
        udl=max(_safe_float(data.get("udl"), 210), 1),
    )

    result = predictor.predict(features)

    return PredictResponse(
        timestamp=datetime.now(timezone.utc).isoformat(),
        remaining_life_hours=result.remaining_life_hours,
        tear_probability=result.tear_probability,
        burst_risk=result.burst_risk,
        overheat_risk=result.overheat_risk,
        misalignment_risk=result.misalignment_risk,
        maintenance_window_hours=result.maintenance_window_hours,
        confidence_score=result.confidence_score,
        load_cell=features.load_cell,
        temperature=features.temperature,
        vibration=features.vibration,
        belt_speed=features.belt_speed,
        udl=features.udl,
    )


@router.post("/predict", response_model=PredictResponse, tags=["Prediction"])
async def predict_from_payload(body: PredictRequest):
    """Accept sensor readings directly in the request body."""
    features = SensorFeatures(
        load_cell=body.load_cell,
        impact_force=body.impact_force,
        belt_speed=max(body.belt_speed, 0.1),
        temperature=body.temperature,
        vibration=body.vibration,
        udl=max(body.udl, 1),
    )
    result = predictor.predict(features)
    return PredictResponse(
        timestamp=datetime.now(timezone.utc).isoformat(),
        remaining_life_hours=result.remaining_life_hours,
        tear_probability=result.tear_probability,
        burst_risk=result.burst_risk,
        overheat_risk=result.overheat_risk,
        misalignment_risk=result.misalignment_risk,
        maintenance_window_hours=result.maintenance_window_hours,
        confidence_score=result.confidence_score,
        load_cell=features.load_cell,
        temperature=features.temperature,
        vibration=features.vibration,
        belt_speed=features.belt_speed,
        udl=features.udl,
    )
