import { useState, useRef, useEffect } from 'react';
import { useVisionDetections } from '@/api/hooks';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { DefectType, VisionDetection } from '@/types';
import {
  Scissors, Circle, AlignLeft, Layers,
  LayoutGrid, CheckCircle2, ZoomIn, X,
  VolumeX, Wifi,
} from 'lucide-react';
import DetectionDetailModal from '@/components/vision/DetectionDetailModal';

// ── Import all defect images ───────────────────────────────────────────────────
// Tears
import tear1 from '@/assets/tears/tear_1.png';
import tear2 from '@/assets/tears/tear_2.png';
import tear3 from '@/assets/tears/tear_3.png';
import tear4 from '@/assets/tears/tear_4.png';
import tear5 from '@/assets/tears/tear_5.png';
// Holes
import hole1 from '@/assets/holes/hole_1.png';
import hole2 from '@/assets/holes/hole_2.png';
import hole3 from '@/assets/holes/hole_3.png';
import hole4 from '@/assets/holes/hole-4.png';
import hole5 from '@/assets/holes/hole_5.png';
import hole6 from '@/assets/holes/hole_6.png';
// Edge damage
import edge1 from '@/assets/edge_damage/edge_1.png';
import edge2 from '@/assets/edge_damage/edge_2.png';
import edge3 from '@/assets/edge_damage/edge_3.png';
import edge4 from '@/assets/edge_damage/edge_4.png';
import edge5 from '@/assets/edge_damage/edge_5.png';
import edge6 from '@/assets/edge_damage/edge_6.png';
import edge7 from '@/assets/edge_damage/edge_7.png';
// Layer peeling
import layer1 from '@/assets/layer_peeling/layer_1.png';
import layer2 from '@/assets/layer_peeling/layer_2.png';
import layer3 from '@/assets/layer_peeling/layer_3.png';
import layer4 from '@/assets/layer_peeling/layer_4.png';
import layer5 from '@/assets/layer_peeling/layer_5.png';
import layer6 from '@/assets/layer_peeling/layer_6.png';
import layer7 from '@/assets/layer_peeling/layer_7.png';
import layer8 from '@/assets/layer_peeling/layer_8.png';
import layer9 from '@/assets/layer_peeling/layer_9.png';

// ── Video asset ────────────────────────────────────────────────────────────────
import frontViewVideo from '@/assets/front_view.mp4';

// ── Image pools per defect type ────────────────────────────────────────────────
const DEFECT_IMAGES: Record<Exclude<DefectType, 'none'>, string[]> = {
  tear:          [tear1, tear2, tear3, tear4, tear5],
  hole:          [hole1, hole2, hole3, hole4, hole5, hole6],
  edge_damage:   [edge1, edge2, edge3, edge4, edge5, edge6, edge7],
  layer_peeling: [layer1, layer2, layer3, layer4, layer5, layer6, layer7, layer8, layer9],
};

/** Pick a deterministic image from the pool using the detection id as seed */
function pickImage(type: DefectType, id: string): string | null {
  if (type === 'none') return null;
  const pool = DEFECT_IMAGES[type];
  if (!pool?.length) return null;
  // Use sum of char codes for stable, id-based selection
  const seed = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return pool[seed % pool.length];
}

// ── Defect metadata ────────────────────────────────────────────────────────────
const DEFECT_META: Record<
  DefectType,
  { label: string; color: string; bg: string; icon: React.ElementType; description: string }
> = {
  tear: {
    label: 'Tear',
    color: '#ef4444',
    bg: 'bg-red-500/10 border-red-500/30',
    icon: Scissors,
    description: 'Longitudinal or transverse belt tears',
  },
  hole: {
    label: 'Hole',
    color: '#f97316',
    bg: 'bg-orange-500/10 border-orange-500/30',
    icon: Circle,
    description: 'Punctures and through-holes in belt surface',
  },
  edge_damage: {
    label: 'Edge Damage',
    color: '#f59e0b',
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: AlignLeft,
    description: 'Belt edge fraying, cracking or delamination',
  },
  layer_peeling: {
    label: 'Layer Peeling',
    color: '#a855f7',
    bg: 'bg-purple-500/10 border-purple-500/30',
    icon: Layers,
    description: 'Cover rubber separating from carcass layers',
  },
  none: {
    label: 'No Defect',
    color: '#22c55e',
    bg: 'bg-green-500/10 border-green-500/30',
    icon: CheckCircle2,
    description: 'Belt surface normal',
  },
};

