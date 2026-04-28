import { motion } from 'framer-motion';
import {
  Monitor, Type, Palette, Maximize2, LayoutGrid,
  RotateCcw, Sun, Moon, Check, SlidersHorizontal,
  Minus, Plus,
} from 'lucide-react';
import { useBeltStore, ACCENT_COLORS, DEFAULT_UI_SETTINGS } from '@/store/useBeltStore';
import type { AccentColor, FontSize, BorderRadius } from '@/store/useBeltStore';

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon: Icon, color, title, children }: {
  icon: React.ElementType; color: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="card space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '22' }}>
          <Icon size={14} style={{ color }} />
        </div>
        <h2 className="text-sm font-bold text-primary">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Option pill ───────────────────────────────────────────────────────────────
function OptionPill({ label, active, color, onClick, preview }: {
  label: string; active: boolean; color?: string; onClick: () => void; preview?: React.ReactNode;
}) {
  const c = color ?? '#27a372';
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
      style={{
        backgroundColor: active ? c + '18' : 'var(--color-surface)',
        border: `1.5px solid ${active ? c : 'var(--color-border)'}`,
        color: active ? c : 'var(--text-secondary)',
      }}
    >
      {preview}
      {label}
      {active && <Check size={11} className="ml-auto" style={{ color: c }} />}
    </button>
  );
}

