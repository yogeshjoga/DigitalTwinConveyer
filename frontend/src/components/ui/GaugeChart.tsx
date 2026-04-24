import { useEffect, useRef } from 'react';
import { useBeltStore } from '@/store/useBeltStore';

interface GaugeChartProps {
  value: number;   // 0–100
  label: string;
  unit?: string;
  thresholds?: { warning: number; critical: number };
  size?: number;
}

export default function GaugeChart({
  value,
  label,
  unit = '%',
  thresholds = { warning: 60, critical: 80 },
  size = 140,
}: GaugeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const theme     = useBeltStore((s) => s.theme);

  const getArcColor = (v: number) => {
    if (v >= thresholds.critical) return '#ef4444';
    if (v >= thresholds.warning)  return '#f59e0b';
    return '#27a372';
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark     = theme === 'dark';
    const trackColor = isDark ? '#334155' : '#e2e8f0';
    const textColor  = isDark ? '#ffffff' : '#0f172a';
    const subColor   = isDark ? '#94a3b8' : '#64748b';

    const cx = size / 2;
    const cy = size / 2;
    const r  = size * 0.38;
    const startAngle = Math.PI * 0.75;
    const endAngle   = Math.PI * 2.25;
    const progress   = startAngle + ((endAngle - startAngle) * Math.min(value, 100)) / 100;

    ctx.clearRect(0, 0, size, size);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.strokeStyle = trackColor;
    ctx.lineWidth   = 12;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Value arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, progress);
    ctx.strokeStyle = getArcColor(value);
    ctx.lineWidth   = 12;
    ctx.lineCap     = 'round';
    ctx.stroke();

    // Center value
    ctx.fillStyle    = textColor;
    ctx.font         = `bold ${size * 0.18}px Inter, sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(value)}${unit}`, cx, cy - 4);

    // Label
    ctx.fillStyle = subColor;
    ctx.font      = `${size * 0.09}px Inter, sans-serif`;
    ctx.fillText(label, cx, cy + size * 0.14);
  }, [value, size, label, unit, thresholds, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      aria-label={`${label}: ${value}${unit}`}
    />
  );
}
