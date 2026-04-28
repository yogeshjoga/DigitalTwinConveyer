import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Power, Square, AlertOctagon, RotateCcw, Gauge, Shield,
  Zap, Activity, CheckCircle2, XCircle,
  ToggleLeft, ToggleRight, Clock, User, ChevronRight,
  Cpu, Radio, Lock, Unlock, ClipboardList, Trash2,
} from 'lucide-react';
import {
  usePLCState, usePLCCommands, usePLCAutoRules,
  usePLCCommand, useToggleAutoRule, useUpdateAutoRule,
  useClearGateByTicket, useClearGateByDefects,
} from '@/api/hooks';
import { useBeltStore } from '@/store/useBeltStore';
import type { PLCBeltState, PLCAutoRule } from '@/types';

// ── Belt state display config ─────────────────────────────────────────────────
const STATE_CONFIG: Record<PLCBeltState, { label: string; color: string; bg: string; pulse: boolean }> = {
  stopped:  { label: 'STOPPED',  color: '#94a3b8', bg: '#94a3b818', pulse: false },
  starting: { label: 'STARTING', color: '#f59e0b', bg: '#f59e0b18', pulse: true  },
  running:  { label: 'RUNNING',  color: '#22c55e', bg: '#22c55e18', pulse: true  },
  stopping: { label: 'STOPPING', color: '#f59e0b', bg: '#f59e0b18', pulse: true  },
  fault:    { label: 'FAULT',    color: '#ef4444', bg: '#ef444418', pulse: true  },
  'e-stop': { label: 'E-STOP',   color: '#ef4444', bg: '#ef444418', pulse: true  },
};

