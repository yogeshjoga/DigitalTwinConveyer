import { useRef, useEffect } from 'react';
import { useThermalZones } from '@/api/hooks';
import { motion } from 'framer-motion';
import type { ThermalZone } from '@/types';
import { useBeltStore } from '@/store/useBeltStore';

// ── Color helpers ──────────────────────────────────────────────────────────────
/** Returns an RGB array [r,g,b] for a temperature 20–200°C */
function tempToRGB(temp: number): [number, number, number] {
  const t = Math.min(Math.max((temp - 20) / 180, 0), 1);
  // Blue → Cyan → Green → Yellow → Orange → Red
  if (t < 0.25) {
    const s = t / 0.25;
    return [Math.round(s * 0),   Math.round(s * 200), Math.round(255 - s * 55)];
  }
  if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return [Math.round(s * 50),  Math.round(200 + s * 55), Math.round(200 - s * 200)];
  }
  if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return [Math.round(50 + s * 205), Math.round(255 - s * 100), 0];
  }
  const s = (t - 0.75) / 0.25;
  return [255, Math.round(155 - s * 155), 0];
}

function rgbStr(rgb: [number, number, number], alpha = 1) {
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
}

function tempColorStr(temp: number, alpha = 1) {
  return rgbStr(tempToRGB(temp), alpha);
}

// ── Canvas heat map ────────────────────────────────────────────────────────────
function HeatMapCanvas({ zones, isDark }: { zones: ThermalZone[]; isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !zones.length) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const maxPos = zones[zones.length - 1]?.position ?? 1;

    // ── Draw smooth gradient heat band ──────────────────────────────────────
    // Build a horizontal gradient across all zone positions
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    zones.forEach((zone) => {
      const stop = zone.position / maxPos;
      const rgb  = tempToRGB(zone.temperature);
      grad.addColorStop(Math.min(stop, 1), rgbStr(rgb, 0.92));
    });

    // Main heat band (top 60% of canvas)
    const bandH = Math.round(H * 0.62);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, bandH, [8, 8, 0, 0]);
    ctx.fill();

    // Glow reflection below band
    const reflGrad = ctx.createLinearGradient(0, bandH, 0, H);
    reflGrad.addColorStop(0, isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)');
    reflGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = reflGrad;
    ctx.fillRect(0, bandH, W, H - bandH);

    // ── Zone tick marks + temperature labels ────────────────────────────────
    zones.forEach((zone, i) => {
      const x   = (zone.position / maxPos) * W;
      const rgb = tempToRGB(zone.temperature);

      // Tick line
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)';
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, bandH);
      ctx.stroke();

      // Temperature label (every other zone to avoid crowding)
      if (i % 2 === 0 || zones.length <= 6) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.75)';
        ctx.font      = 'bold 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${zone.temperature.toFixed(0)}°`, x, bandH - 6);
      }

      // Critical zone pulse marker
      if (zone.status === 'critical') {
        ctx.strokeStyle = rgbStr([255, 50, 50], 0.9);
        ctx.lineWidth   = 2;
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(x - 12, 2, 24, bandH - 4);
        ctx.setLineDash([]);
      }
    });

    // ── Position labels at bottom ───────────────────────────────────────────
    ctx.fillStyle = isDark ? 'rgba(148,163,184,0.8)' : 'rgba(100,116,139,0.8)';
    ctx.font      = '9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0 m', 4, H - 4);
    ctx.textAlign = 'right';
    ctx.fillText(`${maxPos.toFixed(0)} m`, W - 4, H - 4);
    ctx.textAlign = 'center';
    ctx.fillText('Belt Length →', W / 2, H - 4);

  }, [zones, isDark]);

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={90}
      className="w-full rounded-lg"
      style={{ display: 'block' }}
      aria-label="Belt thermal heat map"
    />
  );
}

