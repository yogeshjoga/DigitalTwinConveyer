/**
 * Sensor data simulator — generates realistic conveyor belt readings.
 * Replace with real sensor integration (MQTT, OPC-UA, Modbus, etc.)
 */
import { v4 as uuid } from 'uuid';
import {
  pushSensor,
  pushAlert,
  thermalZones,
  visionDetections,
  alerts,
} from './store/inMemory';
import type { SensorReading, Alert, VisionDetection } from './types';

let tick = 0;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function noise(base: number, pct: number) {
  return base + (Math.random() - 0.5) * 2 * base * pct;
}

export function startSimulator(intervalMs = 2000) {
  setInterval(() => {
    tick++;

    // Simulate occasional anomalies
    const isAnomaly = Math.random() < 0.05;

    const reading: SensorReading = {
      timestamp:   new Date().toISOString(),
      loadCell:    clamp(noise(250, 0.15) + (isAnomaly ? 200 : 0), 0, 600),
      impactForce: clamp(noise(8, 0.2)   + (isAnomaly ? 15 : 0),  0, 50),
      beltSpeed:   clamp(noise(2.5, 0.05), 1, 6),
      temperature: clamp(noise(35, 0.1)  + (isAnomaly ? 30 : 0),  20, 120),
      vibration:   clamp(noise(2, 0.2)   + (isAnomaly ? 8 : 0),   0, 20),
      udl:         clamp(noise(200, 0.15) + (isAnomaly ? 150 : 0), 50, 500),
    };

    pushSensor(reading);

    // Update thermal zones
    thermalZones.forEach((zone) => {
      zone.temperature = clamp(
        zone.temperature + (Math.random() - 0.48) * 2,
        20,
        120
      );
      zone.frictionIndex = clamp(zone.frictionIndex + (Math.random() - 0.5) * 0.02, 0, 1);
      zone.status =
        zone.temperature > 80 ? 'critical' :
        zone.temperature > 60 ? 'warning'  : 'normal';
    });

    // Generate alerts based on thresholds
    if (reading.loadCell > 480) {
      pushAlert({
        id:           uuid(),
        timestamp:    reading.timestamp,
        type:         'overload',
        severity:     'critical',
        message:      `Load cell reading ${reading.loadCell.toFixed(0)} kg exceeds critical threshold (480 kg)`,
        value:        reading.loadCell,
        unit:         'kg',
        acknowledged: false,
      });
    } else if (reading.loadCell > 380) {
      pushAlert({
        id:           uuid(),
        timestamp:    reading.timestamp,
        type:         'overload',
        severity:     'warning',
        message:      `Load cell reading ${reading.loadCell.toFixed(0)} kg approaching limit`,
        value:        reading.loadCell,
        unit:         'kg',
        acknowledged: false,
      });
    }

    if (reading.temperature > 80) {
      pushAlert({
        id:           uuid(),
        timestamp:    reading.timestamp,
        type:         'heat_alert',
        severity:     reading.temperature > 100 ? 'critical' : 'warning',
        message:      `Temperature ${reading.temperature.toFixed(1)}°C detected — check friction zones`,
        value:        reading.temperature,
        unit:         '°C',
        acknowledged: false,
      });
    }

    if (reading.vibration > 10) {
      pushAlert({
        id:           uuid(),
        timestamp:    reading.timestamp,
        type:         'vibration_spike',
        severity:     'warning',
        message:      `Vibration spike ${reading.vibration.toFixed(1)} mm/s — possible misalignment`,
        value:        reading.vibration,
        unit:         'mm/s',
        acknowledged: false,
      });
    }

    // Simulate occasional vision detections
    if (tick % 15 === 0) {
      const defects = ['tear', 'hole', 'edge_damage', 'layer_peeling', 'none'] as const;
      const defect  = defects[Math.floor(Math.random() * defects.length)];
      const detection: VisionDetection = {
        id:         uuid(),
        timestamp:  new Date().toISOString(),
        defectType: defect,
        confidence: 0.7 + Math.random() * 0.3,
        position:   {
          x: 0.05 + Math.random() * 0.85,          // 0–1 normalised belt position
          y: 0.05 + Math.random() * 0.85,
          w: 0.04 + Math.random() * 0.18,           // 0–1 normalised width  (~50–280 px at 1280)
          h: 0.03 + Math.random() * 0.14,           // 0–1 normalised height (~22–120 px at 720)
        },
        severity: defect === 'none' ? 'low' :
                  Math.random() > 0.7 ? 'high' :
                  Math.random() > 0.4 ? 'medium' : 'low',
      };

      visionDetections.unshift(detection);
      if (visionDetections.length > 50) visionDetections.pop();

      if (defect !== 'none' && detection.severity === 'high') {
        pushAlert({
          id:           uuid(),
          timestamp:    detection.timestamp,
          type:         'tear_risk',
          severity:     'critical',
          message:      `Vision: ${defect.replace('_', ' ')} detected with ${(detection.confidence * 100).toFixed(0)}% confidence`,
          acknowledged: false,
        });
      }
    }
  }, intervalMs);

  console.log('[Simulator] Started — generating sensor data every', intervalMs, 'ms');
}
