import { useState } from 'react';
import {
  Eye,
  Thermometer,
  Package,
  RotateCcw,
  MonitorPlay,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Layers,
  AlertOctagon,
  Power,
  ClipboardList,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BeltScene, { type CameraPreset } from '@/components/three/BeltScene';
import { useLiveSensors, useThermalZones, useVisionDetections, usePLCCommand } from '@/api/hooks';
import { useBeltStore } from '@/store/useBeltStore';
import { motion, AnimatePresence } from 'framer-motion';

// ── Camera view definitions ────────────────────────────────────────────────────
const CAMERA_VIEWS: Array<{
  preset: CameraPreset;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
}> = [
  { preset: 'perspective', label: 'Perspective', sublabel: '3D View',  icon: Maximize2,   color: '#27a372' },
  { preset: 'front',       label: 'Front View',  sublabel: 'Head-on',  icon: MonitorPlay, color: '#3b82f6' },
  { preset: 'side',        label: 'Side View',   sublabel: 'Lateral',  icon: ArrowRight,  color: '#f59e0b' },
  { preset: 'top',         label: 'Top View',    sublabel: 'Overhead', icon: ArrowUp,     color: '#a855f7' },
  { preset: 'bottom',      label: 'Bottom View', sublabel: 'Underside',icon: ArrowDown,   color: '#ef4444' },
];

// ── Material load level labels ─────────────────────────────────────────────────
function getMaterialLevel(load: number): {
  label: string;
  sublabel: string;
  color: string;
  trackColor: string;
} {
  if (load <= 20)  return { label: 'Light',    sublabel: 'Dust / Fines',       color: '#94a3b8', trackColor: '#94a3b8' };
  if (load <= 45)  return { label: 'Medium',   sublabel: 'Gravel / Ore',       color: '#f59e0b', trackColor: '#f59e0b' };
  if (load <= 70)  return { label: 'Heavy',    sublabel: 'Coal / Rock',        color: '#f97316', trackColor: '#f97316' };
  if (load <= 88)  return { label: 'Very Heavy',sublabel: 'Dense Ore / Slag',  color: '#ef4444', trackColor: '#ef4444' };
  return             { label: 'Overload',  sublabel: '⚠ Exceeds Limit',    color: '#dc2626', trackColor: '#dc2626' };
}

export default function DigitalTwinPage() {
  const { data: sensors }    = useLiveSensors();
  const { data: thermal }    = useThermalZones();
  const { data: detections } = useVisionDetections();
  const activeBelt           = useBeltStore((s) => s.activeBelt);
  const plcRunning           = useBeltStore((s) => s.plcBeltRunning);
  const plcStopReason        = useBeltStore((s) => s.plcStopReason);
  const setPLCRunning        = useBeltStore((s) => s.setPLCRunning);
  const selectedBelt         = useBeltStore((s) => s.selectedBeltEntry);
  const theme                = useBeltStore((s) => s.theme);
  const isDark               = theme === 'dark';
  const sendCmd              = usePLCCommand();
  const navigate             = useNavigate();

  const [showThermal,  setShowThermal]  = useState(true);
  const [showMaterial, setShowMaterial] = useState(true);
  const [showDefects,  setShowDefects]  = useState(true);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('perspective');
  const [materialLoad, setMaterialLoad] = useState(30);
  const [confirmEStop, setConfirmEStop] = useState(false);

  const beltLength = activeBelt?.length ?? 20;
  const beltWidth  = activeBelt ? activeBelt.width / 1000 : 1.2;
  // When PLC is stopped, pass speed=0 so any remaining animations see 0
  const beltSpeed  = plcRunning ? (sensors?.beltSpeed ?? activeBelt?.speed ?? 2) : 0;

  const activeView  = CAMERA_VIEWS.find((v) => v.preset === cameraPreset)!;
  const matLevel    = getMaterialLevel(materialLoad);
  const isOverload  = materialLoad > 88;

  const handleEStop = () => {
    sendCmd.mutate({ command: 'E_STOP', operator: 'Digital Twin Operator', reason: 'Emergency stop from Digital Twin' });
    setPLCRunning(false, 'Emergency stop from Digital Twin');
    setConfirmEStop(false);
  };

  const handleStart = () => {
    sendCmd.mutate({ command: 'START', operator: 'Digital Twin Operator', reason: 'Start from Digital Twin' });
    setPLCRunning(true);
  };

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Digital Twin</h1>
          <p className="text-secondary text-sm mt-1">
            3D real-time visualization — {activeBelt?.name ?? 'No belt selected'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleButton icon={<Thermometer size={14} />} label="Thermal"  active={showThermal}  onClick={() => setShowThermal((v) => !v)} />
          <ToggleButton icon={<Package size={14} />}     label="Material" active={showMaterial} onClick={() => setShowMaterial((v) => !v)} />
          <ToggleButton icon={<Eye size={14} />}         label="Defects"  active={showDefects}  onClick={() => setShowDefects((v) => !v)} />
        </div>
      </div>

      {/* ── PLC Stop Banner ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {!plcRunning && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-xl px-4 py-3 flex items-center justify-between gap-4"
            style={{ backgroundColor: '#ef444412', border: '1.5px solid #ef444444' }}
          >
            <div className="flex items-center gap-3">
              <AlertOctagon size={18} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-red-500">Belt Stopped — 3D Model Frozen</p>
                <p className="text-xs text-secondary mt-0.5">{plcStopReason ?? 'PLC stop command received'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/work-orders')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{ backgroundColor: '#f59e0b22', border: '1px solid #f59e0b44', color: '#f59e0b' }}
              >
                <ClipboardList size={13} />
                Assign Worker
              </button>
              <button
                onClick={handleStart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
              >
                <Power size={13} />
                Restart Belt
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Material Load Slider ─────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          borderColor: isOverload ? '#dc262644' : 'var(--color-border)',
          background:  isOverload ? '#dc26260a' : 'var(--color-panel)',
        }}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: matLevel.color + '22' }}
          >
            <Layers size={20} style={{ color: matLevel.color }} />
          </div>

          {/* Label block */}
          <div className="w-36 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">{matLevel.label}</span>
              {isOverload && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold animate-pulse">
                  OVERLOAD
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">{matLevel.sublabel}</p>
          </div>

          {/* Slider track */}
          <div className="flex-1 flex flex-col gap-1.5">
            {/* Tick labels */}
            <div className="flex justify-between text-[10px] text-muted px-0.5 select-none">
              <span>Empty</span>
              <span>Light</span>
              <span>Medium</span>
              <span>Heavy</span>
              <span>Max</span>
            </div>

            {/* Custom styled range input */}
            <div className="relative h-6 flex items-center">
              {/* Colored fill track */}
              <div className="absolute left-0 right-0 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(to right, #94a3b8, ${matLevel.color})` }}
                  animate={{ width: `${materialLoad}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              </div>

              {/* Zone markers */}
              {[20, 45, 70, 88].map((mark) => (
                <div
                  key={mark}
                  className="absolute w-0.5 h-3 rounded-full opacity-40"
                  style={{
                    left: `${mark}%`,
                    backgroundColor: 'var(--color-panel)',
                    top: '50%',
                    transform: 'translateY(-50%)',
                  }}
                />
              ))}

              {/* Native range input on top */}
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={materialLoad}
                onChange={(e) => setMaterialLoad(Number(e.target.value))}
                className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                aria-label="Material load level"
              />

              {/* Thumb indicator */}
              <motion.div
                className="absolute w-5 h-5 rounded-full border-2 border-white shadow-lg pointer-events-none"
                style={{
                  left: `calc(${materialLoad}% - 10px)`,
                  backgroundColor: matLevel.color,
                  boxShadow: `0 0 8px ${matLevel.color}88`,
                }}
                animate={{ scale: isOverload ? [1, 1.15, 1] : 1 }}
                transition={{ repeat: isOverload ? Infinity : 0, duration: 0.8 }}
              />
            </div>

            {/* Material type icons row */}
            <div className="flex justify-between px-0.5">
              {MATERIAL_ICONS.map(({ at, emoji, tip }) => (
                <button
                  key={at}
                  onClick={() => setMaterialLoad(at)}
                  title={tip}
                  className={`text-sm transition-all hover:scale-125 ${
                    materialLoad >= at ? 'opacity-100' : 'opacity-25'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Value readout */}
          <div className="w-20 flex-shrink-0 text-right">
            <motion.span
              key={materialLoad}
              initial={{ scale: 1.2, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold font-mono"
              style={{ color: matLevel.color }}
            >
              {materialLoad}
            </motion.span>
            <span className="text-xs text-muted"> / 100</span>
            <p className="text-[10px] text-muted mt-0.5">
              ~{Math.round(materialLoad * 4.5)} kg/m
            </p>
          </div>
        </div>
      </div>

      {/* ── 3D Canvas ────────────────────────────────────────────────────── */}
      <div
        className="relative rounded-xl overflow-hidden border"
        style={{ borderColor: 'var(--color-border)', height: 500 }}
      >
        <BeltScene
          beltLength={beltLength}
          beltWidth={beltWidth}
          beltSpeed={beltSpeed}
          sensorData={sensors}
          thermalZones={showThermal ? (thermal ?? []) : []}
          detections={showDefects ? (detections ?? []) : []}
          showThermal={showThermal}
          showMaterial={showMaterial}
          cameraPreset={cameraPreset}
          materialLoad={materialLoad}
        />

        {/* Active view label — top left */}
        <div
          className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background: activeView.color + '22',
            color: activeView.color,
            border: `1px solid ${activeView.color}44`,
            backdropFilter: 'blur(6px)',
          }}
        >
          <activeView.icon size={13} />
          {activeView.label}
        </div>

        {/* Belt running status — top center */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{
            background: plcRunning ? '#22c55e22' : '#ef444422',
            border: `1px solid ${plcRunning ? '#22c55e44' : '#ef444444'}`,
            color: plcRunning ? '#22c55e' : '#ef4444',
            backdropFilter: 'blur(6px)',
          }}>
          <span className={`w-1.5 h-1.5 rounded-full ${plcRunning ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          {plcRunning ? 'BELT RUNNING' : 'BELT STOPPED'}
        </div>

        {/* E-Stop button — top right of canvas */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {showMaterial && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{
                background: matLevel.color + '22',
                color: matLevel.color,
                border: `1px solid ${matLevel.color}44`,
                backdropFilter: 'blur(6px)',
              }}
            >
              <Layers size={12} />
              {matLevel.label} Load
            </div>
          )}
          {!confirmEStop ? (
            <button
              onClick={() => setConfirmEStop(true)}
              disabled={!plcRunning}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-40 transition-all"
              style={{ background: 'rgba(239,68,68,0.85)', backdropFilter: 'blur(6px)', border: '1px solid rgba(239,68,68,0.5)' }}
            >
              <AlertOctagon size={13} />
              E-STOP
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', border: '1px solid rgba(239,68,68,0.6)' }}>
              <span className="text-[10px] text-white font-bold">Confirm?</span>
              <button onClick={handleEStop}
                className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-red-500 hover:bg-red-600">
                YES
              </button>
              <button onClick={() => setConfirmEStop(false)}
                className="px-2 py-0.5 rounded text-[10px] font-medium text-white/70 hover:text-white">
                No
              </button>
            </div>
          )}
        </div>

        {/* Camera view buttons — bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 px-4 py-3"
          style={{
            background: isDark
              ? 'linear-gradient(to top, rgba(10,15,26,0.85) 0%, transparent 100%)'
              : 'linear-gradient(to top, rgba(241,245,249,0.92) 0%, transparent 100%)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {CAMERA_VIEWS.map((view) => {
            const Icon     = view.icon;
            const isActive = cameraPreset === view.preset;
            return (
              <motion.button
                key={view.preset}
                onClick={() => setCameraPreset(view.preset)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: isActive
                    ? view.color + '33'
                    : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                  color: isActive
                    ? view.color
                    : isDark ? 'rgba(255,255,255,0.75)' : 'rgba(30,41,59,0.8)',
                  border: `1px solid ${isActive
                    ? view.color + '66'
                    : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{view.label}</span>
                <span className="sm:hidden">{view.sublabel}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: view.color }} />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Info strip ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Belt Speed',    value: `${beltSpeed.toFixed(1)} m/s` },
          { label: 'Belt Length',   value: `${beltLength} m` },
          { label: 'Belt Width',    value: `${(beltWidth * 1000).toFixed(0)} mm` },
          { label: 'Thermal Zones', value: thermal?.length ?? 0 },
          { label: 'Material Load', value: `${materialLoad}%`, highlight: matLevel.color },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="card text-center">
            <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
            <p className="text-lg font-bold mt-1" style={{ color: highlight ?? 'var(--text-primary)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── GLTF slot note ───────────────────────────────────────────────── */}
      <div className="card border-dashed border-brand-500/40 bg-brand-500/5">
        <div className="flex items-center gap-3">
          <RotateCcw size={18} className="text-brand-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-300">Unity / Blender Model Slot</p>
            <p className="text-xs text-secondary mt-0.5">
              Place your exported <code className="text-brand-400">.glb</code> file in{' '}
              <code className="text-brand-400">frontend/public/models/conveyor_belt.glb</code>.
              Then update <code className="text-brand-400">ConveyorBelt.tsx</code> to load it via{' '}
              <code className="text-brand-400">useGLTF()</code>. All view presets, material slider,
              overlays, and particle system will continue to work around the imported model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Material emoji quick-set buttons ──────────────────────────────────────────
const MATERIAL_ICONS = [
  { at: 0,   emoji: '🌫️', tip: 'Empty belt' },
  { at: 20,  emoji: '🪨', tip: 'Light fines / dust' },
  { at: 45,  emoji: '⛏️', tip: 'Medium ore / gravel' },
  { at: 70,  emoji: '🪵', tip: 'Heavy coal / rock' },
  { at: 88,  emoji: '⚙️', tip: 'Dense ore / slag' },
  { at: 100, emoji: '⚠️', tip: 'Max overload' },
];

// ── Shared toggle button ───────────────────────────────────────────────────────
function ToggleButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
        active
          ? 'bg-brand-500/20 text-brand-500 dark:text-brand-400 border-brand-500/30'
          : 'text-secondary border-transparent bg-black/5 dark:bg-white/5 hover:text-primary'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
