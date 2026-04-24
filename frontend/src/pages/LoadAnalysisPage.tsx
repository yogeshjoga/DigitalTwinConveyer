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
import { Bar, Line } from 'react-chartjs-2';
import { useLoadAnalysis, useSensorHistory } from '@/api/hooks';
import StatCard from '@/components/ui/StatCard';
import { Zap, Droplets, TrendingUp } from 'lucide-react';
import { useBeltStore } from '@/store/useBeltStore';
import { lineChartOptions, barChartOptions } from '@/lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler, Tooltip, Legend);

export default function LoadAnalysisPage() {
  const { data: load }    = useLoadAnalysis();
  const { data: history } = useSensorHistory(60);
  const theme             = useBeltStore((s) => s.theme);
  const isDark            = theme === 'dark';

  // Real timestamps as labels
  const timeLabels = history?.map((r) =>
    new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  ) ?? [];

  const udlData = {
    labels: timeLabels,
    datasets: [{
      label: 'UDL',
      data: history?.map((r) => r.udl) ?? [],
      borderColor: '#27a372',
      backgroundColor: 'rgba(39,163,114,0.15)',
      fill: true,
      tension: 0.4,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#27a372',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
      borderWidth: 2,
    }],
  };

  const loadCellData = {
    labels: timeLabels,
    datasets: [{
      label: 'Load Cell',
      data: history?.map((r) => r.loadCell) ?? [],
      backgroundColor: '#3b82f6',
      hoverBackgroundColor: '#60a5fa',
      borderRadius: 4,
      borderSkipped: false,
    }],
  };

  // Also show impact force on load cell chart as a second dataset
  const impactData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Load Cell',
        data: history?.map((r) => r.loadCell) ?? [],
        backgroundColor: '#3b82f688',
        hoverBackgroundColor: '#3b82f6',
        borderRadius: 4,
        borderSkipped: false,
      },
      {
        label: 'Impact Force',
        data: history?.map((r) => r.impactForce * 10) ?? [], // scale kN→kg for same axis
        backgroundColor: '#f59e0b88',
        hoverBackgroundColor: '#f59e0b',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const udlOpts   = lineChartOptions(isDark, { unit: 'kg/m', showLegend: false, showXAxis: false });
  const loadOpts  = barChartOptions(isDark,  { unit: 'kg',   showLegend: true,
    labelFormatter: (l) => l,
  });

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-sm font-semibold text-secondary mb-1">UDL Trend (60 min)</h2>
          <p className="text-xs text-muted mb-3">Hover to see UDL at each timestamp</p>
          <div className="h-56">
            <Line data={udlData} options={udlOpts} />
          </div>
        </div>
        <div className="card">
          <h2 className="text-sm font-semibold text-secondary mb-1">Load Cell vs Impact Force</h2>
          <p className="text-xs text-muted mb-3">Hover bars to compare load cell (kg) and impact force (×10 kN)</p>
          <div className="h-56">
            <Bar data={impactData} options={loadOpts} />
          </div>
        </div>
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
