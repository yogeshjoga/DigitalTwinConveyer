import { Activity, Thermometer, Zap, Clock, AlertTriangle, Heart, Download, FileSpreadsheet, FileText, Trash2 } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from '@/components/ui/StatCard';
import GaugeChart from '@/components/ui/GaugeChart';
import RiskBar from '@/components/ui/RiskBar';
import AlertBadge from '@/components/ui/AlertBadge';
import ScrollableChart from '@/components/ui/ScrollableChart';
import { exportPDF, exportExcel, type ReportData } from '@/lib/exportReport';
import {
  useDashboardSummary,
  useAlerts,
  useMLPrediction,
  useSensorHistory,
  useLiveSensors,
  useClearDefects,
  useClearGateByDefects,
} from '@/api/hooks';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useBeltStore } from '@/store/useBeltStore';
import { getThemeColors } from '@/lib/chartConfig';
import { useTimeSeriesBuffer } from '@/lib/useTimeSeriesBuffer';
import type { BeltEntry } from '@/data/beltCatalog';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

// ── Belt-specific characteristic modifiers ────────────────────────────────────
// Each belt type has different operating characteristics that affect sensor readings.
// These multipliers are applied on top of the live sensor baseline.
function getBeltModifiers(belt: BeltEntry) {
  const mat = belt.material.toLowerCase();
  const area = belt.area.toLowerCase();

  // Temperature modifier — hot materials run hotter
  const tempOffset =
    mat.includes('hot sinter') || mat.includes('hot slag') ? 35 :
    mat.includes('sinter')     ? 20 :
    mat.includes('slag')       ? 25 :
    mat.includes('coke')       ? 15 :
    mat.includes('coal')       ? 5  : 0;

  // Load modifier — dense materials carry more load
  const loadMult =
    mat.includes('burden') || mat.includes('charge') ? 1.35 :
    mat.includes('iron ore') || mat.includes('lump ore') ? 1.25 :
    mat.includes('sinter') || mat.includes('slag')   ? 1.20 :
    mat.includes('coal') || mat.includes('coke')     ? 1.10 :
    mat.includes('pellet')                           ? 1.15 :
    mat.includes('limestone') || mat.includes('dolomite') ? 1.05 : 1.0;

  // Vibration modifier — inclined/decline belts vibrate more
  const vibMult =
    area.includes('blast furnace') ? 1.3 :
    area.includes('sinter')        ? 1.2 :
    area.includes('slag')          ? 1.25 :
    belt.id.includes('INCLINE') || belt.id.includes('DECLINE') ? 1.4 : 1.0;

  // Speed modifier — some belts run slower by design
  const speedMult =
    area.includes('blast furnace') ? 0.85 :
    area.includes('sinter')        ? 0.90 :
    mat.includes('hot')            ? 0.80 : 1.0;

  // Health baseline — older/harsher belts start lower
  const healthOffset =
    mat.includes('hot sinter') || mat.includes('hot slag') ? -15 :
    mat.includes('slag') || mat.includes('burden')         ? -10 :
    mat.includes('coal') || mat.includes('coke')           ? -5  : 0;

  // Remaining life modifier
  const lifeMult =
    mat.includes('hot') ? 0.65 :
    mat.includes('slag') || mat.includes('burden') ? 0.75 :
    mat.includes('sinter') ? 0.80 : 1.0;

  return { tempOffset, loadMult, vibMult, speedMult, healthOffset, lifeMult };
}

// Seeded pseudo-random for stable per-belt variation
function seededRand(seed: string, offset = 0): number {
  const n = seed.split('').reduce((a, c) => a + c.charCodeAt(0), offset);
  return ((Math.sin(n) * 43758.5453) % 1 + 1) / 2; // 0–1
}

