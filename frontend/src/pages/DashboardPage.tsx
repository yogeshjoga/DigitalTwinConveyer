import { Activity, Thermometer, Zap, Clock, AlertTriangle, Heart, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import StatCard from '@/components/ui/StatCard';
import GaugeChart from '@/components/ui/GaugeChart';
import RiskBar from '@/components/ui/RiskBar';
import AlertBadge from '@/components/ui/AlertBadge';
import MinistryHeader from '@/components/layout/MinistryHeader';
import { exportPDF, exportExcel, type ReportData } from '@/lib/exportReport';
import {
  useDashboardSummary,
  useAlerts,
  useMLPrediction,
  useSensorHistory,
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
import { Line } from 'react-chartjs-2';
import { useBeltStore } from '@/store/useBeltStore';
import { lineChartOptions } from '@/lib/chartConfig';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function DashboardPage() {
  const { data: summary } = useDashboardSummary();
  const { data: alerts }  = useAlerts();
  const { data: pred }    = useMLPrediction();
  const { data: history } = useSensorHistory(30);
  const theme             = useBeltStore((s) => s.theme);
  const selectedBelt      = useBeltStore((s) => s.selectedBeltEntry);
  const isDark            = theme === 'dark';
  const [exportMenu, setExportMenu] = useState(false);

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

  // Build time labels from actual timestamps when available
  const timeLabels = history?.map((r) =>
    new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  ) ?? [];

  const loadChartData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'UDL',
        data: history?.map((r) => r.udl) ?? [],
        borderColor: '#27a372',
        backgroundColor: 'rgba(39,163,114,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#27a372',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = lineChartOptions(isDark, {
    unit: 'kg/m',
    showLegend: false,
    showXAxis: false,
    labelFormatter: (label) => label,
  });

  return (
    <div className="space-y-6">
      {/* Ministry of Steel branding */}
      <MinistryHeader />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-secondary text-sm mt-1">Real-time belt monitoring overview</p>
        </div>

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

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-sm font-semibold text-secondary mb-1">Load Trend (30 min)</h2>
          <p className="text-xs text-muted mb-4">Hover over the chart to see UDL values at each point</p>
          <div className="h-48">
            <Line data={loadChartData} options={chartOptions} />
          </div>
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