// ── Color scale legend ─────────────────────────────────────────────────────────
function ColorScaleLegend({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    for (let i = 0; i <= 20; i++) {
      const temp = 20 + (i / 20) * 180;
      grad.addColorStop(i / 20, tempColorStr(temp, 1));
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 4);
    ctx.fill();

    // Tick labels
    const labels = [20, 60, 100, 140, 180, 200];
    labels.forEach((temp) => {
      const x = ((temp - 20) / 180) * W;
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
      ctx.font      = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${temp}°`, x, H - 2);
    });
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={22}
      className="w-full rounded"
      aria-label="Temperature color scale"
    />
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ThermalPage() {
  const { data: zones } = useThermalZones();
  const theme           = useBeltStore((s) => s.theme);
  const isDark          = theme === 'dark';

  const maxTemp = zones?.length ? Math.max(...zones.map((z) => z.temperature)) : 0;
  const avgTemp = zones?.length
    ? zones.reduce((s, z) => s + z.temperature, 0) / zones.length
    : 0;
  const critCount = zones?.filter((z) => z.status === 'critical').length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Thermal Monitoring</h1>
        <p className="text-secondary text-sm mt-1">Heat zones and friction areas along the belt</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-xs text-muted uppercase tracking-wider">Max Temp</p>
          <p className="text-2xl font-bold mt-1" style={{ color: tempColorStr(maxTemp) }}>
            {maxTemp.toFixed(1)}°C
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-muted uppercase tracking-wider">Avg Temp</p>
          <p className="text-2xl font-bold mt-1" style={{ color: tempColorStr(avgTemp) }}>
            {avgTemp.toFixed(1)}°C
          </p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-muted uppercase tracking-wider">Critical Zones</p>
          <p className={`text-2xl font-bold mt-1 ${critCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
            {critCount}
          </p>
        </div>
      </div>

      {/* Heat map */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-secondary">Belt Heat Map</h2>
          <span className="text-xs text-muted">{zones?.length ?? 0} zones · hover zone table for details</span>
        </div>

        {/* Canvas heat map */}
        {zones?.length ? (
          <HeatMapCanvas zones={zones} isDark={isDark} />
        ) : (
          <div
            className="h-20 rounded-lg flex items-center justify-center text-muted text-sm"
            style={{ backgroundColor: 'var(--color-surface)' }}
          >
            Loading thermal data…
          </div>
        )}

        {/* Color scale legend */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-muted mb-1 px-0.5">
            <span>Cold (20°C)</span>
            <span>Temperature Scale</span>
            <span>Hot (200°C)</span>
          </div>
          <ColorScaleLegend isDark={isDark} />
        </div>
      </div>

      {/* Zone details table */}
      <div className="card overflow-x-auto">
        <h2 className="text-sm font-semibold text-secondary mb-3">Zone Details</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted border-b"
              style={{ borderColor: 'var(--color-border)' }}>
              <th className="pb-2 pr-4">Zone</th>
              <th className="pb-2 pr-4">Position</th>
              <th className="pb-2 pr-4">Temperature</th>
              <th className="pb-2 pr-4">Friction Index</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {zones?.map((zone, i) => (
              <motion.tr
                key={zone.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="text-primary"
              >
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: tempColorStr(zone.temperature) }}
                    />
                    <span className="font-medium">Zone {i + 1}</span>
                  </div>
                </td>
                <td className="py-2 pr-4 font-mono">{zone.position.toFixed(1)} m</td>
                <td className="py-2 pr-4">
                  <span
                    className="font-mono font-bold px-2 py-0.5 rounded text-xs"
                    style={{
                      backgroundColor: tempColorStr(zone.temperature, 0.15),
                      color: tempColorStr(zone.temperature),
                    }}
                  >
                    {zone.temperature.toFixed(1)}°C
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: 'var(--color-border)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${zone.frictionIndex * 100}%`,
                          backgroundColor: zone.frictionIndex > 0.7 ? '#ef4444'
                            : zone.frictionIndex > 0.4 ? '#f59e0b' : '#27a372',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono w-8 text-right">
                      {(zone.frictionIndex * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="py-2">
                  <span className={
                    zone.status === 'critical' ? 'badge-danger' :
                    zone.status === 'warning'  ? 'badge-warning' : 'badge-ok'
                  }>
                    {zone.status.toUpperCase()}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
