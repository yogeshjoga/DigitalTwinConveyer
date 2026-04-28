/**
 * PLC / HMI Control Route
 *
 * Real-world integration: Replace this with OPC-UA / Modbus TCP / MQTT
 * to communicate with actual PLCs (Siemens S7, Allen-Bradley, Schneider, etc.)
 */
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { plcState, plcCommandLog, plcAutoRules, pushPLCCommand, plcNotifications, pushPLCNotification } from '../store/inMemory';
import type { PLCCommand } from '../types';

const router = Router();

// ── GET /api/plc/state ────────────────────────────────────────────────────────
router.get('/state', (_req, res) => {
  res.json(plcState);
});

// ── GET /api/plc/commands ─────────────────────────────────────────────────────
router.get('/commands', (_req, res) => {
  res.json(plcCommandLog.slice(0, 50));
});

// ── GET /api/plc/auto-rules ───────────────────────────────────────────────────
router.get('/auto-rules', (_req, res) => {
  res.json(plcAutoRules);
});

// ── GET /api/plc/notifications ────────────────────────────────────────────────
router.get('/notifications', (_req, res) => {
  res.json(plcNotifications.slice(0, 50));
});

// ── PATCH /api/plc/notifications/read-all ─────────────────────────────────────
router.patch('/notifications/read-all', (_req, res) => {
  plcNotifications.forEach((n) => { n.read = true; });
  res.json({ ok: true });
});

// ── POST /api/plc/command ─────────────────────────────────────────────────────
router.post('/command', (req, res) => {
  const { command, value, operator = 'Operator', reason } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Missing command' });
  }

  const cmd: PLCCommand = {
    id: uuid(),
    timestamp: new Date().toISOString(),
    operator,
    command,
    value,
    reason,
    accepted: true,
    rejectReason: undefined,
  };

  // ── Restart gate — belt stopped by auto-rule ──────────────────────────────
  if (command === 'START' && plcState.restartGated) {
    cmd.accepted = false;
    cmd.rejectReason = `Belt restart blocked: auto-stop active (${plcState.autoStopReason}). Resolve work order ticket OR clear defects first.`;
    pushPLCCommand(cmd);
    return res.status(400).json({ error: cmd.rejectReason, command: cmd, restartGated: true });
  }

  // ── Interlock checks ──────────────────────────────────────────────────────
  const preventStartInterlocks = plcState.interlocks.filter((i) => i.preventStart && !i.active);

  if (command === 'START' && preventStartInterlocks.length > 0) {
    cmd.accepted = false;
    cmd.rejectReason = `Interlock tripped: ${preventStartInterlocks.map((i) => i.name).join(', ')}`;
    pushPLCCommand(cmd);
    return res.status(400).json({ error: cmd.rejectReason, command: cmd });
  }

  if (command === 'E_STOP') {
    plcState.beltState = 'e-stop';
    plcState.actualSpeed = 0;
    plcState.motors.forEach((m) => { m.status = 'stopped'; m.rpm = 0; m.currentDraw = 0; });
  } else if (command === 'STOP') {
    plcState.beltState = 'stopping';
    setTimeout(() => {
      plcState.beltState = 'stopped';
      plcState.actualSpeed = 0;
      plcState.motors.forEach((m) => { m.status = 'stopped'; m.rpm = 0; m.currentDraw = 0; });
    }, 2000);
  } else if (command === 'START') {
    plcState.beltState = 'starting';
    plcState.autoStopReason = null;
    setTimeout(() => {
      plcState.beltState = 'running';
      plcState.actualSpeed = plcState.speedSetpoint;
      plcState.motors.forEach((m) => { m.status = 'running'; m.rpm = 1450; m.currentDraw = 18.5; });
    }, 3000);
  } else if (command === 'SET_SPEED' && typeof value === 'number') {
    plcState.speedSetpoint = Math.max(0, Math.min(6, value));
    if (plcState.beltState === 'running') {
      plcState.actualSpeed = plcState.speedSetpoint;
    }
  } else if (command === 'RESET_FAULT') {
    if (plcState.beltState === 'fault' || plcState.beltState === 'e-stop') {
      plcState.beltState = 'stopped';
    }
  }

  plcState.lastUpdated = new Date().toISOString();
  pushPLCCommand(cmd);

  res.json({ success: true, command: cmd, state: plcState });
});

