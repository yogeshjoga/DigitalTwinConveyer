import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity, AlertTriangle, CheckCircle2, Scissors,
  Circle, AlignLeft, Layers, ArrowRight, Zap,
  Thermometer, TrendingUp, Shield,
} from 'lucide-react';
import { useBeltStore } from '@/store/useBeltStore';
import { useAlerts, useLiveSensors } from '@/api/hooks';
import { BELT_CATALOG, BELT_AREAS, AREA_COLORS, getBeltsByArea } from '@/data/beltCatalog';
import { VIDEO_EVENTS, DEFECT_COLORS, DEFECT_LABELS } from '@/data/videoAnalytics';
import type { DefectType } from '@/types';

// ── Defect severity buckets ───────────────────────────────────────────────────
const SEV_COLOR = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };

const DEFECT_ICONS: Record<Exclude<DefectType, 'none'>, React.ElementType> = {
  tear:          Scissors,
  hole:          Circle,
  edge_damage:   AlignLeft,
  layer_peeling: Layers,
};

// ── Mini sparkline (SVG path from array of values) ───────────────────────────
function Sparkline({ values, color, h = 32 }: { values: number[]; color: string; h?: number }) {
  if (values.length < 2) return <div style={{ height: h }} />;
  const w   = 80;
  const min = Math.min(...values);
  const max = Math.max(...values) || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none">
      <polyline points={pts.join(' ')} stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={`0,${h} ${pts.join(' ')} ${w},${h}`} fill={color + '18'} stroke="none" />
    </svg>
  );
}

// ── Per-belt defect summary ───────────────────────────────────────────────────
function useBeltDefectStats() {
  return useMemo(() => {
    const now = Date.now();
    const last24h = VIDEO_EVENTS.filter((e) => now - new Date(e.timestamp).getTime() < 86_400_000);
    return BELT_CATALOG.map((belt) => {
      const events = last24h.filter((e) => e.beltId === belt.id);
      const high   = events.filter((e) => e.severity === 'high').length;
      const medium = events.filter((e) => e.severity === 'medium').length;
      const low    = events.filter((e) => e.severity === 'low').length;
      const total  = events.length;
      const byType = (['tear','hole','edge_damage','layer_peeling'] as Exclude<DefectType,'none'>[])
        .map((t) => ({ type: t, count: events.filter((e) => e.defectType === t).length }))
        .filter((d) => d.count > 0)
        .sort((a, b) => b.count - a.count);
      // Hourly counts for sparkline (last 12 hours)
      const hourly = Array.from({ length: 12 }, (_, i) => {
        const from = now - (12 - i) * 3_600_000;
        const to   = from + 3_600_000;
        return events.filter((e) => {
          const t = new Date(e.timestamp).getTime();
          return t >= from && t < to;
        }).length;
      });
      return { belt, total, high, medium, low, byType, hourly };
    });
  }, []);
}

// ── Fleet-wide totals ─────────────────────────────────────────────────────────
function useFleetStats() {
  const beltStats = useBeltDefectStats();
  return useMemo(() => {
    const totalDefects = beltStats.reduce((s, b) => s + b.total, 0);
    const totalHigh    = beltStats.reduce((s, b) => s + b.high, 0);
    const totalMedium  = beltStats.reduce((s, b) => s + b.medium, 0);
    const totalLow     = beltStats.reduce((s, b) => s + b.low, 0);
    const activeBelts  = beltStats.filter((b) => b.total > 0).length;
    const criticalBelts= beltStats.filter((b) => b.high > 0).length;
    return { totalDefects, totalHigh, totalMedium, totalLow, activeBelts, criticalBelts, beltStats };
  }, [beltStats]);
}

