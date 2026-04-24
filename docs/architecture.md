# BeltGuard AI — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FIELD LAYER                              │
│  Load Cells │ Impact Sensors │ Speed Sensors │ Thermal Cameras  │
│             │ RGB Cameras    │ Vibration Sensors                │
└──────────────────────────┬──────────────────────────────────────┘
                           │ MQTT / OPC-UA / Modbus
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        EDGE LAYER                               │
│  Edge Gateway (Raspberry Pi / Industrial PC)                    │
│  - Local buffering                                              │
│  - Protocol translation                                         │
│  - Basic threshold alerting                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │ REST / WebSocket
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                              │
│  Node.js + Express (port 8000)                                  │
│  ├── /api/dashboard   — KPI summary                            │
│  ├── /api/belts       — Belt configuration CRUD                │
│  ├── /api/sensors     — Live + historical readings             │
│  ├── /api/load        — Physics-based load analysis            │
│  ├── /api/thermal     — Thermal zone data                      │
│  ├── /api/vision      — CV detection results                   │
│  └── /api/alerts      — Alert management                       │
│  WebSocket /ws        — Live push to dashboard                 │
└──────────┬──────────────────────────┬───────────────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐      ┌───────────────────────────────────────┐
│   ML SERVICE     │      │           FRONTEND                    │
│  Python FastAPI  │      │  React 18 + Vite + TypeScript         │
│  (port 8001)     │      │  Three.js / @react-three/fiber        │
│                  │      │  TanStack Query (polling)             │
│  /predict GET    │      │  Zustand (global state)               │
│  /predict POST   │      │  Chart.js (time-series charts)        │
│  /health         │      │  Framer Motion (animations)           │
└──────────────────┘      └───────────────────────────────────────┘
```

## Data Flow

1. Sensors → Edge → Backend (REST ingest or WebSocket push)
2. Backend stores readings in memory (→ replace with InfluxDB for production)
3. Frontend polls Backend every 2–5s via TanStack Query
4. Frontend polls ML Service every 10s for predictions
5. WebSocket pushes live updates to all connected dashboards
6. Alerts generated server-side, acknowledged via REST

## 3D Model Integration

The Digital Twin page uses a procedural Three.js belt by default.

To integrate a Unity or Blender model:
1. Export from Unity (File → Export → glTF 2.0) or Blender (File → Export → glTF 2.0)
2. Place the `.glb` file at `frontend/public/models/conveyor_belt.glb`
3. In `frontend/src/components/three/ConveyorBelt.tsx`, replace the procedural geometry with:

```tsx
import { useGLTF } from '@react-three/drei';

export default function ConveyorBelt({ speed }: { speed: number }) {
  const { scene, animations } = useGLTF('/models/conveyor_belt.glb');
  // Animate belt texture / bones here
  return <primitive object={scene} />;
}
```

All overlays (thermal, defect markers, material particles) will continue to work around the imported model.

## Production Recommendations

| Concern | Recommendation |
|---------|---------------|
| Time-series data | InfluxDB or TimescaleDB |
| Belt configs / alerts | PostgreSQL |
| ML model serving | TorchServe or BentoML |
| Real-time push | MQTT broker (Mosquitto) |
| Auth | JWT + role-based access |
| Deployment | Docker Compose → Kubernetes |
| Camera streams | WebRTC or RTSP → HLS |
