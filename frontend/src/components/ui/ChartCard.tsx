import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2, X, Minus, ChevronDown,
  ZoomIn, ZoomOut, RotateCcw, TrendingUp,
  TrendingDown, Minus as FlatIcon, Activity,
} from 'lucide-react';
import { createPortal } from 'react-dom';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  color?: string;
  children: React.ReactNode;
  /** Used in fullscreen stats strip */
  liveValue?: number;
  unit?: string;
  warnAt?: number;
  critAt?: number;
  data?: number[];
  defaultHeight?: number;
}

type ViewState = 'normal' | 'minimized' | 'fullscreen';
type TimeRange = '5m' | '15m' | '30m' | '1h';

const TIME_RANGES: TimeRange[] = ['5m', '15m', '30m', '1h'];

function calcStats(data: number[]) {
  if (!data.length) return { min: 0, max: 0, avg: 0, trend: 'flat' as const };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const avg = data.reduce((a, b) => a + b, 0) / data.length;
  const half = Math.floor(data.length / 2);
  const firstHalfAvg = data.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
  const secondHalfAvg = data.slice(half).reduce((a, b) => a + b, 0) / (data.length - half || 1);
  const diff = secondHalfAvg - firstHalfAvg;
  const trend = diff > avg * 0.03 ? 'up' : diff < -avg * 0.03 ? 'down' : 'flat';
  return { min, max, avg, trend };
}

