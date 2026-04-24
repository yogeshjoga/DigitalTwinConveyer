// ─── Belt Configuration ───────────────────────────────────────────────────────
export interface BeltConfig {
  id: string;
  name: string;
  width: number;          // mm
  thickness: number;      // mm
  length: number;         // m
  speed: number;          // m/s  (1–6)
  materialType: string;
  tensileStrength: number; // N/mm²
  hardness: number;        // Shore A
  elasticModulus: number;  // GPa
  createdAt: string;
}

// ─── Sensor Reading ───────────────────────────────────────────────────────────
export interface SensorReading {
  timestamp: string;
  loadCell: number;        // kg
  impactForce: number;     // kN
  beltSpeed: number;       // m/s
  temperature: number;     // °C
  vibration: number;       // mm/s
  udl: number;             // kg/m
}

// ─── Load Analysis ────────────────────────────────────────────────────────────
export interface LoadAnalysis {
  timestamp: string;
  pointLoad: number;       // kN
  udl: number;             // kg/m
  peakStress: number;      // MPa
  impactVelocity: number;  // m/s
  dropHeight: number;      // m
  massFlowRate: number;    // kg/s
  depositionRate: number;  // kg/m²/s
}

// ─── Thermal Zone ─────────────────────────────────────────────────────────────
export interface ThermalZone {
  id: string;
  position: number;        // m along belt
  temperature: number;     // °C
  status: 'normal' | 'warning' | 'critical';
  frictionIndex: number;   // 0–1
}

// ─── Vision Detection ─────────────────────────────────────────────────────────
export type DefectType = 'tear' | 'hole' | 'edge_damage' | 'layer_peeling' | 'none';

export interface VisionDetection {
  id: string;
  timestamp: string;
  defectType: DefectType;
  confidence: number;      // 0–1
  position: { x: number; y: number; w: number; h: number };
  severity: 'low' | 'medium' | 'high';
  imageUrl?: string;
}

// ─── ML Prediction ────────────────────────────────────────────────────────────
export interface MLPrediction {
  timestamp: string;
  remainingLifeHours: number;
  tearProbability: number;   // 0–1
  burstRisk: number;         // 0–1
  overheatRisk: number;      // 0–1
  misalignmentRisk: number;  // 0–1
  maintenanceWindowHours: number;
  confidenceScore: number;   // 0–1
}

// ─── Alert ────────────────────────────────────────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType =
  | 'overload'
  | 'impact_spike'
  | 'heat_alert'
  | 'tear_risk'
  | 'misalignment'
  | 'speed_anomaly'
  | 'vibration_spike';

export interface Alert {
  id: string;
  timestamp: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  value?: number;
  unit?: string;
  acknowledged: boolean;
}

// ─── Dashboard Summary ────────────────────────────────────────────────────────
export interface DashboardSummary {
  beltHealth: number;          // 0–100
  activeAlerts: number;
  criticalAlerts: number;
  remainingLifeHours: number;
  currentLoad: number;         // kg/m
  beltSpeed: number;           // m/s
  temperature: number;         // °C
  tearProbability: number;     // 0–1
  uptime: number;              // hours
  lastInspection: string;
}