export default function SettingsPage() {
  const { theme, setTheme, uiSettings, setUISettings, resetUISettings } = useBeltStore();

  const { zoom, fontSize, accentColor, borderRadius, compactMode } = uiSettings;
  const accent = ACCENT_COLORS[accentColor];

  const setZoom = (v: number) => setUISettings({ zoom: Math.min(130, Math.max(60, v)) });

  return (
    <div className="space-y-6 pb-16 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <SlidersHorizontal size={22} className="text-secondary" />
            UI Settings
          </h1>
          <p className="text-secondary text-sm mt-1">
            Customize zoom, typography, colors, and layout to match your screen and preference
          </p>
        </div>
        <button
          onClick={resetUISettings}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
          style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)', color: 'var(--text-muted)' }}
        >
          <RotateCcw size={13} />
          Reset to defaults
        </button>
      </div>

      {/* ── Zoom ── */}
      <Section icon={Maximize2} color="#3b82f6" title="Page Zoom">
        <p className="text-xs text-muted -mt-2">
          Scale the entire UI. 90% fits most 1080p screens comfortably — similar to browser 75% zoom.
        </p>

        {/* Zoom slider */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setZoom(zoom - 5)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ border: '1px solid var(--color-border)' }}>
              <Minus size={14} className="text-secondary" />
            </button>

            <div className="flex-1 relative">
              <input
                type="range" min={60} max={130} step={5}
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#3b82f6' }}
              />
              {/* Tick marks */}
              <div className="flex justify-between mt-1 px-0.5">
                {[60, 70, 80, 90, 100, 110, 120, 130].map((v) => (
                  <span key={v} className="text-[9px] text-muted">{v}</span>
                ))}
              </div>
            </div>

            <button onClick={() => setZoom(zoom + 5)}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style={{ border: '1px solid var(--color-border)' }}>
              <Plus size={14} className="text-secondary" />
            </button>

            <div className="w-16 text-center rounded-xl py-1.5 font-mono font-bold text-sm"
              style={{ backgroundColor: '#3b82f618', color: '#3b82f6', border: '1px solid #3b82f633' }}>
              {zoom}%
            </div>
          </div>

          {/* Preset buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: '75% — Compact', v: 75 },
              { label: '85% — Small',   v: 85 },
              { label: '90% — Default', v: 90 },
              { label: '100% — Full',   v: 100 },
              { label: '110% — Large',  v: 110 },
            ].map(({ label, v }) => (
              <button key={v} onClick={() => setZoom(v)}
                className="text-[11px] px-2.5 py-1.5 rounded-lg font-medium transition-all"
                style={{
                  backgroundColor: zoom === v ? '#3b82f618' : 'var(--color-surface)',
                  border: `1px solid ${zoom === v ? '#3b82f688' : 'var(--color-border)'}`,
                  color: zoom === v ? '#3b82f6' : 'var(--text-secondary)',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Theme ── */}
      <Section icon={Monitor} color="#8b5cf6" title="Color Theme">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setTheme('light')}
            className="flex items-center gap-3 p-4 rounded-xl transition-all"
            style={{
              backgroundColor: theme === 'light' ? '#8b5cf618' : 'var(--color-surface)',
              border: `1.5px solid ${theme === 'light' ? '#8b5cf6' : 'var(--color-border)'}`,
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm border border-slate-200">
              <Sun size={18} className="text-amber-500" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-primary">Light</p>
              <p className="text-[10px] text-muted">White panels, dark text</p>
            </div>
            {theme === 'light' && <Check size={14} className="ml-auto" style={{ color: '#8b5cf6' }} />}
          </button>

          <button
            onClick={() => setTheme('dark')}
            className="flex items-center gap-3 p-4 rounded-xl transition-all"
            style={{
              backgroundColor: theme === 'dark' ? '#8b5cf618' : 'var(--color-surface)',
              border: `1.5px solid ${theme === 'dark' ? '#8b5cf6' : 'var(--color-border)'}`,
            }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-900 shadow-sm border border-slate-700">
              <Moon size={18} className="text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-primary">Dark</p>
              <p className="text-[10px] text-muted">Dark panels, light text</p>
            </div>
            {theme === 'dark' && <Check size={14} className="ml-auto" style={{ color: '#8b5cf6' }} />}
          </button>
        </div>
      </Section>

      {/* ── Accent Color ── */}
      <Section icon={Palette} color={accent} title="Accent Color">
        <p className="text-xs text-muted -mt-2">Used for active nav items, buttons, and highlights.</p>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(ACCENT_COLORS) as [AccentColor, string][]).map(([key, hex]) => (
            <button
              key={key}
              onClick={() => setUISettings({ accentColor: key })}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all"
              style={{
                backgroundColor: accentColor === key ? hex + '18' : 'var(--color-surface)',
                border: `1.5px solid ${accentColor === key ? hex : 'var(--color-border)'}`,
                color: accentColor === key ? hex : 'var(--text-secondary)',
              }}
            >
              <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ backgroundColor: hex }} />
              {key}
              {accentColor === key && <Check size={11} style={{ color: hex }} />}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Font Size ── */}
      <Section icon={Type} color="#f59e0b" title="Font Size">
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'compact', label: 'Compact', size: '13px', desc: 'More content visible' },
            { key: 'default', label: 'Default',  size: '14px', desc: 'Balanced readability' },
            { key: 'large',   label: 'Large',    size: '16px', desc: 'Easier to read' },
          ] as { key: FontSize; label: string; size: string; desc: string }[]).map(({ key, label, size, desc }) => (
            <button
              key={key}
              onClick={() => setUISettings({ fontSize: key })}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
              style={{
                backgroundColor: fontSize === key ? '#f59e0b18' : 'var(--color-surface)',
                border: `1.5px solid ${fontSize === key ? '#f59e0b' : 'var(--color-border)'}`,
              }}
            >
              <span className="font-bold text-primary" style={{ fontSize: size }}>Aa</span>
              <div className="text-center">
                <p className="text-xs font-semibold text-primary">{label}</p>
                <p className="text-[10px] text-muted">{size} · {desc}</p>
              </div>
              {fontSize === key && <Check size={12} style={{ color: '#f59e0b' }} />}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Border Radius ── */}
      <Section icon={LayoutGrid} color="#06b6d4" title="Card Style">
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'sharp',   label: 'Sharp',   r: '4px',  desc: 'Angular, technical' },
            { key: 'default', label: 'Default', r: '12px', desc: 'Balanced, modern' },
            { key: 'rounded', label: 'Rounded', r: '20px', desc: 'Soft, friendly' },
          ] as { key: BorderRadius; label: string; r: string; desc: string }[]).map(({ key, label, r, desc }) => (
            <button
              key={key}
              onClick={() => setUISettings({ borderRadius: key })}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
              style={{
                backgroundColor: borderRadius === key ? '#06b6d418' : 'var(--color-surface)',
                border: `1.5px solid ${borderRadius === key ? '#06b6d4' : 'var(--color-border)'}`,
              }}
            >
              {/* Preview box */}
              <div className="w-12 h-8 border-2"
                style={{
                  borderRadius: r,
                  borderColor: borderRadius === key ? '#06b6d4' : 'var(--color-border)',
                  backgroundColor: borderRadius === key ? '#06b6d418' : 'var(--color-surface)',
                }} />
              <div className="text-center">
                <p className="text-xs font-semibold text-primary">{label}</p>
                <p className="text-[10px] text-muted">{desc}</p>
              </div>
              {borderRadius === key && <Check size={12} style={{ color: '#06b6d4' }} />}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Density ── */}
      <Section icon={LayoutGrid} color="#a855f7" title="Layout Density">
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: false, label: 'Comfortable', desc: 'Standard padding — default spacing', icon: '▣' },
            { key: true,  label: 'Compact',     desc: 'Tighter padding — more content visible', icon: '▪' },
          ].map(({ key, label, desc, icon }) => (
            <button
              key={String(key)}
              onClick={() => setUISettings({ compactMode: key })}
              className="flex items-center gap-3 p-4 rounded-xl transition-all"
              style={{
                backgroundColor: compactMode === key ? '#a855f718' : 'var(--color-surface)',
                border: `1.5px solid ${compactMode === key ? '#a855f7' : 'var(--color-border)'}`,
              }}
            >
              <span className="text-2xl">{icon}</span>
              <div className="text-left">
                <p className="text-sm font-bold text-primary">{label}</p>
                <p className="text-[10px] text-muted">{desc}</p>
              </div>
              {compactMode === key && <Check size={14} className="ml-auto" style={{ color: '#a855f7' }} />}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Live preview ── */}
      <div className="rounded-2xl p-5 space-y-3"
        style={{ backgroundColor: 'var(--color-panel)', border: `1.5px solid ${accent}44` }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
          Live Preview
        </p>
        <div className="grid grid-cols-3 gap-3">
          {['Belt Health', 'Belt Speed', 'Temperature'].map((label, i) => (
            <motion.div key={label}
              layout
              className="rounded-xl p-3 text-center"
              style={{ backgroundColor: 'var(--color-surface)', border: `1px solid ${accent}33` }}>
              <p className="text-[10px] text-muted">{label}</p>
              <p className="text-lg font-bold font-mono mt-0.5" style={{ color: accent }}>
                {['66%', '2.5 m/s', '37°C'][i]}
              </p>
            </motion.div>
          ))}
        </div>
        <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <p className="text-xs font-semibold text-primary">Sample card — this is how cards look with current settings</p>
          <p className="text-[11px] text-secondary mt-1">Zoom: {zoom}% · Theme: {theme} · Accent: {accentColor} · Font: {fontSize} · Radius: {borderRadius} · Density: {compactMode ? 'compact' : 'comfortable'}</p>
        </div>
      </div>
    </div>
  );
}
