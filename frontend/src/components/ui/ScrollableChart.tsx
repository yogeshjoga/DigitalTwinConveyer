/**
 * ScrollableChart — Grafana-style horizontally-scrollable Chart.js wrapper.
 *
 * Animation strategy:
 *   Chart.js animation is DISABLED (animation: false) to avoid the "all
 *   points fly in" glitch. The right-to-left slide effect is achieved purely
 *   via CSS scroll-behavior: smooth on the viewport container — when a new
 *   point is appended the canvas grows by ~12 px and the viewport smoothly
 *   scrolls right to follow it, which looks exactly like the chart is
 *   sliding left as new data arrives.
 */

import { useRef, useEffect, useState, type ReactNode } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ScrollableChartProps {
  title: string;
  subtitle?: string;
  pointCount: number;
  height?: number;
  basePxPerPoint?: number;
  badge?: ReactNode;
  /** Render-prop — receives (width, height). animationOpts is no longer used. */
  children: (width: number, height: number, animationOpts: object) => ReactNode;
  onStateChange?: (zoom: number, autoScroll: boolean) => void;
  className?: string;
  accentColor?: string;
}

export default function ScrollableChart({
  title,
  subtitle,
  pointCount,
  height = 220,
  basePxPerPoint = 12,
  badge,
  children,
  onStateChange,
  className = '',
  accentColor = '#27a372',
}: ScrollableChartProps) {
  const scrollRef      = useRef<HTMLDivElement>(null);
  const prevCount      = useRef(0);
  const initialLoadDone = useRef(false);

  const [zoom, setZoom]             = useState(1);
  const [autoScroll, setAutoScroll] = useState(true);

  const PX_PER_POINT = Math.max(6, basePxPerPoint * zoom);
  const chartWidth   = Math.max(pointCount * PX_PER_POINT, 600);

  // Scroll to right edge when new points arrive or zoom changes.
  // - Before initial load settles: always instant snap (no animation).
  // - After settled: smooth scroll only when exactly new points trickle in
  //   (i.e. small incremental additions, not a bulk load).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !autoScroll) return;

    const added = pointCount - prevCount.current;
    prevCount.current = pointCount;

    // Consider initial load "done" once we've seen data and had one stable render
    if (!initialLoadDone.current) {
      if (pointCount > 0) {
        // Snap instantly — no scroll animation during initial data fill
        el.scrollLeft = el.scrollWidth;
        // Mark settled after a short delay so rapid initial batches don't trigger smooth
        const t = setTimeout(() => { initialLoadDone.current = true; }, 800);
        return () => clearTimeout(t);
      }
      return;
    }

    if (added > 0 && added <= 5) {
      // Small incremental update — smooth slide (the "new point arrives" effect)
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    } else {
      // Bulk update (zoom change, large batch) — instant reposition
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

  const handleZoomIn = () =>
    setZoom((z) => { const n = Math.min(z * 1.5, 8); onStateChange?.(n, autoScroll); return n; });

  const handleZoomOut = () =>
    setZoom((z) => { const n = Math.max(z / 1.5, 0.25); onStateChange?.(n, autoScroll); return n; });

  const handleReset = () => {
    setZoom(1);
    setAutoScroll(true);
    onStateChange?.(1, true);
    requestAnimationFrame(() => {
      if (scrollRef.current)
        scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    });
  };

  // Pass animation:false so Chart.js never re-animates all points on update
  const animationOpts = { animation: false as const };

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
          <button onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Zoom in">
            <ZoomIn size={13} />
          </button>
          <button onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Zoom out">
            <ZoomOut size={13} />
          </button>
          <button onClick={handleReset}
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            title="Reset · jump to latest">
            <RotateCcw size={12} />
          </button>

          {/* LIVE / PAUSED pill */}
          <div className="flex items-center gap-1.5 ml-1 px-2 py-1 rounded-lg transition-colors"
            style={{
              backgroundColor: autoScroll ? accentColor + '18' : 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${autoScroll ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: autoScroll ? accentColor : '#94a3b8' }} />
            <span className="text-[10px] font-mono font-semibold"
              style={{ color: autoScroll ? accentColor : 'var(--text-muted)' }}>
              {autoScroll ? 'LIVE' : 'PAUSED'}
            </span>
          </div>

          <span className="text-[10px] text-muted font-mono ml-1 hidden sm:block">
            {pointCount} pts
          </span>
        </div>
      </div>

      {/* Scrollable canvas area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="overflow-x-auto overflow-y-hidden"
        style={{ cursor: 'grab', WebkitOverflowScrolling: 'touch' }}
      >
        {/* position:relative required for Chart.js responsive mode */}
        <div style={{ position: 'relative', width: chartWidth, height, minWidth: '100%' }}>
          {children(chartWidth, height, animationOpts)}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-2.5 pt-1 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] text-muted">← scroll for history · zoom ±</span>
        <span className="text-[10px] font-mono text-muted">{zoom.toFixed(2)}×</span>
      </div>
    </div>
  );
}