// ── Belt card ─────────────────────────────────────────────────────────────────
function BeltCard({ stat, onClick }: {
  stat: ReturnType<typeof useBeltDefectStats>[0];
  onClick: () => void;
}) {
  const { belt, total, high, medium, low, byType, hourly } = stat;
  const status = high > 0 ? 'critical' : medium > 0 ? 'warning' : total > 0 ? 'ok' : 'idle';
  const statusColor = status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : status === 'ok' ? '#22c55e' : '#94a3b8';

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left rounded-xl p-3 transition-all group"
      style={{
        backgroundColor: 'var(--color-panel)',
        border: `1px solid ${total > 0 ? statusColor + '44' : 'var(--color-border)'}`,
        boxShadow: high > 0 ? `0 0 0 1px ${statusColor}22` : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: belt.color }} />
            <span className="text-xs font-bold text-primary truncate">{belt.name}</span>
          </div>
          <span className="text-[10px] text-muted font-mono">{belt.id}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {total === 0 ? (
            <CheckCircle2 size={13} className="text-green-500" />
          ) : (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: statusColor + '22', color: statusColor }}>
              {total}
            </span>
          )}
          <ArrowRight size={11} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Severity pills */}
      {total > 0 && (
        <div className="flex items-center gap-1 mb-2 flex-wrap">
          {high > 0   && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#ef444422', color: '#ef4444' }}>{high} high</span>}
          {medium > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#f59e0b22', color: '#f59e0b' }}>{medium} med</span>}
          {low > 0    && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#22c55e22', color: '#22c55e' }}>{low} low</span>}
        </div>
      )}

      {/* Defect type tags */}
      {byType.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-2">
          {byType.slice(0, 2).map(({ type, count }) => {
            const Icon = DEFECT_ICONS[type];
            return (
              <span key={type} className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: DEFECT_COLORS[type] + '18', color: DEFECT_COLORS[type] }}>
                <Icon size={8} />
                {DEFECT_LABELS[type]} ×{count}
              </span>
            );
          })}
        </div>
      )}

      {/* Sparkline */}
      <div className="flex items-end justify-between">
        <Sparkline values={hourly} color={total > 0 ? statusColor : '#94a3b8'} h={28} />
        <span className="text-[9px] text-muted">12h</span>
      </div>
    </motion.button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MainDashboardPage() {
  const navigate          = useNavigate();
  const setSelectedBelt   = useBeltStore((s) => s.setSelectedBeltEntry);
  const { data: alerts }  = useAlerts();
  const { data: live }    = useLiveSensors();
  const { totalDefects, totalHigh, totalMedium, totalLow, activeBelts, criticalBelts, beltStats } = useFleetStats();
  const beltsByArea       = getBeltsByArea();

  const criticalAlerts = alerts?.filter((a) => a.severity === 'critical' && !a.acknowledged).length ?? 0;

  const handleBeltClick = (beltId: string) => {
    const entry = BELT_CATALOG.find((b) => b.id === beltId);
    if (entry) {
      setSelectedBelt(entry);
      navigate('/dashboard');
    }
  };

  // Defect type totals across all belts
  const defectTypeTotals = useMemo(() => {
    const now = Date.now();
    const last24h = VIDEO_EVENTS.filter((e) => now - new Date(e.timestamp).getTime() < 86_400_000);
    return (['tear','hole','edge_damage','layer_peeling'] as Exclude<DefectType,'none'>[]).map((t) => ({
      type: t,
      count: last24h.filter((e) => e.defectType === t).length,
    }));
  }, []);

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Fleet Overview</h1>
          <p className="text-secondary text-sm mt-1">
            All {BELT_CATALOG.length} conveyor belts · last 24 hours · click any belt to open its dashboard
          </p>
        </div>
        <div className="text-xs text-muted font-mono">
          {new Date().toLocaleString()}
        </div>
      </div>

      {/* ── Fleet KPI strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Belts',     value: BELT_CATALOG.length, icon: Activity,      color: '#3b82f6' },
          { label: 'Active Defects',  value: activeBelts,         icon: AlertTriangle, color: activeBelts > 0 ? '#f59e0b' : '#22c55e' },
          { label: 'Critical',        value: totalHigh,           icon: AlertTriangle, color: totalHigh > 0 ? '#ef4444' : '#22c55e' },
          { label: 'Medium',          value: totalMedium,         icon: AlertTriangle, color: totalMedium > 0 ? '#f59e0b' : '#22c55e' },
          { label: 'Low',             value: totalLow,            icon: CheckCircle2,  color: '#22c55e' },
          { label: 'System Alerts',   value: criticalAlerts,      icon: Shield,        color: criticalAlerts > 0 ? '#ef4444' : '#22c55e' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl p-3 flex flex-col gap-1"
            style={{ backgroundColor: 'var(--color-panel)', border: `1px solid ${color}33` }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted font-medium">{label}</span>
              <Icon size={13} style={{ color }} />
            </div>
            <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Defect category breakdown ── */}
      <div className="rounded-2xl p-4"
        style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-sm font-semibold text-secondary mb-3">Defect Categories (24h — all belts)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {defectTypeTotals.map(({ type, count }) => {
            const Icon  = DEFECT_ICONS[type];
            const color = DEFECT_COLORS[type];
            const pct   = totalDefects > 0 ? Math.round((count / totalDefects) * 100) : 0;
            return (
              <div key={type} className="rounded-xl p-3 space-y-2"
                style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${color}33` }}>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: color + '22' }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold text-primary">{DEFECT_LABELS[type]}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold font-mono" style={{ color }}>{count}</span>
                  <span className="text-[10px] text-muted">{pct}%</span>
                </div>
                {/* Mini bar */}
                <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
                </div>
                {/* Severity split */}
                <div className="flex gap-1">
                  {(['high','medium','low'] as const).map((sev) => {
                    const n = VIDEO_EVENTS.filter((e) =>
                      e.defectType === type && e.severity === sev &&
                      Date.now() - new Date(e.timestamp).getTime() < 86_400_000
                    ).length;
                    if (!n) return null;
                    return (
                      <span key={sev} className="text-[9px] px-1 py-0.5 rounded font-bold"
                        style={{ background: SEV_COLOR[sev] + '22', color: SEV_COLOR[sev] }}>
                        {n} {sev}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Live sensor snapshot ── */}
      {live && (
        <div className="rounded-2xl p-4"
          style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-semibold text-secondary mb-3">Live Sensor Snapshot</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Load Cell',   value: live.loadCell.toFixed(0),   unit: 'kg',   icon: Zap,         warn: 380, crit: 480 },
              { label: 'UDL',         value: live.udl.toFixed(0),        unit: 'kg/m', icon: TrendingUp,  warn: 350, crit: 450 },
              { label: 'Temperature', value: live.temperature.toFixed(1),unit: '°C',   icon: Thermometer, warn: 60,  crit: 80  },
              { label: 'Vibration',   value: live.vibration.toFixed(1),  unit: 'mm/s', icon: Activity,    warn: 5,   crit: 10  },
              { label: 'Belt Speed',  value: live.beltSpeed.toFixed(2),  unit: 'm/s',  icon: Activity,    warn: 5.5, crit: 6   },
              { label: 'Impact',      value: live.impactForce.toFixed(1),unit: 'kN',   icon: Zap,         warn: 20,  crit: 35  },
            ].map(({ label, value, unit, icon: Icon, warn, crit }) => {
              const num   = parseFloat(value);
              const color = num >= crit ? '#ef4444' : num >= warn ? '#f59e0b' : '#22c55e';
              return (
                <div key={label} className="rounded-xl p-3"
                  style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${color}33` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted">{label}</span>
                    <Icon size={11} style={{ color }} />
                  </div>
                  <span className="text-lg font-bold font-mono" style={{ color }}>{value}</span>
                  <span className="text-[10px] text-muted ml-1">{unit}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Belt grid by area ── */}
      {Object.entries(beltsByArea).map(([area, belts]) => {
        const areaColor = AREA_COLORS[area as keyof typeof AREA_COLORS] ?? '#64748b';
        const areaStats = beltStats.filter((s) => s.belt.area === area);
        const areaTotal = areaStats.reduce((s, b) => s + b.total, 0);
        const areaHigh  = areaStats.reduce((s, b) => s + b.high, 0);

        return (
          <div key={area}>
            {/* Area header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
              <div className="flex items-center gap-2 px-3 py-1 rounded-full"
                style={{ backgroundColor: areaColor + '18', border: `1px solid ${areaColor}33` }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: areaColor }} />
                <span className="text-xs font-bold" style={{ color: areaColor }}>{area}</span>
                <span className="text-[10px] text-muted">{belts.length} belts</span>
                {areaHigh > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                    {areaHigh} critical
                  </span>
                )}
                {areaTotal > 0 && areaHigh === 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#f59e0b22', color: '#f59e0b' }}>
                    {areaTotal} defects
                  </span>
                )}
              </div>
              <div className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>

            {/* Belt cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {belts.map((belt) => {
                const stat = beltStats.find((s) => s.belt.id === belt.id)!;
                return (
                  <BeltCard
                    key={belt.id}
                    stat={stat}
                    onClick={() => handleBeltClick(belt.id)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
