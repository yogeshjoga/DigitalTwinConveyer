/**
 * ScrollableChart — Grafana-style horizontally-scrollable Chart.js wrapper.
 *
 * Y-axis is rendered in a fixed-width sticky column on the left so it
 * stays visible while the user scrolls the time axis to the right.
 *
 * How it works:
 *  - The outer wrapper is `display: flex`.
 *  - Left column (Y_AXIS_WIDTH px): a Chart.js <Line> with only the Y-axis
 *    visible, no data drawn, `responsive: true`, same height as the main chart.
 *  - Right column: the horizontally-scrollable canvas with Y-axis hidden.
 *  - Both charts receive the same `yMin`/`yMax` so the scales align perfectly.
 *  - The left column uses `position: sticky; left: 0` so it never scrolls.
 */

import { useRef, useEffect, useState, useMemo, type ReactNode } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useBeltStore } from '@/store/useBeltStore';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

const Y_AXIS_WIDTH = 52; // px — wide enough for 4-digit numbers

interface ScrollableChartProps {
  title: string;
  subtitle?: string;
  pointCount: number;
  /** The data values — used to compute Y min/max for the sticky axis */
  yValues?: number[];
  height?: number;
  basePxPerPoint?: number;
  badge?: ReactNode;
  children: (width: number, height: number, animationOpts: object) => ReactNode;
  onStateChange?: (zoom: number, autoScroll: boolean) => void;
  className?: string;
  accentColor?: string;
  isFrozen?: boolean;
}

export default function ScrollableChart({
  title,
  subtitle,
  pointCount,
  yValues = [],
  height = 220,
  basePxPerPoint = 12,
  badge,
  children,
  onStateChange,
  className = '',
  accentColor = '#27a372',
  isFrozen = false,
}: ScrollableChartProps) {
  const scrollRef       = useRef<HTMLDivElement>(null);
  const prevCount       = useRef(0);
  const initialLoadDone = useRef(false);
  const theme           = useBeltStore((s) => s.theme);
  const isDark          = theme === 'dark';

  const [zoom, setZoom]             = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);

  const PX_PER_POINT = Math.max(6, basePxPerPoint * zoom);
  const chartWidth   = Math.max(pointCount * PX_PER_POINT, 600);

  // Compute Y range from data for the sticky axis
  const { yMin, yMax } = useMemo(() => {
    if (!yValues.length) return { yMin: 0, yMax: 1 };
    const min = Math.min(...yValues);
    const max = Math.max(...yValues);
    const pad = (max - min) * 0.08 || 1;
    return { yMin: Math.floor(min - pad), yMax: Math.ceil(max + pad) };
  }, [yValues]);

  // Auto-scroll logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !autoScroll) return;
    const added = pointCount - prevCount.current;
    prevCount.current = pointCount;
    if (!initialLoadDone.current) {
      if (pointCount > 0) {
        el.scrollLeft = el.scrollWidth;
        const t = setTimeout(() => { initialLoadDone.current = true; }, 800);
        return () => clearTimeout(t);
      }
      return;
    }
    if (added > 0 && added <= 5) {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    } else {
      el.scrollLeft = el.scrollWidth;
    }
  }, [pointCount, zoom, autoScroll]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atEnd = el.scrollWidth - el.scrollLeft - el.clientWidth < 10;
    if (atEnd !== autoScroll) {
      setAutoScroll(atEnd);
      onStateChange?.(zoom, atEnd);
    }
  };

  const handleZoomIn  = () => setZoom((z) => { const n = Math.min(z * 1.5, 8);   onStateChange?.(n, autoScroll); return n; });
  const handleZoomOut = () => setZoom((z) => { const n = Math.max(z / 1.5, 0.25); onStateChange?.(n, autoScroll); return n; });
  const handleReset   = () => {
    setZoom(1); setAutoScroll(true); onStateChange?.(1, true);
    requestAnimationFrame(() => { if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth; });
  };

  const animationOpts = { animation: false as const };

  // Theme colors
  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const tickColor = isDark ? '#64748b' : '#94a3b8';

  // Sticky Y-axis chart — no data, just the axis
  const yAxisOpts: import('chart.js').ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    events: [],           // no hover/tooltip on the axis chart
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: {
        display: true,
        position: 'left',
        min: yMin,
        max: yMax,
        grid: { color: gridColor, drawTicks: false },
        border: { display: false },
        ticks: {
          color: tickColor,
          font: { size: 9 },
          maxTicksLimit: 6,
          padding: 4,
        },
      },
    },
    layout: { padding: { top: 4, bottom: 4 } },
  };

  return (
    <div className={`card p-0 overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-secondary truncate">{title}</h2>
            {badge}
          </div>
          {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-3">
          <button onClick={handleZoomIn}  className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Zoom in"><ZoomIn size={13} /></button>
          <button onClick={handleZoomOut} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Zoom out"><ZoomOut size={13} /></button>
          <button onClick={handleReset}   className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors" title="Reset · jump to latest"><RotateCcw size={12} /></button>

          <div className="flex items-center gap-1.5 ml-1 px-2 py-1 rounded-lg transition-colors"
            style={{
              backgroundColor: isFrozen ? '#ef444418' : autoScroll ? accentColor + '18' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${!isFrozen && autoScroll ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: isFrozen ? '#ef4444' : autoScroll ? accentColor : '#94a3b8' }} />
            <span className="text-[10px] font-mono font-semibold"
              style={{ color: isFrozen ? '#ef4444' : autoScroll ? accentColor : 'var(--text-muted)' }}>
              {isFrozen ? 'STOPPED' : autoScroll ? 'LIVE' : 'PAUSED'}
            </span>
          </div>

          <span className="text-[10px] text-muted font-mono ml-1 hidden sm:block">{pointCount} pts</span>
        </div>
      </div>

      {/* Chart area: sticky Y-axis + scrollable canvas */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sticky Y-axis column ── */}
        <div
          className="flex-shrink-0 z-10"
          style={{
            width: Y_AXIS_WIDTH,
            height,
            position: 'sticky',
            left: 0,
            backgroundColor: 'var(--color-panel)',
            borderRight: `1px solid ${gridColor}`,
          }}
        >
          {yValues.length > 0 && (
            <Line
              data={{ labels: [''], datasets: [{ data: [yMin, yMax], borderWidth: 0, pointRadius: 0 }] }}
              options={yAxisOpts}
            />
          )}
        </div>

        {/* ── Scrollable canvas ── */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-x-auto overflow-y-hidden"
          style={{ cursor: isFrozen ? 'default' : 'grab', WebkitOverflowScrolling: 'touch' }}
        >
          <div style={{ position: 'relative', width: chartWidth, height, minWidth: '100%' }}>
            {children(chartWidth, height, animationOpts)}

            {isFrozen && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ backgroundColor: 'rgba(239,68,68,0.04)' }}>
                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  ⏸ Belt Stopped — Data Frozen
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-2.5 pt-1 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] text-muted">
          {isFrozen ? '⏸ Belt stopped — chart frozen at last reading' : '← scroll for history · zoom ±'}
        </span>
        <span className="text-[10px] font-mono text-muted">{zoom.toFixed(2)}×</span>
      </div>
    </div>
  );
}
