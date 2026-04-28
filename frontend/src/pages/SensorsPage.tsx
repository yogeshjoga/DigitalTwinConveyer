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
import { useLiveSensors, useSensorHistory } from '@/api/hooks';
import { Activity, Thermometer, Zap, Wind } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import ScrollableChart from '@/components/ui/ScrollableChart';
import { motion } from 'framer-motion';
import { useBeltStore } from '@/store/useBeltStore';
import { getThemeColors } from '@/lib/chartConfig';
import { useMultiSeriesBuffer } from '@/lib/useTimeSeriesBuffer';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function SensorsPage() {
  const { data: live }    = useLiveSensors();
  const { data: history } = useSensorHistory(30);
  const theme             = useBeltStore((s) => s.theme);
  const isDark            = theme === 'dark';
  const colors            = getThemeColors(isDark);

  // Accumulate all sensor fields into one shared buffer
  const buf = useMultiSeriesBuffer(
    'sensors-page',
    history,
    ['loadCell', 'temperature', 'vibration', 'beltSpeed'],
    2000,
  );
  const { labels, series } = buf;

  const sensors = [
    {
      key: 'loadCell',
      label: 'Load Cell',
      unit: 'kg',
      color: '#27a372',
      icon: Zap,
      value: live?.loadCell,
      data: series['loadCell'] ?? [],
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
      data: series['temperature'] ?? [],
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
      data: series['vibration'] ?? [],
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
      data: series['beltSpeed'] ?? [],
      warnAt: 5.5,
      critAt: 6,
    },
  ];

  // Build Chart.js options — responsive:true so Chart.js fills the container div
  function makeSensorOpts(unit: string): ChartOptions<'line'> {
    return {
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
            label: (ctx) => `  ${typeof ctx.parsed.y === 'number' ? ctx.parsed.y.toFixed(2) : ctx.parsed.y} ${unit}`,
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
  }

  const overlayOpts: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
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
          label: (ctx) => `  ${ctx.dataset.label}: ${typeof ctx.parsed.y === 'number' ? ctx.parsed.y.toFixed(3) : ctx.parsed.y}`,
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
        min: 0,
        max: 1.1,
      },
    },
    elements: {
      point: { radius: 0, hoverRadius: 5, hoverBorderWidth: 2, hoverBackgroundColor: '#ffffff' },
      line:  { borderWidth: 1.5 },
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Sensor Monitoring</h1>
        <p className="text-secondary text-sm mt-1">
          Live readings — scroll ← on any chart to explore history · zoom ± for density
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
          const opts = makeSensorOpts(s.unit);
          return (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <ScrollableChart
                title={`${s.label} Trend`}
                subtitle={`${s.unit} — scroll ← for history`}
                pointCount={labels.length}
                height={160}
                accentColor={s.color}
                isFrozen={buf.isFrozen}
                badge={
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: s.color + '22', color: s.color }}
                  >
                    {s.value?.toFixed(2) ?? '—'} {s.unit}
                  </span>
                }
              >
                {(_w, _h, anim) => (
                  <Line
                    data={{
                      labels,
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
                    }}
                    options={{ ...opts, ...anim }}
                  />
                )}
              </ScrollableChart>
            </motion.div>
          );
        })}
      </div>

      {/* Combined normalised overlay chart */}
      <ScrollableChart
        title="All Sensors — Normalised Overlay"
        subtitle="Values normalised 0–1 against critical threshold · scroll ← for history"
        pointCount={labels.length}
        height={220}
        accentColor="#8b5cf6"
        isFrozen={buf.isFrozen}
      >
        {(_w, _h, anim) => (
          <Line
            data={{
              labels,
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
            options={{ ...overlayOpts, ...anim }}
          />
        )}
      </ScrollableChart>

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