export default function ChartCard({
  title,
  subtitle,
  badge,
  color = '#27a372',
  children,
  liveValue,
  unit = '',
  warnAt,
  critAt,
  data = [],
  defaultHeight = 160,
}: ChartCardProps) {
  const [view, setView]           = useState<ViewState>('normal');
  const [timeRange, setTimeRange] = useState<TimeRange>('30m');
  const [zoom, setZoom]           = useState(1);
  const cardRef                   = useRef<HTMLDivElement>(null);

  const stats = calcStats(data);

  const statusColor =
    critAt && liveValue !== undefined && liveValue >= critAt ? '#ef4444' :
    warnAt && liveValue !== undefined && liveValue >= warnAt ? '#f59e0b' :
    color;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view === 'fullscreen') setView('normal');
      if (e.key === 'f' && view === 'normal') setView('fullscreen');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [view]);

  const toggleFullscreen = useCallback(() =>
    setView((v) => (v === 'fullscreen' ? 'normal' : 'fullscreen')), []);
  const toggleMinimize = useCallback(() =>
    setView((v) => (v === 'minimized' ? 'normal' : 'minimized')), []);

  // ── Fullscreen portal ──────────────────────────────────────────────────────
  const fullscreenPortal = (
    <AnimatePresence>
      {view === 'fullscreen' && createPortal(
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          {/* ── Top bar ─────────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
            style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
          >
            {/* Left: title + live dot */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }} />
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-60"
                  style={{ backgroundColor: statusColor }}
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-primary leading-tight">{title}</h2>
                {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
              </div>
              {/* Live badge */}
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44` }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: statusColor }} />
                LIVE
              </span>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-2">
              {badge}

              {/* Time range selector */}
              <div className="flex items-center gap-1 p-1 rounded-lg border"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                {TIME_RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className="px-2.5 py-1 rounded text-xs font-medium transition-all"
                    style={{
                      background:  timeRange === r ? color + '33' : 'transparent',
                      color:       timeRange === r ? color : 'var(--text-muted)',
                      fontWeight:  timeRange === r ? 700 : 400,
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1 p-1 rounded-lg border"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
                  className="p-1.5 rounded text-muted hover:text-primary transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn size={14} />
                </button>
                <span className="text-xs font-mono text-muted w-8 text-center">
                  {zoom.toFixed(2)}×
                </span>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  className="p-1.5 rounded text-muted hover:text-primary transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  onClick={() => setZoom(1)}
                  className="p-1.5 rounded text-muted hover:text-primary transition-colors"
                  title="Reset zoom"
                >
                  <RotateCcw size={12} />
                </button>
              </div>

              <span className="text-xs text-muted px-2 py-1 rounded border hidden md:block"
                style={{ borderColor: 'var(--color-border)' }}>
                ESC to exit
              </span>

              <button
                onClick={() => setView('normal')}
                className="p-2 rounded-lg transition-colors text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
                aria-label="Exit fullscreen"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Stats strip ─────────────────────────────────────────────── */}
          <div
            className="flex items-stretch gap-0 border-b flex-shrink-0"
            style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
          >
            {/* Current value — hero */}
            <div
              className="flex flex-col items-center justify-center px-8 py-4 border-r"
              style={{ borderColor: 'var(--color-border)', minWidth: 140 }}
            >
              <p className="text-xs text-muted uppercase tracking-widest mb-1">Current</p>
              <motion.p
                key={liveValue}
                initial={{ scale: 1.15, opacity: 0.6 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-4xl font-bold font-mono leading-none"
                style={{ color: statusColor }}
              >
                {liveValue?.toFixed(2) ?? '—'}
              </motion.p>
              <p className="text-sm text-muted mt-1">{unit}</p>
            </div>

            {/* Stats grid */}
            {[
              { label: 'Min',  value: stats.min.toFixed(2),  color: '#22c55e' },
              { label: 'Max',  value: stats.max.toFixed(2),  color: '#ef4444' },
              { label: 'Avg',  value: stats.avg.toFixed(2),  color: color     },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center justify-center px-6 py-4 border-r"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p className="text-xs text-muted uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-xs text-muted mt-1">{unit}</p>
              </div>
            ))}

            {/* Trend */}
            <div className="flex flex-col items-center justify-center px-6 py-4 border-r"
              style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs text-muted uppercase tracking-widest mb-2">Trend</p>
              {stats.trend === 'up'   && <TrendingUp   size={28} className="text-red-400" />}
              {stats.trend === 'down' && <TrendingDown size={28} className="text-green-400" />}
              {stats.trend === 'flat' && <FlatIcon     size={28} className="text-blue-400" />}
              <p className="text-xs font-semibold mt-1"
                style={{
                  color: stats.trend === 'up' ? '#ef4444' :
                         stats.trend === 'down' ? '#22c55e' : '#3b82f6',
                }}>
                {stats.trend === 'up' ? 'Rising' : stats.trend === 'down' ? 'Falling' : 'Stable'}
              </p>
            </div>

            {/* Threshold status */}
            <div className="flex flex-col items-center justify-center px-6 py-4 border-r"
              style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs text-muted uppercase tracking-widest mb-2">Status</p>
              <Activity size={24} style={{ color: statusColor }} />
              <p className="text-xs font-bold mt-1" style={{ color: statusColor }}>
                {critAt && liveValue !== undefined && liveValue >= critAt ? 'CRITICAL' :
                 warnAt && liveValue !== undefined && liveValue >= warnAt ? 'WARNING'  : 'NORMAL'}
              </p>
            </div>

            {/* Threshold bars */}
            {(warnAt || critAt) && (
              <div className="flex flex-col justify-center px-6 py-4 flex-1">
                <p className="text-xs text-muted uppercase tracking-widest mb-3">Thresholds</p>
                <div className="space-y-2">
                  {warnAt && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-amber-500 w-12">Warn</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-border)' }}>
                        <div className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${Math.min(((liveValue ?? 0) / warnAt) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted w-16 text-right">
                        {liveValue?.toFixed(1)} / {warnAt}
                      </span>
                    </div>
                  )}
                  {critAt && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-red-500 w-12">Crit</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--color-border)' }}>
                        <div className="h-full bg-red-500 rounded-full"
                          style={{ width: `${Math.min(((liveValue ?? 0) / critAt) * 100, 100)}%` }} />
                      </div>
                      <span className="text-xs font-mono text-muted w-16 text-right">
                        {liveValue?.toFixed(1)} / {critAt}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Chart area ──────────────────────────────────────────────── */}
          <div className="flex-1 p-6 overflow-hidden min-h-0">
            <div
              className="w-full h-full"
              style={{ transform: `scaleX(${zoom})`, transformOrigin: 'left center', transition: 'transform 0.3s ease' }}
            >
              {children}
            </div>
          </div>

          {/* ── Bottom info bar ─────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-6 py-2 border-t flex-shrink-0 text-xs text-muted"
            style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
          >
            <span>Showing: <strong className="text-primary">{timeRange}</strong> window · {data.length} data points</span>
            <span>Zoom: <strong className="text-primary">{zoom.toFixed(2)}×</strong> · Hover chart for exact values</span>
            <span className="hidden md:block">Press <kbd className="px-1 py-0.5 rounded border text-[10px]"
              style={{ borderColor: 'var(--color-border)' }}>ESC</kbd> to exit fullscreen</span>
          </div>
        </motion.div>,
        document.body
      )}
    </AnimatePresence>
  );

  // ── Normal card ────────────────────────────────────────────────────────────
  return (
    <>
      {fullscreenPortal}

      <motion.div
        ref={cardRef}
        layout
        className="card overflow-hidden"
        style={{ borderColor: view === 'minimized' ? color + '44' : 'var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <h2 className="text-sm font-semibold text-secondary truncate">{title}</h2>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {badge && <div className="mr-1">{badge}</div>}

            <button
              onClick={toggleMinimize}
              className="p-1.5 rounded-lg transition-colors text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
              title={view === 'minimized' ? 'Expand' : 'Minimize'}
            >
              <ChevronDown
                size={14}
                className="transition-transform duration-200"
                style={{ transform: view === 'minimized' ? 'rotate(0deg)' : 'rotate(180deg)' }}
              />
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg transition-colors text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
              title="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {subtitle && view !== 'minimized' && (
          <p className="text-xs text-muted mb-3">{subtitle}</p>
        )}

        {/* Minimized placeholder */}
        <AnimatePresence initial={false}>
          {view === 'minimized' && (
            <motion.button
              key="min"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 36, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleMinimize}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted hover:text-primary transition-colors overflow-hidden"
            >
              <ChevronDown size={14} />
              Click to expand
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chart body */}
        <AnimatePresence initial={false}>
          {view !== 'minimized' && (
            <motion.div
              key="chart"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: defaultHeight, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div style={{ height: defaultHeight }}>
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