// ── Hook: belt-aware summary ──────────────────────────────────────────────────
function useBeltAwareSummary(belt: BeltEntry) {
  const { data: rawSummary } = useDashboardSummary();
  const { data: rawSensors } = useLiveSensors();
  const mods = useMemo(() => getBeltModifiers(belt), [belt.id]);

  return useMemo(() => {
    if (!rawSummary) return null;

    const r = seededRand(belt.id);
    const r2 = seededRand(belt.id, 7);

    const temperature    = Math.min(120, (rawSensors?.temperature ?? rawSummary.temperature) + mods.tempOffset + r * 4 - 2);
    const currentLoad    = Math.min(500, (rawSensors?.udl ?? rawSummary.currentLoad) * mods.loadMult * (0.92 + r2 * 0.16));
    const beltSpeed      = Math.max(0.5, (rawSensors?.beltSpeed ?? rawSummary.beltSpeed) * mods.speedMult);
    const vibration      = (rawSensors?.vibration ?? 2) * mods.vibMult;

    // Recalculate health with belt-specific factors
    const loadScore   = Math.max(0, 100 - (currentLoad / 500) * 100);
    const tempScore   = Math.max(0, 100 - ((temperature - 20) / 100) * 100);
    const vibScore    = Math.max(0, 100 - (vibration / 20) * 100);
    const alertPenalty = Math.min((rawSummary.criticalAlerts ?? 0) * 10, 40);
    const beltHealth  = Math.max(0, Math.min(100,
      Math.round(((loadScore + tempScore + vibScore) / 3) - alertPenalty + mods.healthOffset)
    ));

    const remainingLifeHours = Math.max(0, Math.round(beltHealth * 20 * mods.lifeMult));
    const tearProbability    = Math.max(0, Math.min(1, (100 - beltHealth) / 100));

    return {
      ...rawSummary,
      beltHealth,
      temperature:        Math.round(temperature * 10) / 10,
      currentLoad:        Math.round(currentLoad * 10) / 10,
      beltSpeed:          Math.round(beltSpeed * 100) / 100,
      remainingLifeHours,
      tearProbability,
    };
  }, [rawSummary, rawSensors, belt.id, mods]);
}

