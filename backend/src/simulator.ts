/**
 * Sensor data simulator + PLC auto-rule engine.
 * Replace sensor generation with real MQTT/OPC-UA integration.
 * The auto-rule engine evaluates PLCAutoRules on every tick and
 * triggers belt stop/speed-reduce + broadcasts notifications.
 */
import { v4 as uuid } from 'uuid';
import {
  pushSensor,
  pushAlert,
  thermalZones,
  visionDetections,
  alerts,
  plcState,
  plcAutoRules,
  pushPLCCommand,
  pushPLCNotification,
} from './store/inMemory';
import type { SensorReading, VisionDetection } from './types';

let tick = 0;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function noise(base: number, pct: number) {
  return base + (Math.random() - 0.5) * 2 * base * pct;
}

// ── PLC auto-rule engine ──────────────────────────────────────────────────────
function runAutoRules(reading: SensorReading, latestVisionConfidence: number) {
  if (!plcState.autoResponseEnabled) return;

  const now = Date.now();

  const metricValues: Record<string, number> = {
    loadCell:         reading.loadCell,
    udl:              reading.udl,
    temperature:      reading.temperature,
    vibration:        reading.vibration,
    impactForce:      reading.impactForce,
    visionConfidence: latestVisionConfidence,
  };

  const metricUnits: Record<string, string> = {
    loadCell:         'kg',
    udl:              'kg/m',
    temperature:      '°C',
    vibration:        'mm/s',
    impactForce:      'kN',
    visionConfidence: '%',
  };

  for (const rule of plcAutoRules) {
    if (!rule.enabled) continue;

    // Cooldown check
    if (rule.lastTriggeredAt && (now - rule.lastTriggeredAt) < rule.cooldownSeconds * 1000) continue;

    const value = metricValues[rule.metric] ?? 0;
    const displayValue = rule.metric === 'visionConfidence' ? value * 100 : value;
    const displayThreshold = rule.metric === 'visionConfidence' ? rule.threshold * 100 : rule.threshold;

    // Evaluate condition
    const triggered =
      rule.operator === '>'  ? value > rule.threshold :
      rule.operator === '>=' ? value >= rule.threshold :
      rule.operator === '<'  ? value < rule.threshold : false;

    if (!triggered) continue;

    // Don't re-trigger if belt is already stopped/e-stopped
    const beltAlreadyStopped = ['stopped', 'stopping', 'e-stop', 'fault'].includes(plcState.beltState);
    if (rule.triggerAction !== 'ALERT_ONLY' && beltAlreadyStopped) continue;

    // ── Execute action ──────────────────────────────────────────────────────
    rule.triggerCount++;
    rule.lastTriggered = new Date().toISOString();
    rule.lastTriggeredAt = now;

    const ts = new Date().toISOString();
    const unit = metricUnits[rule.metric];

    let notifType: 'auto_stop' | 'auto_speed_reduce' | 'alert_only' = 'alert_only';
    let notifTitle = '';
    let notifMsg = '';
    let severity: 'critical' | 'warning' | 'info' = 'info';

    if (rule.triggerAction === 'E_STOP') {
      plcState.beltState = 'e-stop';
      plcState.actualSpeed = 0;
      plcState.motors.forEach((m) => { m.status = 'stopped'; m.rpm = 0; m.currentDraw = 0; });
      plcState.lastUpdated = ts;
      plcState.autoStopReason = `Auto-rule "${rule.name}": ${rule.metric} = ${displayValue.toFixed(1)} ${unit} exceeded threshold ${displayThreshold}`;
      plcState.restartGated = true;
      plcState.restartClearedBy = null;
      pushPLCCommand({
        id: uuid(), timestamp: ts, operator: 'PLC Auto-Rule',
        command: 'E_STOP', accepted: true,
        reason: `Auto-rule "${rule.name}": ${rule.metric} = ${displayValue.toFixed(1)} ${unit} (threshold: ${displayThreshold})`,
      });
      notifType  = 'auto_stop';
      notifTitle = `🚨 AUTO E-STOP — ${rule.name}`;
      notifMsg   = `Belt stopped automatically. ${rule.metric === 'visionConfidence' ? 'Vision defect' : rule.metric} = ${displayValue.toFixed(1)} ${unit} exceeded threshold of ${displayThreshold}. Resolve work order ticket OR clear defects to restart.`;
      severity   = 'critical';

    } else if (rule.triggerAction === 'STOP') {
      plcState.beltState = 'stopping';
      plcState.lastUpdated = ts;
      plcState.autoStopReason = `Auto-rule "${rule.name}": ${rule.metric} = ${displayValue.toFixed(1)} ${unit}`;
      plcState.restartGated = true;
      plcState.restartClearedBy = null;
      setTimeout(() => {
        plcState.beltState = 'stopped';
        plcState.actualSpeed = 0;
        plcState.motors.forEach((m) => { m.status = 'stopped'; m.rpm = 0; m.currentDraw = 0; });
      }, 2000);
      pushPLCCommand({
        id: uuid(), timestamp: ts, operator: 'PLC Auto-Rule',
        command: 'STOP', accepted: true,
        reason: `Auto-rule "${rule.name}": ${rule.metric} = ${displayValue.toFixed(1)} ${unit}`,
      });
      notifType  = 'auto_stop';
      notifTitle = `⛔ AUTO STOP — ${rule.name}`;
      notifMsg   = `Belt stopping. ${rule.metric} = ${displayValue.toFixed(1)} ${unit} exceeded threshold of ${displayThreshold}. Resolve work order ticket OR clear defects to restart.`;
      severity   = 'critical';

    } else if (rule.triggerAction === 'REDUCE_SPEED' && rule.reduceSpeedTo != null) {
      const newSpeed = rule.reduceSpeedTo;
      plcState.speedSetpoint = newSpeed;
      if (plcState.beltState === 'running') plcState.actualSpeed = newSpeed;
      plcState.lastUpdated = ts;
      pushPLCCommand({
        id: uuid(), timestamp: ts, operator: 'PLC Auto-Rule',
        command: 'SET_SPEED', value: newSpeed, accepted: true,
        reason: `Auto-rule "${rule.name}": ${rule.metric} = ${displayValue.toFixed(1)} ${unit}`,
      });
      notifType  = 'auto_speed_reduce';
      notifTitle = `⚠️ AUTO SPEED REDUCE — ${rule.name}`;
      notifMsg   = `Belt speed reduced to ${newSpeed} m/s. ${rule.metric} = ${displayValue.toFixed(1)} ${unit} exceeded threshold of ${displayThreshold}.`;
      severity   = 'warning';

    } else if (rule.triggerAction === 'ALERT_ONLY') {
      notifType  = 'alert_only';
      notifTitle = `ℹ️ PLC ALERT — ${rule.name}`;
      notifMsg   = `${rule.metric} = ${displayValue.toFixed(1)} ${unit} exceeded threshold of ${displayThreshold}. Belt continues running.`;
      severity   = 'warning';
    }

    // Push notification (broadcast to all workers)
    pushPLCNotification({
      id: uuid(),
      timestamp: ts,
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      severity,
      ruleName: rule.name,
      metricValue: displayValue,
      metricUnit: unit,
      read: false,
    });

    // Also push as a system alert
    pushAlert({
      id: uuid(), timestamp: ts,
      type: 'overload',
      severity,
      message: notifMsg,
      acknowledged: false,
    });
  }
}

