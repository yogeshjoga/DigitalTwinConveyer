export interface BeltConfig {
  id: string;
  name: string;
  width: number;
  thickness: number;
  length: number;
  speed: number;
  materialType: string;
  tensileStrength: number;
  hardness: number;
  elasticModulus: number;
  createdAt: string;
}

export interface SensorReading {
  timestamp: string;
  loadCell: number;
  impactForce: number;
  beltSpeed: number;
  temperature: number;
  vibration: number;
  udl: number;
}

export interface LoadAnalysis {
  timestamp: string;
  pointLoad: number;
  udl: number;
  peakStress: number;
  impactVelocity: number;
  dropHeight: number;
  massFlowRate: number;
  depositionRate: number;
}

export interface ThermalZone {
  id: string;
  position: number;
  temperature: number;
  status: 'normal' | 'warning' | 'critical';
  frictionIndex: number;
}

export type DefectType = 'tear' | 'hole' | 'edge_damage' | 'layer_peeling' | 'none';

export interface VisionDetection {
  id: string;
  timestamp: string;
  defectType: DefectType;
  confidence: number;
  position: { x: number; y: number; w: number; h: number };
  severity: 'low' | 'medium' | 'high';
  imageUrl?: string;
}

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
