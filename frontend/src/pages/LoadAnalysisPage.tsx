import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useLoadAnalysis, useSensorHistory } from '@/api/hooks';
import StatCard from '@/components/ui/StatCard';
import ScrollableChart from '@/components/ui/ScrollableChart';
import { Zap, Droplets, TrendingUp } from 'lucide-react';
import { useBeltStore } from '@/store/useBeltStore';
import { getThemeColors } from '@/lib/chartConfig';
import { useMultiSeriesBuffer } from '@/lib/useTimeSeriesBuffer';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);

export default function LoadAnalysisPage() {
  const { data: load }    = useLoadAnalysis();
  const { data: history } = useSensorHistory(60);
  const theme             = useBeltStore((s) => s.theme);
  const isDark            = theme === 'dark';

  // Accumulate history into a sliding-window buffer
  const buf = useMultiSeriesBuffer(
    'load-analysis',
    history,
    ['udl', 'loadCell', 'impactForce'],
    2000,
  );

  const { labels, series } = buf;
  const udlValues         = series['udl']        ?? [];
  const loadCellValues    = series['loadCell']    ?? [];
  const impactForceValues = series['impactForce'] ?? [];

  const colors = getThemeColors(isDark);

  // Shared chart options — responsive:true so Chart.js fills the container div
  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    interaction: { mode: 'index' as const, intersect: false },
  };

  const udlLineOpts: ChartOptions<'line'> = {
    ...baseOpts,
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
          callback: (_val, idx) => idx % 30 === 0 ? labels[idx] : '',
        },
      },
      y: {
        grid: { color: colors.grid },
        ticks: { color: colors.tick, font: { size: 10 } },
      },
    },
    elements: {
      point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2, hoverBackgroundColor: '#ffffff' },
      line:  { borderWidth: 2 },
    },
  };

  const impactBarOpts: ChartOptions<'bar'> = {
    ...baseOpts,
    plugins: {
      legend: {
        display: true,
        labels: { color: colors.tick, font: { size: 11 }, boxWidth: 12, padding: 16 },
      },
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
          label: (ctx) => `  ${ctx.dataset.label}: ${typeof ctx.parsed.y === 'number' ? ctx.parsed.y.toFixed(1) : ctx.parsed.y} kg`,
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
          callback: (_val, idx) => idx % 30 === 0 ? labels[idx] : '',
        },
      },
      y: {
        grid: { color: colors.grid },
        ticks: { color: colors.tick, font: { size: 10 } },
      },
    },
  };

  const impactVelocity = load ? Math.sqrt(2 * 9.81 * load.dropHeight).toFixed(2) : '—';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Load Analysis</h1>
        <p className="text-secondary text-sm mt-1">Physics-based load modeling — UDL, point load, impact analysis</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Point Load"     value={load?.pointLoad?.toFixed(1) ?? '—'}    unit="kN"   icon={Zap}
          status={(load?.pointLoad ?? 0) > 50 ? 'critical' : (load?.pointLoad ?? 0) > 30 ? 'warning' : 'ok'} />
        <StatCard label="UDL"            value={load?.udl?.toFixed(0) ?? '—'}           unit="kg/m" icon={TrendingUp}
          status={(load?.udl ?? 0) > 450 ? 'critical' : (load?.udl ?? 0) > 350 ? 'warning' : 'ok'} />
        <StatCard label="Peak Stress"    value={load?.peakStress?.toFixed(1) ?? '—'}   unit="MPa"  icon={Zap}
          status={(load?.peakStress ?? 0) > 80 ? 'critical' : (load?.peakStress ?? 0) > 50 ? 'warning' : 'ok'} />
        <StatCard label="Mass Flow Rate" value={load?.massFlowRate?.toFixed(1) ?? '—'} unit="kg/s" icon={Droplets} status="ok" />
      </div>

      {/* Physics panel */}
      <div className="card">
        <h2 className="text-sm font-semibold text-secondary mb-4">Material Drop Physics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <PhysicsValue label="Drop Height (H)"  value={`${load?.dropHeight?.toFixed(2) ?? '—'} m`} />
          <PhysicsValue label="Impact Velocity"  value={`${impactVelocity} m/s`} formula="v = √(2gH)" />
          <PhysicsValue label="Deposition Rate"  value={`${load?.depositionRate?.toFixed(3) ?? '—'} kg/m²/s`} />
          <PhysicsValue label="Impact Force"     value={`${load?.pointLoad?.toFixed(1) ?? '—'} kN`} />
        </div>
      </div>

      {/* UDL + Load Cell — 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UDL sliding-window chart */}
        <ScrollableChart
          title="UDL Trend"
          subtitle="UDL (kg/m) — scroll ← for history · zoom ± for density"
          pointCount={labels.length}
          height={220}
          accentColor="#27a372"
        >
          {(_w, _h, anim) => (
            <Line
              data={{
                labels,
                datasets: [{
                  label: 'UDL',
                  data: udlValues,
                  borderColor: '#27a372',
                  backgroundColor: '#27a37222',
                  fill: true,
                  tension: 0.4,
                  pointRadius: 0,
                  pointHoverRadius: 5,
                  pointHoverBackgroundColor: '#27a372',
                  pointHoverBorderColor: '#ffffff',
                  pointHoverBorderWidth: 2,
                  borderWidth: 2,
                }],
              }}
              options={{ ...udlLineOpts, ...anim }}
            />
          )}
        </ScrollableChart>

        {/* Load Cell vs Impact Force sliding-window chart */}
        <ScrollableChart
          title="Load Cell vs Impact Force"
          subtitle="Scroll ← for history · hover to compare load cell (kg) and impact force (×10 kN)"
          pointCount={labels.length}
          height={220}
          accentColor="#3b82f6"
        >
          {(_w, _h, anim) => (
            <Bar
              data={{
                labels,
                datasets: [
                  {
                    label: 'Load Cell (kg)',
                    data: loadCellValues,
                    backgroundColor: '#3b82f688',
                    hoverBackgroundColor: '#3b82f6',
                    borderRadius: 2,
                    borderSkipped: false,
                  },
                  {
                    label: 'Impact Force (×10 kN)',
                    data: impactForceValues.map((v) => v * 10),
                    backgroundColor: '#f59e0b88',
                    hoverBackgroundColor: '#f59e0b',
                    borderRadius: 2,
                    borderSkipped: false,
                  },
                ],
              }}
              options={{ ...impactBarOpts, ...anim }}
            />
          )}
        </ScrollableChart>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-secondary mb-3">Engineering Constraints</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Constraint label="UDL Range"     value="50 – 500 kg/m" />
          <Constraint label="Belt Speed"    value="1 – 6 m/s" />
          <Constraint label="Current UDL"   value={`${load?.udl?.toFixed(0) ?? '—'} kg/m`}
            ok={(load?.udl ?? 0) >= 50 && (load?.udl ?? 0) <= 500} />
          <Constraint label="Current Speed" value={`${history?.[history.length - 1]?.beltSpeed?.toFixed(1) ?? '—'} m/s`} ok />
        </div>
      </div>
    </div>
  );
}

function PhysicsValue({ label, value, formula }: { label: string; value: string; formula?: string }) {
  return (
    <div>
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-lg font-bold text-primary font-mono">{value}</p>
      {formula && <p className="text-xs text-brand-500 mt-0.5 font-mono">{formula}</p>}
    </div>
  );
}

function Constraint({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-white/5">
      <span className="text-secondary">{label}</span>
      <span className={`font-mono font-medium ${
        ok === undefined ? 'text-primary' : ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
      }`}>{value}</span>
    </div>
  );
}
