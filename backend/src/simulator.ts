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

// ── Sustained-condition tracking ─────────────────────────────────────────────
// For E_STOP / STOP rules: the condition must hold continuously for
// SUSTAINED_WINDOW_MS (10 minutes) before the belt is stopped.
// This prevents transient spikes from stopping the belt.
const SUSTAINED_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Per-rule: timestamp when the condition first became true (null = not active)
const conditionFirstTrueAt: Record<string, number | null> = {};

// Vision: track high-severity detection timestamps for the 2-in-10-min rule
const highSeverityDetectionTimes: number[] = [];

// ── PLC auto-rule engine ──────────────────────────────────────────────────────
function runAutoRules(reading: SensorReading, latestVisionConfidence: number) {
  if (!plcState.autoResponseEnabled) return;

  const now = Date.now();

  // Track high-severity vision detections in a rolling 10-min window
  if (latestVisionConfidence > 0) {
    highSeverityDetectionTimes.push(now);
  }
  // Prune detections older than 10 minutes
  const cutoff10min = now - SUSTAINED_WINDOW_MS;
  while (highSeverityDetectionTimes.length && highSeverityDetectionTimes[0] < cutoff10min) {
    highSeverityDetectionTimes.shift();
  }

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

    // Don't re-trigger if belt is already stopped/e-stopped
    const beltAlreadyStopped = ['stopped', 'stopping', 'e-stop', 'fault'].includes(plcState.beltState);
    if (rule.triggerAction !== 'ALERT_ONLY' && beltAlreadyStopped) {
      conditionFirstTrueAt[rule.id] = null; // reset tracking when belt is stopped
      continue;
    }

    const value = metricValues[rule.metric] ?? 0;
    const displayValue = rule.metric === 'visionConfidence' ? value * 100 : value;
    const displayThreshold = rule.metric === 'visionConfidence' ? rule.threshold * 100 : rule.threshold;

    // Evaluate condition
    let conditionMet =
      rule.operator === '>'  ? value > rule.threshold :
      rule.operator === '>=' ? value >= rule.threshold :
      rule.operator === '<'  ? value < rule.threshold : false;

    // Special case: vision rule requires 2+ high detections in 10 min window
    if (rule.metric === 'visionConfidence' && rule.triggerAction !== 'ALERT_ONLY') {
      conditionMet = highSeverityDetectionTimes.length >= 2;
    }

    if (!conditionMet) {
      // Condition no longer met — reset sustained timer
      conditionFirstTrueAt[rule.id] = null;

      // For low/medium defects (ALERT_ONLY rules), still alert when condition is met
      // but don't stop the belt — handled below when conditionMet is true
      continue;
    }

    // ── Sustained-duration check for stop/e-stop rules ──────────────────────
    const isStopAction = rule.triggerAction === 'E_STOP' || rule.triggerAction === 'STOP';
    if (isStopAction) {
      if (conditionFirstTrueAt[rule.id] == null) {
        // Condition just became true — start the timer, alert but don't stop yet
        conditionFirstTrueAt[rule.id] = now;

        // Push a warning notification: condition detected, monitoring
        pushPLCNotification({
          id: uuid(),
          timestamp: new Date().toISOString(),
          type: 'alert_only',
          title: `⚠️ CONDITION DETECTED — ${rule.name}`,
          message: `${rule.metric === 'visionConfidence'
            ? `${highSeverityDetectionTimes.length} high-severity vision detections in 10 min`
            : `${rule.metric} = ${displayValue.toFixed(1)} ${metricUnits[rule.metric]}`
          }. Belt will stop if condition persists for 10 minutes.`,
          severity: 'warning',
          ruleName: rule.name,
          metricValue: displayValue,
          metricUnit: metricUnits[rule.metric],
          read: false,
        });
        pushAlert({
          id: uuid(), timestamp: new Date().toISOString(),
          type: 'overload', severity: 'warning',
          message: `⚠️ ${rule.name}: condition detected. Belt stops in 10 min if unresolved.`,
          acknowledged: false,
        });
        continue;
      }

      // Check if sustained for 10 minutes
      const sustainedMs = now - conditionFirstTrueAt[rule.id]!;
      if (sustainedMs < SUSTAINED_WINDOW_MS) {
        // Still within the 10-min window — keep monitoring, no stop yet
        const remainingMin = Math.ceil((SUSTAINED_WINDOW_MS - sustainedMs) / 60000);
        // Push a periodic reminder every 2 minutes
        if (sustainedMs > 0 && sustainedMs % (2 * 60 * 1000) < 2000) {
          pushPLCNotification({
            id: uuid(),
            timestamp: new Date().toISOString(),
            type: 'alert_only',
            title: `⏱️ MONITORING — ${rule.name}`,
            message: `Condition still active. Belt will auto-stop in ~${remainingMin} min if unresolved.`,
            severity: 'warning',
            ruleName: rule.name,
            metricValue: displayValue,
            metricUnit: metricUnits[rule.metric],
            read: false,
          });
        }
        continue;
      }

      // 10 minutes elapsed — now stop the belt
      conditionFirstTrueAt[rule.id] = null;
    }

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
      plcState.autoStopReason = `Auto-rule "${rule.name}": ${rule.metric} = ${displayValue.toFixed(1)} ${unit} sustained for 10 min`;
      plcState.restartGated = true;
      plcState.restartClearedBy = null;
      pushPLCCommand({
        id: uuid(), timestamp: ts, operator: 'PLC Auto-Rule',
        command: 'E_STOP', accepted: true,
        reason: `Auto-rule "${rule.name}": condition sustained 10 min — ${rule.metric} = ${displayValue.toFixed(1)} ${unit}`,
      });
      notifType  = 'auto_stop';
      notifTitle = `🚨 AUTO E-STOP — ${rule.name}`;
      notifMsg   = `Belt stopped after 10-minute sustained condition. ${rule.metric === 'visionConfidence' ? 'Multiple critical vision defects detected' : `${rule.metric} = ${displayValue.toFixed(1)} ${unit}`}. Resolve work order ticket OR clear defects to restart.`;
      severity   = 'critical';

    } else if (rule.triggerAction === 'STOP') {
      plcState.beltState = 'stopping';
      plcState.lastUpdated = ts;
      plcState.autoStopReason = `Auto-rule "${rule.name}": ${rule.metric} = ${displayValue.toFixed(1)} ${unit} sustained for 10 min`;
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
        reason: `Auto-rule "${rule.name}": condition sustained 10 min`,
      });
      notifType  = 'auto_stop';
      notifTitle = `⛔ AUTO STOP — ${rule.name}`;
      notifMsg   = `Belt stopping after 10-minute sustained condition. ${rule.metric} = ${displayValue.toFixed(1)} ${unit}. Resolve work order ticket OR clear defects to restart.`;
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

    pushPLCNotification({
      id: uuid(), timestamp: ts, type: notifType,
      title: notifTitle, message: notifMsg, severity,
      ruleName: rule.name, metricValue: displayValue, metricUnit: unit, read: false,
    });

    pushAlert({
      id: uuid(), timestamp: ts, type: 'overload', severity,
      message: notifMsg, acknowledged: false,
    });
  }
}