// ── POST /api/plc/clear-gate/ticket ──────────────────────────────────────────
// Called when a work order ticket is marked resolved
router.post('/clear-gate/ticket', (req, res) => {
  const { ticketRef, resolvedBy = 'Engineer' } = req.body;
  plcState.restartGated = false;
  plcState.restartClearedBy = 'ticket';
  plcState.lastUpdated = new Date().toISOString();

  pushPLCCommand({
    id: uuid(),
    timestamp: new Date().toISOString(),
    operator: resolvedBy,
    command: 'ACK_INTERLOCK',
    accepted: true,
    reason: `Restart gate cleared — work order ticket ${ticketRef ?? ''} resolved`,
  });

  pushPLCNotification({
    id: uuid(),
    timestamp: new Date().toISOString(),
    type: 'auto_start',
    title: '✅ Restart Cleared — Ticket Resolved',
    message: `Work order ticket resolved by ${resolvedBy}. Belt can now be restarted manually.`,
    severity: 'info',
    ruleName: 'Restart Gate',
    metricValue: 0,
    metricUnit: '',
    read: false,
  });

  res.json({ ok: true, restartGated: false, clearedBy: 'ticket' });
});

// ── POST /api/plc/clear-gate/defects ─────────────────────────────────────────
// Called when defects are cleared
router.post('/clear-gate/defects', (_req, res) => {
  plcState.restartGated = false;
  plcState.restartClearedBy = 'defects';
  plcState.lastUpdated = new Date().toISOString();

  pushPLCCommand({
    id: uuid(),
    timestamp: new Date().toISOString(),
    operator: 'System',
    command: 'ACK_INTERLOCK',
    accepted: true,
    reason: 'Restart gate cleared — all defects cleared',
  });

  pushPLCNotification({
    id: uuid(),
    timestamp: new Date().toISOString(),
    type: 'auto_start',
    title: '✅ Restart Cleared — Defects Cleared',
    message: 'All vision defects cleared. Belt can now be restarted manually.',
    severity: 'info',
    ruleName: 'Restart Gate',
    metricValue: 0,
    metricUnit: '',
    read: false,
  });

  res.json({ ok: true, restartGated: false, clearedBy: 'defects' });
});

// ── PATCH /api/plc/auto-rules/:id ─────────────────────────────────────────────
router.patch('/auto-rules/:id', (req, res) => {
  const { id } = req.params;
  const { enabled, threshold, reduceSpeedTo, cooldownSeconds, triggerAction } = req.body;

  const rule = plcAutoRules.find((r) => r.id === id);
  if (!rule) return res.status(404).json({ error: 'Rule not found' });

  if (typeof enabled === 'boolean')          rule.enabled = enabled;
  if (typeof threshold === 'number')         rule.threshold = threshold;
  if (typeof reduceSpeedTo === 'number')     rule.reduceSpeedTo = reduceSpeedTo;
  if (typeof cooldownSeconds === 'number')   rule.cooldownSeconds = cooldownSeconds;
  if (typeof triggerAction === 'string')     rule.triggerAction = triggerAction as any;

  // Rebuild condition string to reflect new threshold
  const metricLabels: Record<string, string> = {
    loadCell: 'Load Cell', udl: 'UDL', temperature: 'Temperature',
    vibration: 'Vibration', impactForce: 'Impact Force', visionConfidence: 'Vision Confidence',
  };
  const metricUnits: Record<string, string> = {
    loadCell: 'kg', udl: 'kg/m', temperature: '°C',
    vibration: 'mm/s', impactForce: 'kN', visionConfidence: '%',
  };
  const displayThreshold = rule.metric === 'visionConfidence' ? rule.threshold * 100 : rule.threshold;
  rule.condition = `${metricLabels[rule.metric]} ${rule.operator} ${displayThreshold} ${metricUnits[rule.metric]}`;

  res.json(rule);
});

export default router;