// ── Speed slider ──────────────────────────────────────────────────────────────
function SpeedControl({ setpoint, actual, onSet, disabled }: {
  setpoint: number; actual: number; onSet: (v: number) => void; disabled: boolean;
}) {
  const [draft, setDraft] = useState(setpoint);

  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2">
        <Gauge size={16} className="text-secondary" />
        <h3 className="text-sm font-semibold text-primary">Speed Control</h3>
      </div>

      {/* Actual vs setpoint */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-[10px] text-muted mb-1">Setpoint</p>
          <p className="text-2xl font-bold font-mono text-primary">{setpoint.toFixed(1)}</p>
          <p className="text-[10px] text-muted">m/s</p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-[10px] text-muted mb-1">Actual</p>
          <p className="text-2xl font-bold font-mono" style={{ color: actual > 0 ? '#22c55e' : '#94a3b8' }}>
            {actual.toFixed(1)}
          </p>
          <p className="text-[10px] text-muted">m/s</p>
        </div>
      </div>

      {/* Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] text-muted">
          <span>0.5 m/s</span>
          <span className="font-mono font-bold text-primary">{draft.toFixed(1)} m/s</span>
          <span>6.0 m/s</span>
        </div>
        <input
          type="range" min={0.5} max={6} step={0.1}
          value={draft}
          onChange={(e) => setDraft(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full accent-green-500 disabled:opacity-40"
        />
        {/* Speed preset buttons */}
        <div className="flex gap-2 flex-wrap">
          {[1.0, 1.5, 2.0, 2.5, 3.0, 4.0].map((v) => (
            <button key={v}
              onClick={() => setDraft(v)}
              disabled={disabled}
              className="text-[10px] px-2 py-1 rounded-lg font-mono transition-all disabled:opacity-40"
              style={{
                backgroundColor: draft === v ? '#22c55e22' : 'var(--color-surface)',
                border: `1px solid ${draft === v ? '#22c55e88' : 'var(--color-border)'}`,
                color: draft === v ? '#22c55e' : 'var(--text-secondary)',
              }}>
              {v.toFixed(1)}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSet(draft)}
        disabled={disabled || draft === setpoint}
        className="w-full py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
      >
        Apply Speed
      </button>
    </div>
  );
}

// ── Editable rule card ────────────────────────────────────────────────────────
function RuleEditor({
  rule,
  onToggle,
  onUpdate,
}: {
  rule: import('@/types').PLCAutoRule;
  onToggle: (enabled: boolean) => void;
  onUpdate: (patch: { threshold?: number; reduceSpeedTo?: number; cooldownSeconds?: number }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [threshold, setThreshold] = useState(
    rule.metric === 'visionConfidence' ? rule.threshold * 100 : rule.threshold
  );
  const [cooldown, setCooldown] = useState(rule.cooldownSeconds);
  const [reduceSpeed, setReduceSpeed] = useState(rule.reduceSpeedTo ?? 1.5);

  const actionColor =
    rule.triggerAction === 'E_STOP'       ? '#ef4444' :
    rule.triggerAction === 'STOP'         ? '#f97316' :
    rule.triggerAction === 'REDUCE_SPEED' ? '#f59e0b' : '#3b82f6';

  const metricUnits: Record<string, string> = {
    loadCell: 'kg', udl: 'kg/m', temperature: '°C',
    vibration: 'mm/s', impactForce: 'kN', visionConfidence: '%',
  };
  const unit = metricUnits[rule.metric];

  const handleSave = () => {
    const realThreshold = rule.metric === 'visionConfidence' ? threshold / 100 : threshold;
    onUpdate({ threshold: realThreshold, cooldownSeconds: cooldown,
      ...(rule.triggerAction === 'REDUCE_SPEED' ? { reduceSpeedTo: reduceSpeed } : {}) });
    setEditing(false);
  };

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${rule.enabled ? actionColor + '33' : 'var(--color-border)'}`,
               opacity: rule.enabled ? 1 : 0.55 }}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-3 py-2.5"
        style={{ backgroundColor: 'var(--color-surface)' }}>
        <button onClick={() => onToggle(!rule.enabled)} className="flex-shrink-0">
          {rule.enabled
            ? <ToggleRight size={22} style={{ color: actionColor }} />
            : <ToggleLeft size={22} className="text-muted" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-primary">{rule.name}</p>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <span className="text-[10px] text-muted">IF</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono"
              style={{ backgroundColor: '#3b82f618', color: '#3b82f6' }}>
              {rule.condition}
            </span>
            <ChevronRight size={10} className="text-muted" />
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold"
              style={{ backgroundColor: actionColor + '18', color: actionColor }}>
              {rule.action}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-[9px] text-muted">Triggered</p>
            <p className="text-xs font-mono font-bold text-primary">{rule.triggerCount}×</p>
          </div>
          <button onClick={() => setEditing((v) => !v)}
            className="text-[10px] px-2 py-1 rounded-lg font-medium transition-all"
            style={{ backgroundColor: editing ? actionColor + '22' : 'var(--color-panel)',
                     border: `1px solid ${editing ? actionColor + '44' : 'var(--color-border)'}`,
                     color: editing ? actionColor : 'var(--text-secondary)' }}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Editable threshold panel */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 py-3 space-y-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              {/* Threshold */}
              <div className="flex items-center gap-3">
                <label className="text-[11px] text-muted w-28 flex-shrink-0">
                  Threshold ({unit})
                </label>
                <input type="number" value={threshold} step={rule.metric === 'visionConfidence' ? 1 : 5}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm font-mono outline-none"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }} />
                <span className="text-[11px] text-muted">{unit}</span>
              </div>

              {/* Reduce speed target */}
              {rule.triggerAction === 'REDUCE_SPEED' && (
                <div className="flex items-center gap-3">
                  <label className="text-[11px] text-muted w-28 flex-shrink-0">Reduce to (m/s)</label>
                  <input type="number" value={reduceSpeed} step={0.1} min={0.5} max={6}
                    onChange={(e) => setReduceSpeed(parseFloat(e.target.value))}
                    className="flex-1 px-3 py-1.5 rounded-lg text-sm font-mono outline-none"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }} />
                  <span className="text-[11px] text-muted">m/s</span>
                </div>
              )}

              {/* Cooldown */}
              <div className="flex items-center gap-3">
                <label className="text-[11px] text-muted w-28 flex-shrink-0">Cooldown (s)</label>
                <input type="number" value={cooldown} step={5} min={5}
                  onChange={(e) => setCooldown(parseInt(e.target.value))}
                  className="flex-1 px-3 py-1.5 rounded-lg text-sm font-mono outline-none"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }} />
                <span className="text-[11px] text-muted">sec</span>
              </div>

              <button onClick={handleSave}
                className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all"
                style={{ background: `linear-gradient(135deg, ${actionColor}, ${actionColor}cc)` }}>
                Save Rule
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PLCPage() {
  const { data: plc }      = usePLCState();
  const { data: commands } = usePLCCommands();
  const { data: rules }    = usePLCAutoRules();
  const sendCmd            = usePLCCommand();
  const toggleRule         = useToggleAutoRule();
  const updateRule         = useUpdateAutoRule();
  const clearByTicket      = useClearGateByTicket();
  const clearByDefects     = useClearGateByDefects();
  const setPLCRunning      = useBeltStore((s) => s.setPLCRunning);

  const [confirmEStop, setConfirmEStop] = useState(false);
  const [ticketRef, setTicketRef]       = useState('');
  const [operator] = useState('Operator 1');

  // Sync PLC state → global store so Digital Twin reacts
  useEffect(() => {
    if (!plc) return;
    const running = plc.beltState === 'running' || plc.beltState === 'starting';
    setPLCRunning(running, running ? undefined : `PLC state: ${plc.beltState}`);
  }, [plc?.beltState]);

  if (!plc) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <Cpu size={32} className="mx-auto text-muted animate-pulse" />
          <p className="text-secondary text-sm">Connecting to PLC…</p>
        </div>
      </div>
    );
  }

  const stateConf = STATE_CONFIG[plc.beltState];
  const canStart  = plc.beltState === 'stopped' || plc.beltState === 'fault';
  const canStop   = plc.beltState === 'running' || plc.beltState === 'starting';
  const isFaulted = plc.beltState === 'fault' || plc.beltState === 'e-stop';
  const trippedInterlocks = plc.interlocks.filter((i) => !i.active);

  const send = (command: string, value?: number, reason?: string) => {
    sendCmd.mutate({ command, value, operator, reason });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Cpu size={22} className="text-secondary" />
            PLC Control Panel
          </h1>
          <p className="text-secondary text-sm mt-1">
            Real-time belt control — start/stop, speed, interlocks, auto-response
          </p>
        </div>
        {/* Connection status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-mono text-secondary">PLC ONLINE</span>
          <Radio size={12} className="text-green-500" />
        </div>
      </div>

      {/* ── Belt State Banner ── */}
      <motion.div
        key={plc.beltState}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 flex items-center justify-between"
        style={{ backgroundColor: stateConf.bg, border: `1.5px solid ${stateConf.color}44` }}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: stateConf.color + '22', border: `2px solid ${stateConf.color}` }}>
              <Power size={24} style={{ color: stateConf.color }} />
            </div>
            {stateConf.pulse && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-30"
                style={{ backgroundColor: stateConf.color }} />
            )}
          </div>
          <div>
            <p className="text-xs text-muted font-medium">Belt Status</p>
            <p className="text-3xl font-bold font-mono tracking-wider" style={{ color: stateConf.color }}>
              {stateConf.label}
            </p>
            <p className="text-xs text-muted mt-0.5">
              Updated {new Date(plc.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] text-muted">Actual Speed</p>
            <p className="text-xl font-bold font-mono" style={{ color: stateConf.color }}>
              {plc.actualSpeed.toFixed(1)} <span className="text-sm font-normal text-muted">m/s</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted">Setpoint</p>
            <p className="text-xl font-bold font-mono text-primary">
              {plc.speedSetpoint.toFixed(1)} <span className="text-sm font-normal text-muted">m/s</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted">Auto-Response</p>
            <p className="text-sm font-bold" style={{ color: plc.autoResponseEnabled ? '#22c55e' : '#94a3b8' }}>
              {plc.autoResponseEnabled ? 'ENABLED' : 'DISABLED'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Restart gate banner — shown when auto-stop has locked the belt ── */}
      <AnimatePresence>
        {plc.restartGated && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: '#ef444408', border: '2px solid #ef444444' }}>
            <div className="flex items-start gap-3">
              <AlertOctagon size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-red-500">Belt Restart Blocked — Auto-Stop Active</p>
                <p className="text-xs text-secondary mt-1">{plc.autoStopReason}</p>
                <p className="text-xs font-semibold text-amber-500 mt-2">
                  To restart the belt, you must do ONE of the following:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Resolve work order ticket */}
              <div className="rounded-xl p-4 space-y-3"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <ClipboardList size={15} className="text-amber-500" />
                  <p className="text-xs font-bold text-primary">Option 1 — Resolve Work Order Ticket</p>
                </div>
                <p className="text-[11px] text-muted">Enter the ticket reference number after the maintenance engineer has resolved the issue.</p>
                <div className="flex gap-2">
                  <input
                    value={ticketRef}
                    onChange={(e) => setTicketRef(e.target.value)}
                    placeholder="e.g. BELT-12345"
                    className="flex-1 text-xs px-3 py-2 rounded-lg outline-none font-mono"
                    style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
                  />
                  <button
                    onClick={() => clearByTicket.mutate({ ticketRef, resolvedBy: operator })}
                    disabled={!ticketRef.trim() || clearByTicket.isPending}
                    className="px-3 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-all"
                    style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                  >
                    {clearByTicket.isPending ? '…' : 'Confirm'}
                  </button>
                </div>
              </div>

              {/* Option 2: Clear all defects */}
              <div className="rounded-xl p-4 space-y-3"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <Trash2 size={15} className="text-blue-500" />
                  <p className="text-xs font-bold text-primary">Option 2 — Clear All Defects</p>
                </div>
                <p className="text-[11px] text-muted">Clear all vision detections to confirm the belt surface has been inspected and is safe to run.</p>
                <button
                  onClick={() => clearByDefects.mutate()}
                  disabled={clearByDefects.isPending}
                  className="w-full py-2 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}
                >
                  {clearByDefects.isPending ? 'Clearing…' : 'Clear Defects & Unlock'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tripped interlock warning ── */}
      <AnimatePresence>
        {trippedInterlocks.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ backgroundColor: '#ef444412', border: '1px solid #ef444444' }}>
            <Lock size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-500">Interlock Tripped — Belt Cannot Start</p>
              <p className="text-xs text-secondary mt-0.5">
                {trippedInterlocks.map((i) => i.name).join(' · ')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main control grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Control buttons */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Power size={16} className="text-secondary" />
            <h3 className="text-sm font-semibold text-primary">Belt Control</h3>
          </div>

          {/* START */}
          <button
            onClick={() => send('START', undefined, 'Manual start from HMI')}
            disabled={!canStart || trippedInterlocks.length > 0 || plc.restartGated || sendCmd.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            title={plc.restartGated ? 'Restart blocked — resolve ticket or clear defects first' : undefined}
          >
            <Power size={16} />
            {plc.restartGated ? 'RESTART BLOCKED' : 'START BELT'}
          </button>

          {/* STOP */}
          <button
            onClick={() => send('STOP', undefined, 'Manual stop from HMI')}
            disabled={!canStop || sendCmd.isPending}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            style={{ background: 'linear-gradient(135deg, #64748b, #475569)' }}
          >
            <Square size={16} />
            STOP BELT
          </button>

          {/* E-STOP */}
          {!confirmEStop ? (
            <button
              onClick={() => setConfirmEStop(true)}
              disabled={plc.beltState === 'e-stop' || sendCmd.isPending}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}
            >
              <AlertOctagon size={16} />
              EMERGENCY STOP
            </button>
          ) : (
            <div className="rounded-xl p-3 space-y-2" style={{ backgroundColor: '#ef444412', border: '1px solid #ef444444' }}>
              <p className="text-xs font-bold text-red-500 text-center">Confirm Emergency Stop?</p>
              <div className="flex gap-2">
                <button onClick={() => { send('E_STOP', undefined, 'Emergency stop from HMI'); setConfirmEStop(false); }}
                  className="flex-1 py-2 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors">
                  CONFIRM
                </button>
                <button onClick={() => setConfirmEStop(false)}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-secondary hover:text-primary transition-colors"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Reset fault */}
          {isFaulted && (
            <button
              onClick={() => send('RESET_FAULT', undefined, 'Fault reset from HMI')}
              disabled={sendCmd.isPending}
              className="w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
              style={{ backgroundColor: '#f59e0b18', border: '1px solid #f59e0b44', color: '#f59e0b' }}
            >
              <RotateCcw size={14} />
              Reset Fault
            </button>
          )}

          {/* Last command feedback */}
          {sendCmd.isError && (
            <p className="text-xs text-red-500 text-center">
              {(sendCmd.error as Error)?.message ?? 'Command rejected'}
            </p>
          )}
        </div>

        {/* Speed control */}
        <SpeedControl
          setpoint={plc.speedSetpoint}
          actual={plc.actualSpeed}
          disabled={plc.beltState !== 'running'}
          onSet={(v) => send('SET_SPEED', v, 'Speed change from HMI')}
        />

        {/* Motor status */}
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-secondary" />
            <h3 className="text-sm font-semibold text-primary">Motor Status</h3>
          </div>
          <div className="space-y-3">
            {plc.motors.map((motor) => {
              const mc = motor.status === 'running' ? '#22c55e'
                : motor.status === 'fault' ? '#ef4444'
                : motor.status === 'starting' ? '#f59e0b' : '#94a3b8';
              return (
                <div key={motor.id} className="rounded-xl p-3 space-y-2"
                  style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${mc}33` }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary">{motor.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                      style={{ background: mc + '22', color: mc }}>
                      {motor.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[9px] text-muted">RPM</p>
                      <p className="text-sm font-mono font-bold text-primary">{motor.rpm}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted">Draw</p>
                      <p className="text-sm font-mono font-bold text-primary">{motor.currentDraw.toFixed(1)} kW</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-muted">Winding</p>
                      <p className="text-sm font-mono font-bold"
                        style={{ color: motor.windingTemp > 80 ? '#ef4444' : motor.windingTemp > 60 ? '#f59e0b' : 'var(--text-primary)' }}>
                        {motor.windingTemp.toFixed(0)}°C
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Interlocks ── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-secondary" />
          <h3 className="text-sm font-semibold text-primary">Safety Interlocks</h3>
          <span className="text-[10px] text-muted ml-auto">
            {plc.interlocks.filter((i) => i.active).length}/{plc.interlocks.length} OK
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {plc.interlocks.map((interlock) => (
            <div key={interlock.id}
              className="flex items-start gap-3 rounded-xl p-3"
              style={{
                backgroundColor: interlock.active ? '#22c55e08' : '#ef444408',
                border: `1px solid ${interlock.active ? '#22c55e33' : '#ef444433'}`,
              }}>
              <div className="mt-0.5 flex-shrink-0">
                {interlock.active
                  ? <Unlock size={15} className="text-green-500" />
                  : <Lock size={15} className="text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-primary truncate">{interlock.name}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: interlock.active ? '#22c55e22' : '#ef444422',
                      color: interlock.active ? '#22c55e' : '#ef4444',
                    }}>
                    {interlock.active ? 'OK' : 'TRIPPED'}
                  </span>
                </div>
                <p className="text-[10px] text-muted mt-0.5">{interlock.description}</p>
                {interlock.preventStart && (
                  <p className="text-[9px] text-amber-500 mt-0.5 font-medium">Prevents start when tripped</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Auto-Response Rules ── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-secondary" />
          <h3 className="text-sm font-semibold text-primary">Auto-Response Rules</h3>
          <span className="text-[10px] text-muted ml-1">
            — PLC evaluates these on every sensor tick and acts automatically
          </span>
        </div>
        <div className="space-y-3">
          {rules?.map((rule) => (
            <RuleEditor
              key={rule.id}
              rule={rule}
              onToggle={(enabled) => toggleRule.mutate({ id: rule.id, enabled })}
              onUpdate={(patch) => updateRule.mutate({ id: rule.id, ...patch })}
            />
          ))}
        </div>
      </div>

      {/* ── Command Log ── */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-secondary" />
          <h3 className="text-sm font-semibold text-primary">Command Audit Log</h3>
          <span className="text-[10px] text-muted ml-auto">Last 20 commands</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted border-b" style={{ borderColor: 'var(--color-border)' }}>
                <th className="pb-2 pr-4 font-medium">Time</th>
                <th className="pb-2 pr-4 font-medium">Operator</th>
                <th className="pb-2 pr-4 font-medium">Command</th>
                <th className="pb-2 pr-4 font-medium">Value</th>
                <th className="pb-2 pr-4 font-medium">Reason</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {commands?.slice(0, 20).map((cmd) => (
                <tr key={cmd.id} className="text-primary">
                  <td className="py-2 pr-4 font-mono text-muted whitespace-nowrap">
                    {new Date(cmd.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-1">
                      <User size={10} className="text-muted" />
                      {cmd.operator}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <span className="font-mono font-bold px-1.5 py-0.5 rounded text-[10px]"
                      style={{
                        backgroundColor:
                          cmd.command === 'E_STOP' ? '#ef444422' :
                          cmd.command === 'START'  ? '#22c55e22' :
                          cmd.command === 'STOP'   ? '#64748b22' : '#3b82f622',
                        color:
                          cmd.command === 'E_STOP' ? '#ef4444' :
                          cmd.command === 'START'  ? '#22c55e' :
                          cmd.command === 'STOP'   ? '#94a3b8' : '#3b82f6',
                      }}>
                      {cmd.command}
                    </span>
                  </td>
                  <td className="py-2 pr-4 font-mono text-muted">
                    {cmd.value != null ? cmd.value : '—'}
                  </td>
                  <td className="py-2 pr-4 text-muted max-w-[200px] truncate">
                    {cmd.reason ?? '—'}
                  </td>
                  <td className="py-2">
                    {cmd.accepted
                      ? <CheckCircle2 size={14} className="text-green-500" />
                      : <span className="flex items-center gap-1 text-red-500">
                          <XCircle size={14} />
                          <span className="text-[10px]">{cmd.rejectReason}</span>
                        </span>}
                  </td>
                </tr>
              ))}
              {(!commands || commands.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted text-xs">
                    No commands issued yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
