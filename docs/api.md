# BeltGuard AI — API Reference

Base URL: `http://localhost:8000/api`

## Dashboard

### GET /dashboard/summary
Returns KPI summary for the active belt.

**Response:**
```json
{
  "beltHealth": 82,
  "activeAlerts": 3,
  "criticalAlerts": 1,
  "remainingLifeHours": 1640,
  "currentLoad": 210,
  "beltSpeed": 2.5,
  "temperature": 38,
  "tearProbability": 0.18,
  "uptime": 12,
  "lastInspection": "2026-04-21T08:00:00.000Z"
}
```

---

## Belts

### GET /belts
List all belt configurations.

### POST /belts
Create a new belt configuration.

**Body:**
```json
{
  "name": "Main Conveyor",
  "width": 1200,
  "thickness": 20,
  "length": 50,
  "speed": 2.5,
  "materialType": "Rubber",
  "tensileStrength": 800,
  "hardness": 65,
  "elasticModulus": 0.05
}
```

### PUT /belts/:id
Update a belt configuration.

### DELETE /belts/:id
Delete a belt configuration.

---

## Sensors

### GET /sensors/live
Latest sensor reading.

### GET /sensors/history?minutes=30
Sensor history for the last N minutes.

---

## Load Analysis

### GET /load/live
Physics-based load analysis from latest sensor data.

**Response:**
```json
{
  "timestamp": "...",
  "pointLoad": 8.2,
  "udl": 210,
  "peakStress": 0.86,
  "impactVelocity": 7.0,
  "dropHeight": 2.5,
  "massFlowRate": 625,
  "depositionRate": 520.8
}
```

---

## Thermal

### GET /thermal/zones
All thermal zones along the belt.

---

## Vision

### GET /vision/detections
Latest 20 vision detections.

---

## Alerts

### GET /alerts
Latest 100 alerts.

### PATCH /alerts/:id/acknowledge
Acknowledge an alert.

---

## ML Service

Base URL: `http://localhost:8001`

### GET /predict
Fetches latest sensor data from backend and returns predictions.

### POST /predict
Accepts sensor readings in body and returns predictions.

**Body:**
```json
{
  "load_cell": 250,
  "impact_force": 8,
  "belt_speed": 2.5,
  "temperature": 35,
  "vibration": 2,
  "udl": 200
}
```

**Response:**
```json
{
  "timestamp": "...",
  "remaining_life_hours": 1640.5,
  "tear_probability": 0.18,
  "burst_risk": 0.22,
  "overheat_risk": 0.12,
  "misalignment_risk": 0.09,
  "maintenance_window_hours": 1312.4,
  "confidence_score": 0.91
}
```