export function startSimulator(intervalMs = 2000) {
  setInterval(() => {
    tick++;

    // ── When belt is stopped/e-stopped, generate NO new sensor readings.
    // A static belt produces no load, vibration, or speed data.
    // We still run the auto-rule engine so it can detect recovery conditions.
    const beltStopped = ['stopped', 'stopping', 'e-stop', 'fault'].includes(plcState.beltState);

    if (!beltStopped) {
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

      // Vision detections — only when belt is running
      // Low/medium defects are common; high-severity is rare (5% chance)
      let latestVisionConfidence = 0;
      if (tick % 15 === 0) {
        const defects = ['tear', 'hole', 'edge_damage', 'layer_peeling', 'none'] as const;
        const defect  = defects[Math.floor(Math.random() * defects.length)];
        const confidence = 0.7 + Math.random() * 0.3;

        // Severity distribution: 70% low, 25% medium, 5% high
        const sevRoll = Math.random();
        const severity = defect === 'none' ? 'low' as const
          : sevRoll > 0.95 ? 'high' as const
          : sevRoll > 0.70 ? 'medium' as const
          : 'low' as const;

        const detection: VisionDetection = {
          id: uuid(), timestamp: new Date().toISOString(), defectType: defect,
          confidence,
          position: { x: 0.05 + Math.random() * 0.85, y: 0.05 + Math.random() * 0.85,
                      w: 0.04 + Math.random() * 0.18,  h: 0.03 + Math.random() * 0.14 },
          severity,
        };
        visionDetections.unshift(detection);
        if (visionDetections.length > 50) visionDetections.pop();

        if (defect !== 'none' && severity === 'high') {
          // High severity — pass confidence to auto-rule engine
          latestVisionConfidence = confidence;
          pushAlert({ id: uuid(), timestamp: detection.timestamp, type: 'tear_risk', severity: 'critical',
            message: `Vision: HIGH severity ${defect.replace('_', ' ')} detected (${(confidence * 100).toFixed(0)}% confidence) — monitoring for auto-stop`,
            acknowledged: false });
        } else if (defect !== 'none' && severity === 'medium') {
          // Medium severity — alert only, no belt stop
          pushAlert({ id: uuid(), timestamp: detection.timestamp, type: 'tear_risk', severity: 'warning',
            message: `Vision: MEDIUM ${defect.replace('_', ' ')} detected (${(confidence * 100).toFixed(0)}% confidence) — monitoring`,
            acknowledged: false });
        }
        // Low severity — no alert, just logged in vision detections
      }

      // ── Run PLC auto-rule engine ──────────────────────────────────────────
      runAutoRules(reading, latestVisionConfidence);
    }
    // When belt is stopped: no new readings, no alerts, no vision — belt is static.

  }, intervalMs);

  console.log('[Simulator] Started — generating sensor data every', intervalMs, 'ms');
}