// ── Hook: belt-aware sensor history ──────────────────────────────────────────
function useBeltAwareHistory(belt: BeltEntry) {
  const { data: rawHistory } = useSensorHistory(30);
  const mods = useMemo(() => getBeltModifiers(belt), [belt.id]);

  return useMemo(() => {
    if (!rawHistory) return undefined;  // undefined = not loaded yet; [] = loaded but empty
    return rawHistory.map((r, i) => ({
      ...r,
      udl:         r.udl * mods.loadMult * (0.95 + seededRand(belt.id, i) * 0.1),
      temperature: r.temperature + mods.tempOffset,
      beltSpeed:   r.beltSpeed * mods.speedMult,
      vibration:   r.vibration * mods.vibMult,
    }));
  }, [rawHistory, belt.id, mods]);
}

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function DashboardPage() {
  const { data: alerts }  = useAlerts();
  const { data: pred }    = useMLPrediction();
  const theme             = useBeltStore((s) => s.theme);
  const selectedBelt      = useBeltStore((s) => s.selectedBeltEntry);
  const isDark            = theme === 'dark';
  const [exportMenu, setExportMenu] = useState(false);
  const clearDefects      = useClearDefects();
  const clearGate         = useClearGateByDefects();

  // Belt-reactive data
  const summary = useBeltAwareSummary(selectedBelt);
  const history = useBeltAwareHistory(selectedBelt);

  // Flash animation key — changes when belt switches so cards animate in
  const [flashKey, setFlashKey] = useState(selectedBelt.id);
  const prevBeltId = useRef(selectedBelt.id);
  useEffect(() => {
    if (prevBeltId.current !== selectedBelt.id) {
      prevBeltId.current = selectedBelt.id;
      setFlashKey(selectedBelt.id);
    }
  }, [selectedBelt.id]);

  const recentAlerts = alerts?.filter((a) => !a.acknowledged).slice(0, 5) ?? [];

  const buildReportData = (): ReportData => ({
    beltName: selectedBelt.name,
    beltId:   selectedBelt.id,
    generatedAt: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    summary: {
      beltHealth:          summary?.beltHealth          ?? 0,
      beltSpeed:           summary?.beltSpeed           ?? 0,
      currentLoad:         summary?.currentLoad         ?? 0,
      temperature:         summary?.temperature         ?? 0,
      remainingLifeHours:  summary?.remainingLifeHours  ?? 0,
      activeAlerts:        summary?.activeAlerts        ?? 0,
      criticalAlerts:      summary?.criticalAlerts      ?? 0,
      tearProbability:     summary?.tearProbability     ?? 0,
    },
    predictions: {
      remainingLifeDays:   pred?.remainingLifeDays   ?? 0,
      tearProbability:     pred?.tearProbability     ?? 0,
      burstRisk:           pred?.burstRisk           ?? 0,
      overheatRisk:        pred?.overheatRisk        ?? 0,
      misalignmentRisk:    pred?.misalignmentRisk    ?? 0,
      nextMaintenanceDays: pred?.nextMaintenanceDays ?? 0,
      confidenceScore:     pred?.confidenceScore     ?? 0,
    },
    alerts: alerts ?? [],
  });

  // ── Accumulate UDL into a sliding-window buffer (keyed by belt so each
  //    belt gets its own independent history when the user switches belts)
  const udlBuf = useTimeSeriesBuffer(
    `dashboard-udl-${selectedBelt.id}`,
    history,
    'udl',
    2000,
  );

  const colors = getThemeColors(isDark);

  const udlLineOpts: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: colors.tooltip.bg,
        borderColor: colors.tooltip.border,
        borderWidth: 1,
        titleColor: colors.tooltip.title,
        bodyColor: colors.tooltip.body,
        titleFont: { size: 11, weight: 'bold', family: 'Inter, sans-serif' },
        bodyFont: { size: 11, family: 'Inter, sans-serif' },
        padding: { x: 12, y: 8 },
        cornerRadius: 8,
        callbacks: {
          title: (items) => items[0]?.label ?? '',
          label: (ctx) => `  UDL: ${typeof ctx.parsed.y === 'number' ? ctx.parsed.y.toFixed(2) : ctx.parsed.y} kg/m`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { color: colors.grid },
        ticks: {
          color: colors.tick,
          font: { size: 9 },
          maxRotation: 0,
          callback: (_val, idx) => idx % 30 === 0 ? udlBuf.labels[idx] : '',
        },
      },
      y: {
        display: false,  // sticky column in ScrollableChart handles Y-axis
      },
    },
    elements: {
      point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2, hoverBackgroundColor: '#ffffff' },
      line:  { borderWidth: 2 },
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-secondary text-sm mt-0.5">
            Real-time monitoring — <span style={{ color: selectedBelt.color }}>{selectedBelt.name}</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Clear Defects — demo reset button */}
          <button
            onClick={() => { clearDefects.mutate(); clearGate.mutate(); }}
            disabled={clearDefects.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-panel)',
              border: '1px solid #ef444444',
              color: '#ef4444',
            }}
            title="Demo: clears all vision detections, related alerts, and unlocks belt restart gate"
          >
            <Trash2 size={14} />
            {clearDefects.isPending ? 'Clearing…' : 'Clear Defects'}
          </button>

          {/* Download Report button */}
          <div className="relative">
          <button
            onClick={() => setExportMenu((v) => !v)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #000080, #0000cc)' }}
          >
            <Download size={15} />
            Download Report
          </button>

          {exportMenu && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 top-full mt-2 z-30 rounded-xl shadow-xl overflow-hidden"
              style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)', minWidth: 180 }}
            >
              <button
                onClick={() => { exportPDF(buildReportData()); setExportMenu(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <FileText size={15} className="text-red-500" />
                <span className="text-primary font-medium">Export PDF</span>
              </button>
              <div style={{ height: 1, backgroundColor: 'var(--color-border)' }} />
              <button
                onClick={() => { exportExcel(buildReportData()); setExportMenu(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <FileSpreadsheet size={15} className="text-green-600" />
                <span className="text-primary font-medium">Export Excel / CSV</span>
              </button>
            </motion.div>
          )}
        </div>
        </div>
      </div>

      {/* KPI cards — re-animate on belt change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={flashKey}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
        >
          <StatCard label="Belt Health"    value={summary?.beltHealth ?? '—'}               unit="%" icon={Heart}
            status={(summary?.beltHealth ?? 100) >= 80 ? 'ok' : (summary?.beltHealth ?? 100) >= 50 ? 'warning' : 'critical'} />
          <StatCard label="Belt Speed"     value={summary?.beltSpeed?.toFixed(1) ?? '—'}    unit="m/s" icon={Activity} status="ok" />
          <StatCard label="Current Load"   value={summary?.currentLoad?.toFixed(0) ?? '—'}  unit="kg/m" icon={Zap}
            status={(summary?.currentLoad ?? 0) > 450 ? 'critical' : (summary?.currentLoad ?? 0) > 350 ? 'warning' : 'ok'} />
          <StatCard label="Temperature"    value={summary?.temperature?.toFixed(0) ?? '—'}  unit="°C" icon={Thermometer}
            status={(summary?.temperature ?? 0) > 80 ? 'critical' : (summary?.temperature ?? 0) > 60 ? 'warning' : 'ok'} />
          <StatCard label="Remaining Life" value={summary?.remainingLifeHours?.toFixed(0) ?? '—'} unit="hrs" icon={Clock}
            status={(summary?.remainingLifeHours ?? 999) < 100 ? 'critical' : (summary?.remainingLifeHours ?? 999) < 300 ? 'warning' : 'ok'} />
          <StatCard label="Active Alerts"  value={summary?.activeAlerts ?? '—'} icon={AlertTriangle}
            status={(summary?.criticalAlerts ?? 0) > 0 ? 'critical' : (summary?.activeAlerts ?? 0) > 0 ? 'warning' : 'ok'}
            subtitle={`${summary?.criticalAlerts ?? 0} critical`} />
        </motion.div>
      </AnimatePresence>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScrollableChart
            title="Load Trend"
            subtitle="UDL (kg/m) — scroll ← for history · auto-scrolls to latest"
            pointCount={udlBuf.labels.length}
            yValues={udlBuf.values}
            height={192}
            accentColor={selectedBelt.color}
            isFrozen={udlBuf.isFrozen}
            badge={
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: selectedBelt.color + '18', color: selectedBelt.color }}
              >
                {selectedBelt.name}
              </span>
            }
          >
            {(_w, _h, anim) => (
              <Line
                data={{
                  labels: udlBuf.labels,
                  datasets: [{
                    label: 'UDL',
                    data: udlBuf.values,
                    borderColor: selectedBelt.color,
                    backgroundColor: selectedBelt.color + '18',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: selectedBelt.color,
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2,
                    borderWidth: 2,
                  }],
                }}
                options={{ ...udlLineOpts, ...anim }}
              />
            )}
          </ScrollableChart>
        </div>

        <div className="card flex flex-col items-center justify-around gap-4">
          <GaugeChart value={summary?.beltHealth ?? 0}              label="Health"    thresholds={{ warning: 50, critical: 30 }} />
          <GaugeChart value={(summary?.tearProbability ?? 0) * 100} label="Tear Risk" thresholds={{ warning: 40, critical: 70 }} />
        </div>
      </div>

      {/* Risk + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-secondary">Risk Analysis</h2>
          {pred ? (
            <div className="space-y-3">
              <RiskBar label="Tear Probability"  value={pred.tearProbability} />
              <RiskBar label="Burst Risk"        value={pred.burstRisk} />
              <RiskBar label="Overheat Risk"     value={pred.overheatRisk} />
              <RiskBar label="Misalignment Risk" value={pred.misalignmentRisk} />
            </div>
          ) : (
            <p className="text-muted text-sm">Loading predictions…</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-secondary mb-3">Recent Alerts</h2>
          {recentAlerts.length === 0 ? (
            <p className="text-muted text-sm">No active alerts</p>
          ) : (
            <ul className="space-y-2">
              {recentAlerts.map((alert) => (
                <motion.li
                  key={alert.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-2 rounded-lg bg-black/5 dark:bg-white/5"
                >
                  <AlertBadge severity={alert.severity} pulse={alert.severity === 'critical'} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary truncate">{alert.message}</p>
                    <p className="text-xs text-muted">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
