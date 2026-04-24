import { useState } from 'react';
import { useMLPrediction, useLiveSensors } from '@/api/hooks';
import type { RichMLPrediction } from '@/api/hooks';
import GaugeChart from '@/components/ui/GaugeChart';
import RiskBar from '@/components/ui/RiskBar';
import AIChatPanel from '@/components/ai/AIChatPanel';
import {
  Brain, Clock, Shield, TrendingDown,
  Sparkles, AlertTriangle, CalendarClock, Zap,
  Thermometer, Activity, Timer,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBeltStore } from '@/store/useBeltStore';

// ── Anomaly forecast card ──────────────────────────────────────────────────────
function AnomalyCard({
  type, inHours, probability, severity,
}: {
  type: string; inHours: number; probability: number;
  severity: string;
}) {
  const days = Math.round(inHours / 24 * 10) / 10;
  const icon =
    type.includes('Tear')   ? Zap :
    type.includes('Burst')  ? AlertTriangle :
    type.includes('Heat')   ? Thermometer :
    Activity;
  const Icon = icon;

  const color =
    severity === 'critical' ? '#ef4444' :
    severity === 'warning'  ? '#f59e0b' : '#27a372';

  return (
    <div
      className="card flex flex-col gap-3"
      style={{ borderColor: color + '33' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
            <Icon size={14} style={{ color }} />
          </div>
          <span className="text-sm font-semibold text-primary">{type}</span>
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
          style={{ background: color + '22', color }}
        >
          {severity}
        </span>
      </div>

      {/* Time to event */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-muted">Predicted in</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-2xl font-bold font-mono" style={{ color }}>
              {inHours >= 9999 ? '—' : days}
            </span>
            {inHours < 9999 && <span className="text-sm text-muted">days</span>}
          </div>
          {inHours < 9999 && (
            <p className="text-[10px] text-muted mt-0.5">{inHours}h from now</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Probability</p>
          <p className="text-lg font-bold font-mono" style={{ color }}>
            {(probability * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Probability bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${probability * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PredictionPage() {
  const { data: pred, isLoading } = useMLPrediction();
  const { data: sensors }         = useLiveSensors();
  const selectedBelt              = useBeltStore((s) => s.selectedBeltEntry);

  if (isLoading || !pred) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Brain size={40} className="text-brand-500 mx-auto mb-3 animate-pulse" />
          <p className="text-secondary">Running ML inference…</p>
        </div>
      </div>
    );
  }

  const lifePercent = Math.min((pred.remainingLifeHours / 2000) * 100, 100);
  const overallRisk = pred.tearProbability > 0.7 ? 'HIGH' : pred.tearProbability > 0.4 ? 'MEDIUM' : 'LOW';
  const riskColor   = pred.tearProbability > 0.7 ? '#ef4444' : pred.tearProbability > 0.4 ? '#f59e0b' : '#27a372';

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">ML Prediction</h1>
          <p className="text-secondary text-sm mt-1">
            {selectedBelt.name} · {selectedBelt.id} · {selectedBelt.material}
          </p>
        </div>
      </div>

      {/* Confidence + belt info banner */}
      <div className="card flex items-center gap-4 border-brand-500/30 bg-brand-500/5 flex-wrap">
        <Brain size={24} className="text-brand-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-primary">Model Confidence — {selectedBelt.name}</p>
          <p className="text-xs text-secondary">
            {(pred.confidenceScore * 100).toFixed(1)}% confidence · based on last 30 min sensor data ·
            remaining life <strong className="text-primary">{pred.remainingLifeDays} days</strong> ({pred.remainingLifeHours.toFixed(0)}h)
          </p>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-[10px] text-muted uppercase tracking-wider">Confidence</p>
            <span className="text-2xl font-bold text-brand-500">{(pred.confidenceScore * 100).toFixed(0)}%</span>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted uppercase tracking-wider">Next Maint.</p>
            <span className="text-2xl font-bold text-amber-500">{pred.nextMaintenanceDays}d</span>
          </div>
        </div>
      </div>

      {/* ── Anomaly Forecast Cards ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-secondary flex items-center gap-2">
            <CalendarClock size={15} />
            Anomaly Forecasts — Time to Event
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {pred.anomalyForecasts.map((a, i) => (
            <motion.div
              key={a.type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <AnomalyCard {...a} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Remaining Life timeline ────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-secondary flex items-center gap-2">
            <Timer size={15} />
            Belt Life Timeline
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted">Remaining: <strong className="text-primary">{pred.remainingLifeDays} days</strong></span>
            <span className="text-muted">Maintenance in: <strong className="text-amber-500">{pred.nextMaintenanceDays} days</strong></span>
          </div>
        </div>

        {/* Timeline bar */}
        <div className="relative h-8 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
          {/* Life remaining */}
          <motion.div
            className="absolute left-0 top-0 h-full rounded-full"
            style={{
              background: `linear-gradient(to right, #27a372, ${riskColor})`,
              width: `${lifePercent}%`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${lifePercent}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
          {/* Maintenance marker */}
          <div
            className="absolute top-0 h-full w-0.5 bg-amber-400"
            style={{ left: `${Math.min((pred.maintenanceWindowHours / 2000) * 100, 98)}%` }}
          />
          {/* Label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white drop-shadow">
              {pred.remainingLifeHours.toFixed(0)}h remaining · {pred.remainingLifeDays} days
            </span>
          </div>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between text-[10px] text-muted mt-1.5 px-0.5">
          <span>Now</span>
          <span className="text-amber-500">▲ Maintenance ({pred.nextMaintenanceDays}d)</span>
          <span>End of Life (2000h)</span>
        </div>

        {/* Milestone chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {pred.anomalyForecasts.filter(a => a.inHours < 9999).map((a) => (
            <div
              key={a.type}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                background: (a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#27a372') + '18',
                color: a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#27a372',
                border: `1px solid ${(a.severity === 'critical' ? '#ef4444' : a.severity === 'warning' ? '#f59e0b' : '#27a372')}33`,
              }}
            >
              <span>⚑</span>
              {a.type} in {Math.round(a.inHours / 24)}d
            </div>
          ))}
        </div>
      </div>

      {/* ── Gauge grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          { value: lifePercent,                    label: 'Remaining Life', sub: `${pred.remainingLifeDays} days`, thresholds: { warning: 30, critical: 15 } },
          { value: pred.tearProbability * 100,     label: 'Tear Risk',      sub: `~${pred.tearInDays}d to event`,  thresholds: { warning: 40, critical: 70 } },
          { value: pred.burstRisk * 100,           label: 'Burst Risk',     sub: `~${Math.round(pred.burstInHours/24)}d to event`, thresholds: { warning: 40, critical: 70 } },
          { value: pred.overheatRisk * 100,        label: 'Overheat Risk',  sub: `~${Math.round(pred.overheatInHours/24)}d to event`, thresholds: { warning: 40, critical: 70 } },
        ].map(({ value, label, sub, thresholds }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="card flex flex-col items-center">
              <GaugeChart value={value} label={label} thresholds={thresholds} />
              {sub && <p className="text-xs font-medium mt-2" style={{ color: value > thresholds.critical ? '#ef4444' : value > thresholds.warning ? '#f59e0b' : '#27a372' }}>{sub}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Risk bars ─────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-secondary">Detailed Risk Breakdown</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: `Tear Probability (event in ~${pred.tearInDays}d)`,                     value: pred.tearProbability    },
            { label: `Burst Risk (event in ~${Math.round(pred.burstInHours/24)}d)`,          value: pred.burstRisk          },
            { label: `Overheat Risk (event in ~${Math.round(pred.overheatInHours/24)}d)`,    value: pred.overheatRisk       },
            { label: `Misalignment Risk (event in ~${Math.round(pred.misalignInHours/24)}d)`,value: pred.misalignmentRisk   },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-2 -mx-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-secondary">{label}</span>
              </div>
              <RiskBar label="" value={value} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: Clock,       color: '#3b82f6', label: 'Maintenance Window', value: `${pred.nextMaintenanceDays} days`, sub: `${pred.maintenanceWindowHours.toFixed(0)}h`  },
          { icon: TrendingDown,color: '#f59e0b', label: 'Remaining Life',     value: `${pred.remainingLifeDays} days`,   sub: `${pred.remainingLifeHours.toFixed(0)}h`       },
          { icon: Shield,      color: riskColor, label: 'Overall Risk Level', value: overallRisk,                        sub: `Confidence ${(pred.confidenceScore*100).toFixed(0)}%` },
        ].map(({ icon: Icon, color, label, value, sub }) => (
          <div key={label} className="card flex items-center gap-4">
            <Icon size={24} style={{ color }} className="flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-muted">{label}</p>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Smart insights ────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-secondary">Smart Insights — {selectedBelt.name}</h2>
        </div>
        <ul className="space-y-2.5 text-sm text-secondary">
          <li className="flex items-start gap-2">
            <span className="text-brand-500 mt-0.5 flex-shrink-0">→</span>
            Schedule maintenance in <strong className="text-primary mx-1">{pred.nextMaintenanceDays} days</strong>
            ({pred.maintenanceWindowHours.toFixed(0)}h) to prevent unplanned downtime on {selectedBelt.name}.
          </li>
          <li className="flex items-start gap-2">
            <span className={`mt-0.5 flex-shrink-0 ${pred.tearProbability > 0.5 ? 'text-red-500' : 'text-brand-500'}`}>→</span>
            {pred.tearProbability > 0.5
              ? <><strong className="text-red-500 mr-1">⚠ Tear risk high.</strong> Expected in ~{pred.tearInDays} days — reduce belt speed and inspect surface immediately.</>
              : <>Tear event predicted in ~<strong className="text-primary mx-1">{pred.tearInDays} days</strong> — monitor load cell and vibration closely.</>
            }
          </li>
          <li className="flex items-start gap-2">
            <span className={`mt-0.5 flex-shrink-0 ${pred.overheatRisk > 0.5 ? 'text-amber-500' : 'text-brand-500'}`}>→</span>
            {pred.overheatRisk > 0.5
              ? <><strong className="text-amber-500 mr-1">⚠ Overheat risk elevated.</strong> Expected in ~{Math.round(pred.overheatInHours/24)} days — inspect idler friction zones.</>
              : <>Overheat event in ~<strong className="text-primary mx-1">{Math.round(pred.overheatInHours/24)} days</strong> — check thermal zones 3–5 at next inspection.</>
            }
          </li>
          <li className="flex items-start gap-2">
            <span className="text-brand-500 mt-0.5 flex-shrink-0">→</span>
            Model confidence <strong className="text-primary mx-1">{(pred.confidenceScore * 100).toFixed(0)}%</strong>
            — {pred.confidenceScore > 0.8 ? 'predictions are reliable for planning.' : 'collect more sensor data to improve accuracy.'}
          </li>
        </ul>
      </div>

      {/* AI Chat Panel */}
      <AIChatPanel injectedContext={null} onClearInjected={() => {}} />
    </div>
  );
}
