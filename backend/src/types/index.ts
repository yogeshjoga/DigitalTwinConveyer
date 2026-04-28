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

// ── PLC / HMI ─────────────────────────────────────────────────────────────────

export type PLCBeltState = 'stopped' | 'starting' | 'running' | 'stopping' | 'fault' | 'e-stop';

export type PLCCommandType =
  | 'START'
  | 'STOP'
  | 'E_STOP'
  | 'RESET_FAULT'
  | 'SET_SPEED'
  | 'ACK_INTERLOCK';

export interface PLCInterlock {
  id: string;
  name: string;
  /** true = safe / closed, false = tripped / open */
  active: boolean;
  /** Whether this interlock being tripped prevents belt start */
  preventStart: boolean;
  description: string;
}

export interface PLCMotor {
  id: string;
  name: string;
  /** kW draw */
  currentDraw: number;
  /** °C winding temperature */
  windingTemp: number;
  /** rpm */
  rpm: number;
  status: 'running' | 'stopped' | 'fault' | 'starting';
}

export interface PLCState {
  beltId: string;
  beltState: PLCBeltState;
  /** Operator-commanded speed setpoint m/s */
  speedSetpoint: number;
  /** Actual measured belt speed m/s */
  actualSpeed: number;
  /** Whether auto-response rules are enabled */
  autoResponseEnabled: boolean;
  interlocks: PLCInterlock[];
  motors: PLCMotor[];
  lastUpdated: string;
}

export interface PLCCommand {
  id: string;
  timestamp: string;
  operator: string;
  command: PLCCommandType;
  value?: number;
  reason?: string;
  /** Whether the command was accepted or rejected (e.g. interlock tripped) */
  accepted: boolean;
  rejectReason?: string;
}

export interface PLCAutoRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  enabled: boolean;
  lastTriggered?: string;
  triggerCount: number;
  /** The sensor/metric field this rule watches */
  metric: 'loadCell' | 'udl' | 'temperature' | 'vibration' | 'impactForce' | 'visionConfidence';
  /** Threshold value that triggers the rule */
  threshold: number;
  /** Comparison operator */
  operator: '>' | '<' | '>=';
  /** What the PLC does when triggered */
  triggerAction: 'E_STOP' | 'STOP' | 'REDUCE_SPEED' | 'ALERT_ONLY';
  /** Target speed when triggerAction is REDUCE_SPEED */
  reduceSpeedTo?: number;
  /** Cooldown in seconds — prevents re-triggering too fast */
  cooldownSeconds: number;
  /** Timestamp of last trigger for cooldown tracking */
  lastTriggeredAt?: number;
}

export interface PLCNotification {
  id: string;
  timestamp: string;
  type: 'auto_stop' | 'auto_start' | 'auto_speed_reduce' | 'alert_only';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  ruleName: string;
  metricValue: number;
  metricUnit: string;
  read: boolean;
}