const FILTER_TABS: Array<{ key: DefectType | 'all'; label: string; icon: React.ElementType }> = [
  { key: 'all',          label: 'All Defects',   icon: LayoutGrid },
  { key: 'tear',         label: 'Tears',         icon: Scissors   },
  { key: 'hole',         label: 'Holes',         icon: Circle     },
  { key: 'edge_damage',  label: 'Edge Damage',   icon: AlignLeft  },
  { key: 'layer_peeling',label: 'Layer Peeling', icon: Layers     },
];

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

// ── Image Lightbox ─────────────────────────────────────────────────────────────
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.85 }}
        className="relative max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-1.5 text-sm"
        >
          <X size={16} /> Close
        </button>
        <img src={src} alt={alt} className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
      </motion.div>
    </motion.div>
  );
}

// ── Video Fullscreen Lightbox ──────────────────────────────────────────────────
function VideoLightbox({
  label, angle, color, videoMode, onClose,
}: {
  label: string; angle: string; color: string;
  videoMode: 'full' | 'left' | 'right';
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ts       = useCCTVClock();

  useEffect(() => {
    videoRef.current?.play().catch(() => {});
    // close on Escape
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const cctvDate = ts.toLocaleDateString('en-GB').replace(/\//g, '-');
  const cctvTime = ts.toLocaleTimeString('en-GB', { hour12: false });

  const cropStyle: React.CSSProperties =
    videoMode === 'left'  ? { objectFit: 'cover', objectPosition: 'left center',  transform: 'scaleX(2)', transformOrigin: 'left center' } :
    videoMode === 'right' ? { objectFit: 'cover', objectPosition: 'right center', transform: 'scaleX(2)', transformOrigin: 'right center' } :
    { objectFit: 'cover' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.96)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{   scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-5xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Video container ── */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            aspectRatio: '16/9',
            background: '#000',
            boxShadow: `0 0 0 1px ${color}55, 0 32px 80px rgba(0,0,0,0.8), 0 0 60px ${color}22`,
          }}
        >
          <video
            ref={videoRef}
            src={frontViewVideo}
            muted
            loop
            playsInline
            autoPlay
            className="absolute inset-0 w-full h-full"
            style={{
              ...cropStyle,
              filter: 'grayscale(20%) contrast(1.1) brightness(0.9)',
            }}
          />

          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 6px)',
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%)' }}
          />

          {/* Corner brackets — CCTV feel */}
          {(['tl','tr','bl','br'] as const).map((corner) => (
            <div
              key={corner}
              className="absolute w-6 h-6 pointer-events-none"
              style={{
                top:    corner.startsWith('t') ? 12 : undefined,
                bottom: corner.startsWith('b') ? 12 : undefined,
                left:   corner.endsWith('l')   ? 12 : undefined,
                right:  corner.endsWith('r')   ? 12 : undefined,
                borderTop:    corner.startsWith('t') ? `2px solid ${color}` : undefined,
                borderBottom: corner.startsWith('b') ? `2px solid ${color}` : undefined,
                borderLeft:   corner.endsWith('l')   ? `2px solid ${color}` : undefined,
                borderRight:  corner.endsWith('r')   ? `2px solid ${color}` : undefined,
              }}
            />
          ))}

          {/* Top-left HUD */}
          <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
            <span className="flex items-center gap-1.5 text-xs font-bold text-white font-mono drop-shadow">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              REC
            </span>
            <span
              className="text-xs font-mono font-bold px-2 py-0.5 rounded"
              style={{ background: color + '33', color, border: `1px solid ${color}55` }}
            >
              {angle}
            </span>
            <VolumeX size={13} className="text-white/50 ml-1" />
          </div>

          {/* Top-right: label */}
          <div className="absolute top-4 right-4 pointer-events-none">
            <span className="text-xs font-mono text-white/60 uppercase tracking-widest">{label}</span>
          </div>

          {/* Bottom-left: timestamp */}
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <p className="text-[11px] font-mono text-white/60 leading-tight">{cctvDate}</p>
            <p className="text-sm font-mono font-bold text-white/90 leading-tight tabular-nums">{cctvTime}</p>
          </div>

          {/* Bottom-right: signal */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 pointer-events-none">
            <Wifi size={12} className="text-white/40" />
            <span className="text-[11px] font-mono text-white/50">LIVE · HD</span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-medium"
        >
          <X size={18} />
          Close  <span className="text-white/30 text-xs">(Esc)</span>
        </button>

        {/* Camera info bar below video */}
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-white/70 font-mono">{label} — {angle}</span>
          </div>
          <span className="text-xs text-white/40 font-mono">front_view.mp4 · loop · muted</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function VisionPage() {
  const { data: detections } = useVisionDetections();
  const [activeFilter, setActiveFilter]     = useState<DefectType | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [lightbox, setLightbox]             = useState<{ src: string; alt: string } | null>(null);
  const [videoLightbox, setVideoLightbox]   = useState<{ label: string; angle: string; color: string; videoMode: 'full' | 'left' | 'right' } | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<VisionDetection | null>(null);

  // Auto-open modal when navigated from Digital Twin with a detection id
  const location = useLocation();
  useEffect(() => {
    const state = location.state as { openDetectionId?: string } | null;
    if (state?.openDetectionId && detections) {
      const found = detections.find((d) => d.id === state.openDetectionId);
      if (found) {
        setSelectedDetection(found);
        // Clear the state so refreshing doesn't re-open
        window.history.replaceState({}, '');
      }
    }
  }, [location.state, detections]);

  const allActive = detections?.filter((d) => d.defectType !== 'none') ?? [];

  const countByType = allActive.reduce<Record<string, number>>((acc, d) => {
    acc[d.defectType] = (acc[d.defectType] ?? 0) + 1;
    return acc;
  }, {});

  const filtered = allActive
    .filter((d) => activeFilter === 'all' || d.defectType === activeFilter)
    .filter((d) => severityFilter === 'all' || d.severity === severityFilter)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Computer Vision</h1>
        <p className="text-secondary text-sm mt-1">
          AI-powered defect detection — categorized by type and severity
        </p>
      </div>

      {/* ── Category summary cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(DEFECT_META) as DefectType[])
          .filter((k) => k !== 'none')
          .map((type) => {
            const meta    = DEFECT_META[type];
            const Icon    = meta.icon;
            const count   = countByType[type] ?? 0;
            const isActive = activeFilter === type;
            // Show a sample image from the pool as the card background
            const sampleImg = DEFECT_IMAGES[type as Exclude<DefectType,'none'>][0];
            return (
              <button
                key={type}
                onClick={() => setActiveFilter(isActive ? 'all' : type)}
                className={`card text-left transition-all border-2 hover:scale-[1.02] active:scale-[0.98] overflow-hidden relative ${
                  isActive ? meta.bg : 'border-transparent'
                }`}
              >
                {/* Faint background image */}
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
                  style={{ backgroundImage: `url(${sampleImg})` }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: meta.color + '22' }}>
                      <Icon size={16} style={{ color: meta.color }} />
                    </div>
                    <span className="text-2xl font-bold font-mono" style={{ color: count > 0 ? meta.color : 'var(--text-muted)' }}>
                      {count}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary">{meta.label}</p>
                  <p className="text-xs text-muted mt-0.5 leading-tight">{meta.description}</p>
                </div>
              </button>
            );
          })}
      </div>

      {/* ── Filter tabs + severity ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          {FILTER_TABS.map(({ key, label, icon: Icon }) => {
            const count    = key === 'all' ? allActive.length : (countByType[key] ?? 0);
            const isActive = activeFilter === key;
            const color    = key !== 'all' ? DEFECT_META[key as DefectType].color : undefined;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={13} style={isActive ? undefined : { color }} />
                <span>{label}</span>
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-black/10 dark:bg-white/10 text-muted'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted">Severity:</span>
          {(['all', 'high', 'medium', 'low'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border ${
                severityFilter === s
                  ? s === 'high'   ? 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40'
                  : s === 'medium' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                  : s === 'low'    ? 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/40'
                  :                  'bg-brand-500/20 text-brand-500 border-brand-500/30'
                  : 'text-secondary border-transparent hover:text-primary bg-black/5 dark:bg-white/5'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Detection grid ─────────────────────────────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-secondary">
            {activeFilter === 'all' ? 'All Detections' : DEFECT_META[activeFilter as DefectType].label}
          </h2>
          <span className="text-xs text-muted">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            {severityFilter !== 'all' && ` · ${severityFilter} severity`}
          </span>
        </div>

        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3 opacity-60" />
              <p className="text-green-600 dark:text-green-400 font-medium">No defects in this category</p>
              <p className="text-muted text-sm mt-1">Belt surface appears normal for selected filters</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((d, i) => {
                const meta  = DEFECT_META[d.defectType];
                const Icon  = meta.icon;
                // Prefer API-provided imageUrl, fall back to local asset
                const imgSrc = d.imageUrl ?? pickImage(d.defectType, d.id);

                return (
                  <motion.div
                    key={d.id}
                    layout
                    initial={{ opacity: 0, scale: 0.93 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.93 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl border overflow-hidden cursor-pointer group/card hover:shadow-lg transition-shadow"
                    style={{ borderColor: meta.color + '33' }}
                    onClick={() => setSelectedDetection(d)}
                  >
                    {/* Image area */}
                    <div className="h-44 relative overflow-hidden group" style={{ background: meta.color + '0d' }}>
                      {imgSrc ? (
                        <>
                          <img
                            src={imgSrc}
                            alt={`${meta.label} defect`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          {/* View Details overlay on hover */}
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedDetection(d); }}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-opacity"
                            style={{ background: 'rgba(0,0,0,0.5)' }}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
                                style={{ background: meta.color, border: '1px solid rgba(255,255,255,0.25)' }}>
                                <ZoomIn size={13} />
                                View Full Details
                              </div>
                              <span className="text-[10px] text-white/60">Click to open inspection panel</span>
                            </div>
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
                          <Icon size={32} style={{ color: meta.color }} />
                          <span className="text-xs text-muted">No image</span>
                        </div>
                      )}

                      {/* Severity pill */}
                      <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shadow ${
                        d.severity === 'high'   ? 'bg-red-500 text-white'
                        : d.severity === 'medium' ? 'bg-amber-500 text-white'
                        :                           'bg-green-500 text-white'
                      }`}>
                        {d.severity}
                      </span>

                      {/* Defect type badge — bottom left */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: meta.color, color: '#fff' }}>
                        <Icon size={9} />
                        {meta.label}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-3" style={{ backgroundColor: 'var(--color-panel)' }}>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                        <div>
                          <span className="text-muted">Confidence</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                              <div className="h-full rounded-full" style={{ width: `${d.confidence * 100}%`, backgroundColor: meta.color }} />
                            </div>
                            <span className="font-mono font-semibold text-primary w-9 text-right">
                              {(d.confidence * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted">Detected</span>
                          <p className="font-semibold text-primary mt-0.5">
                            {new Date(d.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>

                      {/* ── Physical location measurement tag ── */}
                      {(() => {
                        const BELT_LEN = 100;   // metres
                        const BELT_W   = 1.2;   // metres
                        const fromLeft  = d.position.x * BELT_LEN;
                        const fromRight = BELT_LEN - fromLeft;
                        const defW      = Math.max(0.01, d.position.w * BELT_W);
                        const leftOff   = d.position.y * BELT_W;
                        const rightOff  = BELT_W - leftOff - defW;
                        return (
                          <div
                            className="mt-2.5 rounded-lg p-2.5 space-y-2"
                            style={{ background: meta.color + '0d', border: `1px solid ${meta.color}33` }}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                <path d="M1 5.5h9M5.5 1v9" stroke={meta.color} strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="5.5" cy="5.5" r="2" stroke={meta.color} strokeWidth="1.2"/>
                              </svg>
                              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: meta.color }}>
                                Exact Location
                              </span>
                            </div>

                            {/* Length axis */}
                            <div className="space-y-1">
                              <p className="text-[9px] text-muted uppercase tracking-wider">Along Belt (Length)</p>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 flex-1 px-2 py-1 rounded" style={{ background: 'var(--color-surface)' }}>
                                  <span className="text-[9px] text-muted">← From Head</span>
                                  <span className="font-mono font-bold text-xs ml-auto" style={{ color: meta.color }}>
                                    {fromLeft.toFixed(1)} m
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 flex-1 px-2 py-1 rounded" style={{ background: 'var(--color-surface)' }}>
                                  <span className="text-[9px] text-muted">From Tail →</span>
                                  <span className="font-mono font-bold text-xs ml-auto" style={{ color: meta.color }}>
                                    {fromRight.toFixed(1)} m
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Width axis */}
                            <div className="space-y-1">
                              <p className="text-[9px] text-muted uppercase tracking-wider">Across Belt (Width)</p>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 flex-1 px-2 py-1 rounded" style={{ background: 'var(--color-surface)' }}>
                                  <span className="text-[9px] text-muted">← Left edge</span>
                                  <span className="font-mono font-bold text-xs ml-auto" style={{ color: meta.color }}>
                                    {leftOff.toFixed(2)} m
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 flex-1 px-2 py-1 rounded" style={{ background: 'var(--color-surface)' }}>
                                  <span className="text-[9px] text-muted">Right edge →</span>
                                  <span className="font-mono font-bold text-xs ml-auto" style={{ color: meta.color }}>
                                    {Math.max(0, rightOff).toFixed(2)} m
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Defect size */}
                            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: 'var(--color-surface)' }}>
                              <span className="text-[9px] text-muted">Defect span</span>
                              <span className="font-mono font-bold text-xs ml-auto" style={{ color: meta.color }}>
                                {defW.toFixed(2)} m wide · {(Math.max(0.01, d.position.h * BELT_W)).toFixed(2)} m long
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
                        <span className="text-[10px] text-muted font-mono">{d.id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: meta.color + '18', color: meta.color }}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Lightbox ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
        )}
        {videoLightbox && (
          <VideoLightbox
            label={videoLightbox.label}
            angle={videoLightbox.angle}
            color={videoLightbox.color}
            videoMode={videoLightbox.videoMode}
            onClose={() => setVideoLightbox(null)}
          />
        )}
        {selectedDetection && (
          <DetectionDetailModal
            detection={selectedDetection}
            imgSrc={selectedDetection.imageUrl ?? pickImage(selectedDetection.defectType, selectedDetection.id)}
            onClose={() => setSelectedDetection(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Camera view panels ─────────────────────────────────────────────────────────
const CAMERA_VIEWS: Array<{
  label: string; sublabel: string; angle: string; color: string;
  camId: string;
  videoMode?: 'full' | 'left' | 'right';
  previewImages: string[];
}> = [
  {
    label: 'Front View',   sublabel: 'RGB · Head-on',       angle: 'CAM-01', color: '#3b82f6',
    camId: 'cam01', videoMode: 'full',
    previewImages: [tear1, tear2, tear3],
  },
  {
    label: 'Side Left',    sublabel: 'RGB · Left Crop',     angle: 'CAM-02', color: '#27a372',
    camId: 'cam02', videoMode: 'left',
    previewImages: [edge1, edge2, edge3],
  },
  {
    label: 'Side Right',   sublabel: 'RGB · Right Crop',    angle: 'CAM-03', color: '#f59e0b',
    camId: 'cam03', videoMode: 'right',
    previewImages: [hole1, hole2, hole3],
  },
  {
    label: 'Bottom View',  sublabel: 'Thermal · Underside', angle: 'CAM-04', color: '#ef4444',
    camId: 'cam04',
    previewImages: [layer1, layer2, layer3],
  },
];

// ── CCTV timestamp hook ────────────────────────────────────────────────────────
function useCCTVClock() {
  const [ts, setTs] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setTs(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return ts;
}

// ── CameraViewPanel ────────────────────────────────────────────────────────────
function CameraViewPanel({
  label, sublabel, angle, color, camId, videoMode, previewImages, onZoom, onVideoExpand,
}: {
  label: string; sublabel: string; angle: string; color: string;
  camId: string; videoMode?: 'full' | 'left' | 'right';
  previewImages: string[];
  onZoom: (lb: { src: string; alt: string }) => void;
  onVideoExpand: (v: { label: string; angle: string; color: string; videoMode: 'full' | 'left' | 'right' }) => void;
}) {
  const [active, setActive]     = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);
  const videoRef                = useRef<HTMLVideoElement>(null);
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null);
  const ts                      = useCCTVClock();

  const hasVideo = !!videoMode;

  const handleActivate = () => {
    if (!active) {
      setActive(true);
      if (!hasVideo) {
        intervalRef.current = setInterval(() => {
          setFrameIdx((i) => (i + 1) % previewImages.length);
        }, 1800);
      }
    } else {
      setActive(false);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      setFrameIdx(0);
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
    }
  };

  useEffect(() => {
    if (active && hasVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, hasVideo]);

  // Seek to 1s on load so the preview frame isn't black
  const handleVideoMetadata = () => {
    if (videoRef.current && !active) {
      videoRef.current.currentTime = 1;
    }
  };

  const cctvDate = ts.toLocaleDateString('en-GB').replace(/\//g, '-');
  const cctvTime = ts.toLocaleTimeString('en-GB', { hour12: false });

  // Crop style for left/right split
  const cropStyle: React.CSSProperties =
    videoMode === 'left'  ? { objectFit: 'cover', objectPosition: 'left center',  transform: 'scaleX(2)', transformOrigin: 'left center' } :
    videoMode === 'right' ? { objectFit: 'cover', objectPosition: 'right center', transform: 'scaleX(2)', transformOrigin: 'right center' } :
    { objectFit: 'cover' };

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        border: `1px solid ${active ? color + '88' : 'var(--color-border)'}`,
        boxShadow: active ? `0 0 0 1px ${color}33, 0 4px 20px ${color}22` : undefined,
      }}
    >
      {/* ── Feed area ── */}
      <div
        className="relative overflow-hidden cursor-pointer group"
        style={{ height: 160, backgroundColor: '#000' }}
        onClick={handleActivate}
      >
        {/* Video — always rendered so the first frame shows as preview */}
        {hasVideo && (
          <video
            ref={videoRef}
            src={frontViewVideo}
            muted
            loop
            playsInline
            preload="metadata"
            onLoadedMetadata={handleVideoMetadata}
            className="absolute inset-0 w-full h-full transition-all duration-500"
            style={{
              ...cropStyle,
              opacity: active ? 1 : 0.55,
              filter: active
                ? 'grayscale(25%) contrast(1.08) brightness(0.92)'
                : 'grayscale(60%) brightness(0.6)',
            }}
          />
        )}

        {/* Image fallback for non-video cameras */}
        {!hasVideo && (
          <motion.img
            key={active ? frameIdx : 'preview'}
            src={previewImages[active ? frameIdx : 0]}
            alt={label}
            initial={{ opacity: 0 }}
            animate={{ opacity: active ? 1 : 0.45 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: active
                ? 'grayscale(20%) contrast(1.1) brightness(0.9)'
                : 'grayscale(70%) brightness(0.55)',
            }}
          />
        )}

        {/* Inactive overlay — play button + label */}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
            {/* Play button circle */}
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)', border: '1.5px solid rgba(255,255,255,0.35)' }}
            >
              {/* Triangle play icon */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <polygon points="5,3 15,9 5,15" fill="white" opacity="0.9" />
              </svg>
            </div>
            <span
              className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
            >
              {sublabel}
            </span>
          </div>
        )}

        {/* ── CCTV overlay (only when active) ── */}
        {active && (
          <>
            {/* Scanline effect */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)',
              }}
            />

            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)' }}
            />

            {/* Top-left: cam ID + REC */}
            <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
              <span className="flex items-center gap-1 text-[10px] font-bold text-white/90 font-mono drop-shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                REC
              </span>
              <span className="text-[10px] font-mono text-white/70">{angle}</span>
            </div>

            {/* Top-right: mute icon */}
            <div className="absolute top-2 right-2 pointer-events-none">
              <VolumeX size={11} className="text-white/60" />
            </div>

            {/* Bottom-left: timestamp */}
            <div className="absolute bottom-2 left-2 pointer-events-none">
              <p className="text-[9px] font-mono text-white/75 leading-tight drop-shadow">{cctvDate}</p>
              <p className="text-[10px] font-mono font-bold text-white/90 leading-tight drop-shadow">{cctvTime}</p>
            </div>

            {/* Bottom-right: signal + label */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1 pointer-events-none">
              <Wifi size={9} className="text-white/50" />
              <span className="text-[9px] font-mono text-white/60">{label.toUpperCase()}</span>
            </div>

            {/* Expand button — video cameras only */}
            {hasVideo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVideoExpand({ label, angle, color, videoMode: videoMode! });
                }}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
              >
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[11px] font-semibold"
                  style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.25)' }}
                >
                  <ZoomIn size={13} />
                  Full Screen
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Controls bar ── */}
      <div
        className="px-3 py-2 flex items-center justify-between border-t"
        style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
      >
        <div>
          <p className="text-xs font-semibold text-primary">{label}</p>
          <p className="text-[10px] text-muted">{hasVideo ? 'MP4 · Muted' : 'WebRTC / RTSP'}</p>
        </div>
        <button
          onClick={handleActivate}
          className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
          style={{
            background: active ? color + '22' : 'var(--color-surface)',
            color: active ? color : 'var(--text-secondary)',
            border: `1px solid ${active ? color + '44' : 'var(--color-border)'}`,
          }}
        >
          {active ? 'Disconnect' : 'View'}
        </button>
      </div>
    </div>
  );
}
