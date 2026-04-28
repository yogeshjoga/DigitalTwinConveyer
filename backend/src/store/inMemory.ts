/**
 * In-memory data store — replace with a real DB (PostgreSQL / InfluxDB) in production.
 * InfluxDB is recommended for time-series sensor data.
 * PostgreSQL is recommended for belt configs and alerts.
 */
import { v4 as uuid } from 'uuid';
import type { BeltConfig, SensorReading, Alert, ThermalZone, VisionDetection } from '../types';

// ── Belt configs ──────────────────────────────────────────────────────────────
export const belts: BeltConfig[] = [
  {
    id: uuid(),
    name: 'Main Conveyor — Level 1',
    width: 1200,
    thickness: 20,
    length: 50,
    speed: 2.5,
    materialType: 'Rubber',
    tensileStrength: 800,
    hardness: 65,
    elasticModulus: 0.05,
    createdAt: new Date().toISOString(),
  },
];

// ── Sensor history ring buffer (last 500 readings) ────────────────────────────
export const sensorHistory: SensorReading[] = [];
export const MAX_HISTORY = 500;

export function pushSensor(r: SensorReading) {
  sensorHistory.push(r);
  if (sensorHistory.length > MAX_HISTORY) sensorHistory.shift();
}

// ── Alerts ────────────────────────────────────────────────────────────────────
export const alerts: Alert[] = [];
export const MAX_ALERTS = 500;

export function pushAlert(a: Alert) {
  alerts.unshift(a);
  if (alerts.length > MAX_ALERTS) alerts.pop();
}

// ── Thermal zones (static layout, updated by simulator) ──────────────────────
export const thermalZones: ThermalZone[] = Array.from({ length: 10 }, (_, i) => ({
  id: uuid(),
  position: (i + 1) * 5,
  temperature: 25 + Math.random() * 20,
  status: 'normal',
  frictionIndex: Math.random() * 0.3,
}));

// ── Vision detections ─────────────────────────────────────────────────────────
export const visionDetections: VisionDetection[] = [];

// ── PLC / HMI State ───────────────────────────────────────────────────────────
import type { PLCState, PLCCommand, PLCAutoRule, PLCNotification } from '../types';

export const plcState: PLCState & {
  autoStopReason: string | null;
  restartGated: boolean;
  restartClearedBy: 'ticket' | 'defects' | null;
} = {
  beltId: belts[0].id,
  beltState: 'running',
  speedSetpoint: 2.5,
  actualSpeed: 2.5,
  autoResponseEnabled: true,
  autoStopReason: null,
  restartGated: false,
  restartClearedBy: null,
  interlocks: [
    {
      id: uuid(),
      name: 'Emergency Pull Cord',
      active: true,
      preventStart: true,
      description: 'Pull-cord safety switch along belt length',
    },
    {
      id: uuid(),
      name: 'Zero Speed Switch',
      active: true,
      preventStart: false,
      description: 'Detects belt slip or stall condition',
    },
    {
      id: uuid(),
      name: 'Safety Gate',
      active: true,
      preventStart: true,
      description: 'Access gate to motor/pulley area',
    },
    {
      id: uuid(),
      name: 'Overload Relay',
      active: true,
      preventStart: false,
      description: 'Motor thermal overload protection',
    },
  ],
  motors: [
    {
      id: uuid(),
      name: 'Head Pulley Motor',
      currentDraw: 18.5,
      windingTemp: 52,
      rpm: 1450,
      status: 'running',
    },
    {
      id: uuid(),
      name: 'Tail Pulley Motor',
      currentDraw: 14.2,
      windingTemp: 48,
      rpm: 1450,
      status: 'running',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

export const plcCommandLog: PLCCommand[] = [];
export const MAX_COMMANDS = 200;

export function pushPLCCommand(cmd: PLCCommand) {
  plcCommandLog.unshift(cmd);
  if (plcCommandLog.length > MAX_COMMANDS) plcCommandLog.pop();
}

export const plcAutoRules: PLCAutoRule[] = [
  {
    id: uuid(),
    name: 'Sustained Overload → E-Stop',
    condition: 'Load Cell > 480 kg for 10 min',
    action: 'Emergency stop belt',
    enabled: true,
    triggerCount: 0,
    metric: 'loadCell',
    threshold: 480,
    operator: '>',
    triggerAction: 'E_STOP',
    cooldownSeconds: 600,   // 10 min cooldown after trigger
  },
  {
    id: uuid(),
    name: 'Critical Impact Force → E-Stop',
    condition: 'Impact Force > 40 kN for 10 min',
    action: 'Emergency stop belt',
    enabled: true,
    triggerCount: 0,
    metric: 'impactForce',
    threshold: 40,
    operator: '>',
    triggerAction: 'E_STOP',
    cooldownSeconds: 600,
  },
  {
    id: uuid(),
    name: 'Vision Critical Defect → E-Stop',
    condition: '2+ high-severity detections in 10 min',
    action: 'Emergency stop belt',
    enabled: true,
    triggerCount: 0,
    metric: 'visionConfidence',
    threshold: 0.85,
    operator: '>',
    triggerAction: 'E_STOP',
    cooldownSeconds: 600,
  },
  {
    id: uuid(),
    name: 'High Load → Reduce Speed',
    condition: 'UDL > 420 kg/m',
    action: 'Reduce speed to 1.5 m/s',
    enabled: true,
    triggerCount: 0,
    metric: 'udl',
    threshold: 420,
    operator: '>',
    triggerAction: 'REDUCE_SPEED',
    reduceSpeedTo: 1.5,
    cooldownSeconds: 60,
  },
  {
    id: uuid(),
    name: 'High Temperature → Stop',
    condition: 'Temperature > 100°C for 10 min',
    action: 'Stop belt and alert operator',
    enabled: true,
    triggerCount: 0,
    metric: 'temperature',
    threshold: 100,
    operator: '>',
    triggerAction: 'STOP',
    cooldownSeconds: 600,
  },
  {
    id: uuid(),
    name: 'Vibration Spike → Alert Only',
    condition: 'Vibration > 12 mm/s',
    action: 'Trigger alarm, continue running',
    enabled: true,
    triggerCount: 0,
    metric: 'vibration',
    threshold: 12,
    operator: '>',
    triggerAction: 'ALERT_ONLY',
    cooldownSeconds: 30,
  },
];

// ── PLC Notifications ─────────────────────────────────────────────────────────
export const plcNotifications: PLCNotification[] = [];
export const MAX_NOTIFICATIONS = 100;

export function pushPLCNotification(n: PLCNotification) {
  plcNotifications.unshift(n);
  if (plcNotifications.length > MAX_NOTIFICATIONS) plcNotifications.pop();
}