export function startSimulator(intervalMs = 2000) {
  setInterval(() => {
    tick++;

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
      zone.temperature = clamp(zone.temperature + (Math.random() - 0.48) * 2, 20, 120);
      zone.frictionIndex = clamp(zone.frictionIndex + (Math.random() - 0.5) * 0.02, 0, 1);
      zone.status = zone.temperature > 80 ? 'critical' : zone.temperature > 60 ? 'warning' : 'normal';
    });

    // Standard threshold alerts
    if (reading.loadCell > 480) {
      pushAlert({ id: uuid(), timestamp: reading.timestamp, type: 'overload', severity: 'critical',
        message: `Load cell ${reading.loadCell.toFixed(0)} kg exceeds critical threshold (480 kg)`,
        value: reading.loadCell, unit: 'kg', acknowledged: false });
    } else if (reading.loadCell > 380) {
      pushAlert({ id: uuid(), timestamp: reading.timestamp, type: 'overload', severity: 'warning',
        message: `Load cell ${reading.loadCell.toFixed(0)} kg approaching limit`,
        value: reading.loadCell, unit: 'kg', acknowledged: false });
    }
    if (reading.temperature > 80) {
      pushAlert({ id: uuid(), timestamp: reading.timestamp, type: 'heat_alert',
        severity: reading.temperature > 100 ? 'critical' : 'warning',
        message: `Temperature ${reading.temperature.toFixed(1)}°C — check friction zones`,
        value: reading.temperature, unit: '°C', acknowledged: false });
    }
    if (reading.vibration > 10) {
      pushAlert({ id: uuid(), timestamp: reading.timestamp, type: 'vibration_spike', severity: 'warning',
        message: `Vibration spike ${reading.vibration.toFixed(1)} mm/s — possible misalignment`,
        value: reading.vibration, unit: 'mm/s', acknowledged: false });
    }

    // Vision detections
    let latestVisionConfidence = 0;
    if (tick % 15 === 0) {
      const defects = ['tear', 'hole', 'edge_damage', 'layer_peeling', 'none'] as const;
      const defect  = defects[Math.floor(Math.random() * defects.length)];
      const confidence = 0.7 + Math.random() * 0.3;
      const detection: VisionDetection = {
        id: uuid(), timestamp: new Date().toISOString(), defectType: defect,
        confidence,
        position: { x: 0.05 + Math.random() * 0.85, y: 0.05 + Math.random() * 0.85,
                    w: 0.04 + Math.random() * 0.18,  h: 0.03 + Math.random() * 0.14 },
        severity: defect === 'none' ? 'low' : Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
      };
      visionDetections.unshift(detection);
      if (visionDetections.length > 50) visionDetections.pop();

      if (defect !== 'none' && detection.severity === 'high') {
        latestVisionConfidence = confidence;
        pushAlert({ id: uuid(), timestamp: detection.timestamp, type: 'tear_risk', severity: 'critical',
          message: `Vision: ${defect.replace('_', ' ')} detected with ${(confidence * 100).toFixed(0)}% confidence`,
          acknowledged: false });
      }
    }

    // ── Run PLC auto-rule engine ──────────────────────────────────────────
    runAutoRules(reading, latestVisionConfidence);

  }, intervalMs);

  console.log('[Simulator] Started — generating sensor data every', intervalMs, 'ms');
}
