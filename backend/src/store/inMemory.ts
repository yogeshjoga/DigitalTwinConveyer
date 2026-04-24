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
