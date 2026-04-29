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
// For E_STOP / STOP rules: the condition must hold for SUSTAINED_WINDOW_MS
// (10 minutes) before the belt is stopped.
//
// Key design: brief drops below threshold (< RESET_GRACE_MS) do NOT reset
// the timer. This prevents transient spikes from repeatedly restarting the
// 10-min clock. Only a genuine recovery (condition false for > 30 seconds)
// resets the timer.
const SUSTAINED_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RESET_GRACE_MS      = 30 * 1000;       // 30 seconds grace before timer resets

// Per-rule tracking
const conditionFirstTrueAt:  Record<string, number | null> = {};
const conditionLastFalseAt:  Record<string, number | null> = {};

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
      conditionFirstTrueAt[rule.id] = null;
      conditionLastFalseAt[rule.id] = null;
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
      // Condition not met — start grace period before resetting timer
      if (conditionFirstTrueAt[rule.id] != null) {
        if (conditionLastFalseAt[rule.id] == null) {
          conditionLastFalseAt[rule.id] = now;
        } else if (now - conditionLastFalseAt[rule.id]! > RESET_GRACE_MS) {
          // Condition has been false for > 30s — genuine recovery, reset timer
          conditionFirstTrueAt[rule.id] = null;
          conditionLastFalseAt[rule.id] = null;
        }
      }
      continue;
    }

    // Condition is met — clear the false-timer
    conditionLastFalseAt[rule.id] = null;

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

    const beltStopped = ['stopped', 'stopping', 'e-stop', 'fault'].includes(plcState.beltState);

    if (!beltStopped) {
      // Anomaly: rare (1% chance = roughly once every 3 minutes)
      // Anomaly values are deliberately kept BELOW the E-Stop thresholds
      // so they generate warning alerts but never trigger the 10-min stop gate.
      // Only a genuinely sustained condition (real sensor drift over 10 min) stops the belt.
      const isAnomaly = Math.random() < 0.01;

      const reading: SensorReading = {
        timestamp:   new Date().toISOString(),
        // Normal: ~250 kg  |  Anomaly spike: max ~420 kg (below 480 E-Stop threshold)
        loadCell:    clamp(noise(250, 0.12) + (isAnomaly ? 150 : 0), 0, 600),
        // Normal: ~8 kN    |  Anomaly spike: max ~28 kN (below 40 kN E-Stop threshold)
        impactForce: clamp(noise(8, 0.15)  + (isAnomaly ? 18 : 0),  0, 50),
        beltSpeed:   clamp(noise(2.5, 0.04), 1, 6),
        // Normal: ~35°C    |  Anomaly spike: max ~75°C (below 100°C Stop threshold)
        temperature: clamp(noise(35, 0.08) + (isAnomaly ? 35 : 0),  20, 120),
        // Normal: ~2 mm/s  |  Anomaly spike: max ~10 mm/s (at vibration alert threshold)
        vibration:   clamp(noise(2, 0.15)  + (isAnomaly ? 7 : 0),   0, 20),
        // Normal: ~200 kg/m|  Anomaly spike: max ~380 kg/m (below 420 reduce-speed threshold)
        udl:         clamp(noise(200, 0.12) + (isAnomaly ? 160 : 0), 50, 500),
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

      // Vision detections:
      // - Low / medium defects: every 30 seconds (tick % 15 at 2s interval)
      // - High-severity: only 2% chance per scan — roughly once every 25 minutes
      // - Critical auto-stop rule requires 2 high-severity in 10 min window (very rare)
      let latestVisionConfidence = 0;
      if (tick % 15 === 0) {
        const defects = ['tear', 'hole', 'edge_damage', 'layer_peeling', 'none'] as const;
        const defect  = defects[Math.floor(Math.random() * defects.length)];
        const confidence = 0.7 + Math.random() * 0.3;

        // Severity distribution: 78% low, 20% medium, 2% high
        const sevRoll = Math.random();
        const severity = defect === 'none' ? 'low' as const
          : sevRoll > 0.98 ? 'high' as const
          : sevRoll > 0.78 ? 'medium' as const
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
          latestVisionConfidence = confidence;
          pushAlert({ id: uuid(), timestamp: detection.timestamp, type: 'tear_risk', severity: 'critical',
            message: `Vision: HIGH severity ${defect.replace('_', ' ')} detected (${(confidence * 100).toFixed(0)}% confidence) — monitoring for auto-stop`,
            acknowledged: false });
        } else if (defect !== 'none' && severity === 'medium') {
          pushAlert({ id: uuid(), timestamp: detection.timestamp, type: 'tear_risk', severity: 'warning',
            message: `Vision: MEDIUM ${defect.replace('_', ' ')} detected (${(confidence * 100).toFixed(0)}% confidence) — monitoring`,
            acknowledged: false });
        }
        // Low severity — logged in vision detections, no alert
      }

      // ── Run PLC auto-rule engine ──────────────────────────────────────────
      runAutoRules(reading, latestVisionConfidence);
    }
    // When belt is stopped: no new readings, no alerts, no vision — belt is static.

  }, intervalMs);

  console.log('[Simulator] Started — generating sensor data every', intervalMs, 'ms');
}
