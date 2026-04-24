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
import { Line } from 'react-chartjs-2';
import { useLiveSensors, useSensorHistory } from '@/api/hooks';
import { Activity, Thermometer, Zap, Wind } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import ChartCard from '@/components/ui/ChartCard';
import { motion } from 'framer-motion';
import { useBeltStore } from '@/store/useBeltStore';
import { lineChartOptions } from '@/lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function SensorsPage() {
  const { data: live }    = useLiveSensors();
  const { data: history } = useSensorHistory(30);
  const theme             = useBeltStore((s) => s.theme);
  const isDark            = theme === 'dark';

  const timeLabels = history?.map((r) =>
    new Date(r.timestamp).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  ) ?? [];

  const sensors = [
    {
      key: 'loadCell',
      label: 'Load Cell',
      unit: 'kg',
      color: '#27a372',
      icon: Zap,
      value: live?.loadCell,
      data: history?.map((r) => r.loadCell) ?? [],
      warnAt: 400,
      critAt: 480,
    },
    {
      key: 'temperature',
      label: 'Temperature',
      unit: '°C',
      color: '#ef4444',
      icon: Thermometer,
      value: live?.temperature,
      data: history?.map((r) => r.temperature) ?? [],
      warnAt: 60,
      critAt: 80,
    },
    {
      key: 'vibration',
      label: 'Vibration',
      unit: 'mm/s',
      color: '#f59e0b',
      icon: Activity,
      value: live?.vibration,
      data: history?.map((r) => r.vibration) ?? [],
      warnAt: 5,
      critAt: 10,
    },
    {
      key: 'beltSpeed',
      label: 'Belt Speed',
      unit: 'm/s',
      color: '#3b82f6',
      icon: Wind,
      value: live?.beltSpeed,
      data: history?.map((r) => r.beltSpeed) ?? [],
      warnAt: 5.5,
      critAt: 6,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Sensor Monitoring</h1>
        <p className="text-secondary text-sm mt-1">
          Live readings — hover any chart to inspect values · click{' '}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border"
            style={{ borderColor: 'var(--color-border)' }}>
            ⤢
          </span>{' '}
          to fullscreen · click{' '}
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs border"
            style={{ borderColor: 'var(--color-border)' }}>
            —
          </span>{' '}
          to minimize
        </p>
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sensors.map((s) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value?.toFixed(1) ?? '—'}
            unit={s.unit}
            icon={s.icon}
            status={
              (s.value ?? 0) >= s.critAt ? 'critical' :
              (s.value ?? 0) >= s.warnAt ? 'warning' : 'ok'
            }
          />
        ))}
      </div>

      {/* Individual sensor charts — 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sensors.map((s, i) => {
          const opts = lineChartOptions(isDark, {
            unit: s.unit,
            showLegend: false,
            showXAxis: false,
            labelFormatter: (l) => l,
          });

          const chartData = {
            labels: timeLabels,
            datasets: [{
              label: s.label,
              data: s.data,
              borderColor: s.color,
              backgroundColor: s.color + '18',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: s.color,
              pointHoverBorderColor: '#ffffff',
              pointHoverBorderWidth: 2,
              borderWidth: 2,
            }],
          };

          // Live value badge shown in card header
          const badge = (
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{ background: s.color + '22', color: s.color }}
            >
              {s.value?.toFixed(2) ?? '—'} {s.unit}
            </span>
          );

          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <ChartCard
                title={`${s.label} Trend`}
                subtitle="Hover to inspect values"
                badge={badge}
                color={s.color}
                defaultHeight={160}
                liveValue={s.value}
                unit={s.unit}
                warnAt={s.warnAt}
                critAt={s.critAt}
                data={s.data}
              >
                <Line data={chartData} options={opts} />
              </ChartCard>
            </motion.div>
          );
        })}
      </div>

      {/* Combined normalised overlay chart */}
      <ChartCard
        title="All Sensors — Normalised Overlay"
        subtitle="Values normalised 0–1 against their critical threshold. Hover to compare all sensors at the same timestamp."
        color="#8b5cf6"
        defaultHeight={220}
        data={sensors.flatMap((s) => s.data.map((v) => v / s.critAt))}
      >
        <Line
          data={{
            labels: timeLabels,
            datasets: sensors.map((s) => ({
              label: `${s.label} (${s.unit})`,
              data: s.data.map((v) => parseFloat((v / s.critAt).toFixed(3))),
              borderColor: s.color,
              backgroundColor: s.color + '10',
              fill: false,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: s.color,
              pointHoverBorderColor: '#ffffff',
              pointHoverBorderWidth: 2,
              borderWidth: 1.5,
            })),
          }}
          options={lineChartOptions(isDark, {
            showLegend: true,
            showXAxis: false,
            labelFormatter: (l) => l,
          })}
        />
      </ChartCard>

      {/* Latest reading table */}
      <div className="card overflow-x-auto">
        <h2 className="text-sm font-semibold text-secondary mb-3">Latest Reading</h2>
        <table className="w-full text-sm">
          <thead>
            <tr
              className="text-left text-xs text-muted border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <th className="pb-2 pr-4">Sensor</th>
              <th className="pb-2 pr-4">Value</th>
              <th className="pb-2 pr-4">Unit</th>
              <th className="pb-2 pr-4">Warn At</th>
              <th className="pb-2 pr-4">Crit At</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {sensors.map((s) => {
              const status =
                (s.value ?? 0) >= s.critAt ? 'critical' :
                (s.value ?? 0) >= s.warnAt ? 'warning' : 'ok';
              return (
                <tr key={s.key} className="text-primary">
                  <td className="py-2 pr-4 font-medium">{s.label}</td>
                  <td className="py-2 pr-4 font-mono font-semibold" style={{ color: s.color }}>
                    {s.value?.toFixed(2) ?? '—'}
                  </td>
                  <td className="py-2 pr-4 text-muted">{s.unit}</td>
                  <td className="py-2 pr-4 font-mono text-amber-500">{s.warnAt}</td>
                  <td className="py-2 pr-4 font-mono text-red-500">{s.critAt}</td>
                  <td className="py-2">
                    <span className={
                      status === 'critical' ? 'badge-danger' :
                      status === 'warning'  ? 'badge-warning' : 'badge-ok'
                    }>
                      {status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
