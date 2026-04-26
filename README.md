# DigitalTwin Conveyer Belt

> Real-time predictive monitoring, AI-powered defect detection, and maintenance management for industrial conveyor belt systems.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript) ![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js) ![Python](https://img.shields.io/badge/Python-FastAPI-009688?logo=fastapi) ![Three.js](https://img.shields.io/badge/Three.js-3D-black?logo=three.js)

---

## What is BeltGuard AI?

BeltGuard AI is a full-stack **Industrial IoT Digital Twin** platform for conveyor belt monitoring in steel plants, coal handling, and mining operations. It combines:

- **Live sensor telemetry** — load, temperature, vibration, speed, UDL streamed every 2 seconds
- **Physics-informed ML predictions** — remaining belt life, tear / burst / overheat / misalignment risk
- **Computer vision defect detection** — AI-classified holes, tears, edge damage, layer peeling with real images
- **3D Digital Twin** — interactive Three.js belt model with thermal overlays and defect markers
- **AI Chat Assistant** — GPT-4o-mini (or rule-based fallback) answering maintenance questions in context
- **Work Order Management** — assign tasks to engineers via WhatsApp, Email, SMS, Jira, ServiceNow, IBM Maximo
- **CCTV Camera Feeds** — live video with CCTV overlay, left/right crop views, fullscreen popup

---

## Project Structure

```
DigitalTwin/
├── frontend/          # React 18 + Vite + TypeScript + Tailwind CSS
├── backend/           # Node.js + Express + TypeScript (REST API + WebSocket)
├── ml-service/        # Python FastAPI (ML predictions + AI chat)
└── docs/              # API and architecture documentation
```

---

## Quick Start

### Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 18+ | https://nodejs.org |
| Python | 3.10+ | https://python.org |
| npm | 9+ | bundled with Node |
| pip | latest | bundled with Python |

---

### Step 1 — Install dependencies

**Backend**
```bash
cd backend
npm install
npm run dev
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**ML Service**
```bash
cd ml-service
pip install -r requirements.txt
python main.py
```

---

### Step 2 — Configure environment variables

**Backend** (`backend/.env`):
```bash
cd backend
cp .env.example .env
```
```env
PORT=8000
NODE_ENV=development
ML_SERVICE_URL=http://localhost:8001
CORS_ORIGIN=*
```

**ML Service** (`ml-service/.env`):
```bash
cd ml-service
cp .env.example .env
```
```env
ML_PORT=8001
BACKEND_URL=http://localhost:8000
# Optional — enables GPT-4o-mini AI chat. Without it, rule-based engine is used.
OPENAI_API_KEY=sk-...
```

> The app works fully without an OpenAI key. The AI chat falls back to a built-in rule-based engine that answers all standard belt health questions.

---

### Step 3 — Start all three services

Open **three separate terminals**:

**Terminal 1 — Backend API**
```bash
cd backend
npm run dev
# Listening on http://localhost:8000
```

**Terminal 2 — ML Service**
```bash
cd ml-service
python main.py
# Listening on http://localhost:8001
```

**Terminal 3 — Frontend**
```bash
cd frontend
npm run dev
# Listening on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

### Step 4 — Production build

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
# Serve the dist/ folder with nginx, Vercel, or any static host

# ML Service
cd ml-service
uvicorn main:app --host 0.0.0.0 --port 8001
```

---

## User Guide — Every Feature

### Belt Selector (Top Bar)

The top bar shows the currently monitored belt. Click the belt name to open the selector — choose from **45 real steel-plant conveyor belts** across 9 plant areas:

| Area | Belts |
|------|-------|
| Raw Material Handling | Iron Ore Belt 1 & 2, Limestone, Dolomite, Fine Ore |
| Coal & Coke Handling | Coal Belt 1 & 2, Coke Transfer, PCI Coal |
| Sinter Plant | Sinter Feed, Return Fines, Hot Sinter, Cooling |
| Blast Furnace Area | Burden Belt, Charging Belt, Stock House 1 & 2 |
| Pellet Plant | Pellet Feed, Green Pellet, Fired Pellet, Transfer |
| Slag Handling | Slag Belt 1 & 2, Hot Slag, Disposal |
| Rolling Mill | Billet Transfer, Slab Transfer, Cooling Bed |
| Yard & Dispatch | Yard Conveyor 1 & 2, Stacker, Reclaimer, Wagon Loading |
| Special Purpose | Inclined, Decline, Cross Transfer, Emergency Bypass |

Switching belts resets the AI chat context and updates all predictions.

---

### Dashboard (`/dashboard`)

Main overview page with live data:

- **6 KPI cards** — Belt Health %, Speed (m/s), Current Load (kg/m), Temperature (°C), Remaining Life (hrs), Active Alerts
- **Load Trend chart** — 30-minute UDL history with hover tooltips
- **Health & Tear Risk gauges** — circular gauge charts with color thresholds
- **Risk Analysis bars** — Tear, Burst, Overheat, Misalignment probability bars
- **Recent Alerts** — last 5 unacknowledged alerts with severity badges

All data auto-refreshes every 2–3 seconds.

---

### Digital Twin (`/digital-twin`)

Interactive 3D visualization using Three.js / React Three Fiber:

- **3D belt model** — animated conveyor belt with material flow particles
- **Thermal overlay** — color-coded heat zones along the belt length
- **Defect markers** — 3D markers at detected defect positions
- **Orbit controls** — drag to rotate, scroll to zoom
- **Belt animation** — surface moves at the current live belt speed

---

### Load Analysis (`/load`)

Detailed load and stress analysis:

- **Point Load** (kN) and **UDL** (kg/m) live readings
- **Peak Stress** (MPa) calculation
- **Impact Velocity** and **Drop Height** from material feed
- **Mass Flow Rate** (kg/s) and **Deposition Rate** (kg/m²/s)
- Historical trend charts

---

### Sensors (`/sensors`)

Live sensor dashboard for all 6 channels:

| Sensor | Unit | Warning | Critical |
|--------|------|---------|---------|
| Load Cell | kg | > 380 | > 480 |
| Impact Force | kN | — | > 30 |
| Belt Speed | m/s | — | > 5.5 |
| Temperature | °C | > 60 | > 80 |
| Vibration | mm/s | > 5 | > 10 |
| UDL | kg/m | > 350 | > 450 |

- Real-time line charts (last 30 minutes)
- Color-coded status indicators
- WebSocket for instant push updates

---

### Thermal (`/thermal`)

Thermal zone monitoring along the belt:

- **Zone map** — temperature across all idler zones
- **Hotspot detection** — zones exceeding thresholds highlighted
- **Friction index** — per-zone coefficient (0–1)
- **Status badges** — Normal / Warning / Critical per zone

---

### Vision (`/vision`)

AI-powered computer vision defect detection:

**Category Summary Cards** — counts with background preview images:

| Type | Color | Images | Description |
|------|-------|--------|-------------|
| Tear | Red | 5 | Longitudinal / transverse belt tears |
| Hole | Orange | 6 | Punctures and through-holes |
| Edge Damage | Amber | 7 | Fraying, cracking, delamination |
| Layer Peeling | Purple | 9 | Cover rubber separating from carcass |

**Detection Grid** — each card shows:
- Real defect image matched to detection type (deterministic by detection ID)
- Confidence % with progress bar
- Belt position (% along belt)
- Bounding box dimensions (px)
- Detection timestamp and ID
- Hover → "View full image" → click for fullscreen lightbox

**Filter controls** — by defect type and severity (High / Medium / Low)

**Live Camera Views:**

| Camera | Source | Description |
|--------|--------|-------------|
| Front View (CAM-01) | `front_view.mp4` — full width | Head-on belt view |
| Side Left (CAM-02) | `front_view.mp4` — left half crop | Left side of belt |
| Side Right (CAM-03) | `front_view.mp4` — right half crop | Right side of belt |
| Bottom View (CAM-04) | Image slideshow | Thermal underside |

All active cameras show CCTV overlays: scanlines, vignette, blinking REC dot, live ticking timestamp, mute icon, corner bracket markers.

**Click "Full Screen"** on any video camera → fullscreen popup with the video looping, full CCTV overlays, press Escape to close.

---

### ML Prediction (`/prediction`)

Core predictive intelligence:

- **Model Confidence Banner** — confidence % and next maintenance date
- **Anomaly Forecast Cards** — 4 cards: days to event, probability %, severity badge, animated bar
- **Belt Life Timeline** — remaining life vs. 2000h total with maintenance marker
- **Gauge Charts** — Remaining Life %, Tear Risk %, Burst Risk %, Overheat Risk %
- **Detailed Risk Breakdown** — horizontal bars with time-to-event labels
- **Summary Cards** — Maintenance Window, Remaining Life, Overall Risk Level
- **Smart Insights** — auto-generated maintenance recommendations

---

### Alerts (`/alerts`)

Alert management:

- All active and historical alerts sorted by severity
- **Severity levels**: Info (blue) / Warning (amber) / Critical (red)
- **Alert types**: Overload, Impact Spike, Heat Alert, Tear Risk, Misalignment, Speed Anomaly, Vibration Spike
- Acknowledge individual alerts or bulk-acknowledge all
- Alerts auto-generate from the simulator when thresholds are breached
- High-severity vision detections also generate alerts

---

### Work Orders (`/work-orders`)

Maintenance task assignment and notification:

**Tagged Issues** — tag alerts, vision detections, or belt positions before sending:
- **Alerts tab** — search and tag live alerts
- **Vision Detections tab** — tag defect detections with ID, position, confidence
- **Belt Position tab** — search any of the 45 belts, enter a position (e.g. `12.5m`, `Zone 3`, `Head Pulley`)

Tagged items appear as colored chips and auto-append reference lines to the task description.

**Task Details** — Title, Description, Priority (Low / Medium / High / Critical), Due Date

**Notification Channels:**

| Channel | Ticket Format | Use Case |
|---------|--------------|---------|
| WhatsApp | MSG-XXXXX | Instant field notification |
| Email | MSG-XXXXX | Formal work order |
| SMS | MSG-XXXXX | Mobile text alert |
| Jira | BELT-XXXXX | Software-style ticket |
| ServiceNow | SN-XXXXX | ITSM work order |
| IBM Maximo | WO-XXXXX | EAM work order |

**Engineer Roster:**

| Name | Role | Specialty |
|------|------|-----------|
| Rajesh Kumar | Chief / Head | Belt Systems, Root Cause Analysis |
| Priya Sharma | Maintenance Senior | Conveyor Belts, Tension Adjustment |
| Arjun Mehta | Maintenance Tech | Belt Splicing, Pulley Alignment |
| Sunita Patel | Quality Control | Defect Analysis, ISO Compliance |
| Vikram Singh | Field Service | Emergency Response, Belt Tracking |
| Deepa Nair | Thermal Specialist | Thermal Imaging, Friction Reduction |
| Karan Joshi | Electrical & Controls | VFD Control, Sensor Calibration |
| Meera Iyer | HSE Safety | LOTO Procedures, Incident Investigation |

- Filter by role — All / Head / Maintenance / Quality / Service / Thermal / Electrical / Safety
- **SUGGESTED** badge on engineers matching the current anomaly type
- Workload bar per engineer (green < 60%, amber 60–80%, red > 80%)
- Online / offline availability dot

After sending, a collapsible log shows all dispatched tickets with refs, priority, and timestamp.

---

### Belt Config (`/config`)

Belt configuration management:

- View and edit physical parameters: width, thickness, length, speed, material type
- Tensile strength, hardness (Shore A), elastic modulus
- Create new belt configurations
- Persisted in the backend in-memory store

---

### AI Chat (Floating Button — bottom right)

The floating green bot button opens the BeltGuard AI chat panel:

- **Context-aware** — knows the selected belt, live sensor readings, and ML predictions
- **Quick-ask chips** — Tear risk, Temperature status, Maintenance when, Vibration analysis, Remaining life, Overall health
- **GPT-4o-mini** when `OPENAI_API_KEY` is set — full conversational AI with markdown responses
- **Rule-based fallback** — built-in expert engine, no API key required
- Chat history persists per session; resets on belt switch

---

## API Reference

### Backend REST API — port 8000

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Service health check |
| GET | `/api/dashboard/summary` | KPI summary |
| GET | `/api/belts` | List belt configurations |
| POST | `/api/belts` | Create belt config |
| PUT | `/api/belts/:id` | Update belt config |
| GET | `/api/sensors/live` | Latest sensor reading |
| GET | `/api/sensors/history?minutes=30` | Sensor history |
| GET | `/api/load/live` | Latest load analysis |
| GET | `/api/thermal/zones` | All thermal zones |
| GET | `/api/vision/detections` | Latest 20 vision detections |
| GET | `/api/alerts` | All alerts (max 100) |
| PATCH | `/api/alerts/:id/acknowledge` | Acknowledge alert |

### WebSocket — port 8000, path `/ws`

Receives `live_update` every 2 seconds:

```json
{
  "type": "live_update",
  "sensor": { "loadCell": 245, "temperature": 38.2, "vibration": 2.1, ... },
  "alerts": [ { "id": "...", "severity": "warning", "message": "..." } ],
  "ts": "2026-04-24T10:00:00Z"
}
```

### ML Service REST API — port 8001

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/predict` | Auto-fetch sensors from backend and predict |
| POST | `/predict` | Predict from provided sensor payload |
| GET | `/health` | ML service health check |
| POST | `/chat` | AI chat with belt context |

**POST /predict:**
```json
{
  "load_cell": 250, "impact_force": 9.0, "belt_speed": 2.5,
  "temperature": 38.0, "vibration": 2.2, "udl": 210.0
}
```

**POST /chat:**
```json
{
  "message": "What is the tear risk?",
  "history": [],
  "context": {
    "belt": { "id": "RM-IRONORE-01", "name": "Iron Ore Belt 1", "material": "Iron Ore" },
    "prediction": { "tear_probability": 0.23, "remaining_life_hours": 847 },
    "sensors": { "temperature": 38.2, "vibration": 2.1, "load_cell": 245 }
  }
}
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (React 18)                    │
│                                                           │
│  Dashboard  Digital Twin  Vision  ML Prediction           │
│  Sensors    Thermal       Alerts  Work Orders  Config     │
│                                                           │
│  TanStack Query (polling + caching)  Zustand (state)      │
└──────────────┬───────────────────────────┬───────────────┘
               │ REST /api/*               │ REST /ml/*
               │ WebSocket /ws             │ (proxied by Vite)
               ▼                           ▼
┌─────────────────────────┐   ┌──────────────────────────────┐
│  Node.js / Express      │   │  Python / FastAPI             │
│  Backend  :8000         │   │  ML Service  :8001            │
│                         │   │                               │
│  Sensor simulator       │◄──│  GET /predict                 │
│  In-memory data store   │   │   → fetches /api/sensors/live │
│  REST API routes        │   │   → runs BeltPredictor        │
│  WebSocket server       │   │  POST /predict (direct)       │
│  Alert generation       │   │  POST /chat                   │
└─────────────────────────┘   │   → LangChain + GPT-4o-mini   │
                              │   → rule-based fallback        │
                              └──────────────────────────────┘
```

**Data flow:**
1. Backend simulator generates sensor readings every 2 s → stored in memory ring buffer
2. Frontend polls `/api/sensors/live` every 2 s and `/api/sensors/history` for charts
3. ML service polls `/api/sensors/live` every 10 s → runs physics-informed predictor → returns risk scores
4. Frontend polls `/ml/predict` every 10 s → updates all prediction UI
5. WebSocket pushes live sensor + alert updates to all connected clients instantly
6. Vision detections generated every ~60 s by simulator
7. Alerts auto-generated when sensor thresholds are breached

---

## Tech Stack

### Frontend
| Library | Version | Purpose |
|---------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool and dev server |
| Tailwind CSS | 3 | Utility-first styling |
| Framer Motion | 11 | Animations and transitions |
| TanStack Query | 5 | Server state, caching, polling |
| Zustand | 4 | Client state (theme, belt selection) |
| React Router | 6 | Client-side routing |
| Three.js + R3F | 0.165 | 3D Digital Twin rendering |
| Chart.js | 4 | Line charts and gauges |
| Lucide React | 0.395 | Icon library |
| React Markdown | 9 | Markdown in AI chat |
| Axios | 1.7 | HTTP client |

### Backend
| Library | Version | Purpose |
|---------|---------|---------|
| Express | 4 | HTTP server and routing |
| TypeScript | 5 | Type safety |
| ws | 8 | WebSocket server |
| helmet | 7 | Security headers |
| cors | 2 | Cross-origin requests |
| morgan | 1 | HTTP request logging |
| uuid | 10 | Unique ID generation |
| ts-node-dev | 2 | Hot reload in development |

### ML Service
| Library | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.111 | Async HTTP framework |
| Pydantic | 2.7 | Request/response validation |
| scikit-learn | 1.5 | ML model infrastructure |
| numpy | 1.26 | Numerical computation |
| LangChain | 0.2 | LLM orchestration |
| langchain-openai | 0.1 | GPT-4o-mini integration |
| httpx | 0.27 | Async HTTP client |
| uvicorn | 0.30 | ASGI server |

---

## Developer Guide

### Adding a new sensor channel

1. Add field to `SensorReading` in `backend/src/types/index.ts`
2. Generate it in `backend/src/simulator.ts`
3. Add to `SensorFeatures` in `ml-service/models/belt_predictor.py`
4. Update frontend type in `frontend/src/types/index.ts`
5. Display in `frontend/src/pages/SensorsPage.tsx`

### Replacing the rule-based predictor with a trained ML model

Edit `ml-service/models/belt_predictor.py` — replace the `predict()` body:

```python
import joblib
import numpy as np

# Load once at module level
_model = joblib.load("models/belt_rf_model.pkl")

def predict(self, features: SensorFeatures) -> PredictionResult:
    X = np.array([[
        features.load_cell, features.impact_force, features.belt_speed,
        features.temperature, features.vibration, features.udl
    ]])
    preds = _model.predict(X)[0]
    return PredictionResult(
        remaining_life_hours=preds[0],
        tear_probability=preds[1],
        # ...
    )
```

### Adding a new page

1. Create `frontend/src/pages/MyPage.tsx`
2. Add route in `frontend/src/App.tsx`: `<Route path="my-page" element={<MyPage />} />`
3. Add nav item in `frontend/src/components/layout/Sidebar.tsx`

### Connecting real sensors (replacing the simulator)

Edit `backend/src/simulator.ts` — replace `setInterval` with your data source:

```typescript
// MQTT example
import mqtt from 'mqtt';
const client = mqtt.connect('mqtt://your-broker:1883');
client.subscribe('plant/belt/sensors');
client.on('message', (_topic, payload) => {
  const reading = JSON.parse(payload.toString()) as SensorReading;
  pushSensor(reading);
});
```

Supported protocols: MQTT, OPC-UA, Modbus TCP, REST webhooks, Kafka.

### Remote access via ngrok

```bash
# Expose backend
ngrok http 8000

# Expose ML service
ngrok http 8001
```

Update `frontend/vite.config.ts` proxy targets with the ngrok URLs. The backend and ML service already include `ngrok-skip-browser-warning` headers on all responses.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | HTTP server port |
| `NODE_ENV` | `development` | Environment mode |
| `ML_SERVICE_URL` | `http://localhost:8001` | ML service base URL |
| `CORS_ORIGIN` | `*` | Allowed CORS origins |

### ML Service (`ml-service/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `ML_PORT` | `8001` | FastAPI server port |
| `BACKEND_URL` | `http://localhost:8000` | Backend URL for sensor fetching |
| `OPENAI_API_KEY` | _(empty)_ | Enables GPT-4o-mini AI chat |

---

## Troubleshooting

**Frontend shows no data**
- Confirm backend is running on port 8000
- Check browser console for CORS or network errors
- Verify `vite.config.ts` proxy targets match your backend URL

**ML predictions not updating**
- Confirm ML service is running on port 8001
- Check `BACKEND_URL` in `ml-service/.env`
- The frontend uses mock prediction data when ML service is unreachable — this is by design

**AI chat only shows rule-based responses**
- Add `OPENAI_API_KEY` to `ml-service/.env` and restart the ML service
- Without the key the rule-based engine handles all questions — it covers all standard belt health queries

**Video not playing in Vision page**
- Confirm `frontend/src/assets/front_view.mp4` exists
- Browser autoplay policy requires a user gesture — click "View" to activate the feed

**Port conflicts**
```bash
# Backend on different port
echo "PORT=8080" >> backend/.env

# ML service on different port
echo "ML_PORT=8002" >> ml-service/.env

# Update vite.config.ts proxy targets to match
```

---

## License

MIT — free to use, modify, and distribute.

---

*Built for industrial conveyor belt monitoring in steel, coal, and mining operations.*
