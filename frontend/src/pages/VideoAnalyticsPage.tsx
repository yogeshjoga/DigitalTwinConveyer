import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Video, Filter, Clock, AlertTriangle, Scissors, Circle,
  AlignLeft, Layers, ChevronDown, Play, Pause, SkipBack, X,
  BarChart3, Calendar, Camera, VolumeX, Wifi, ZoomIn,
} from "lucide-react";
import type { DefectType } from "@/types";
import { type VideoEvent, VIDEO_EVENTS, DEFECT_COLORS, DEFECT_LABELS } from "@/data/videoAnalytics";
import { BELT_CATALOG } from "@/data/beltCatalog";
import frontViewVideo from "@/assets/front_view.mp4";
import tear1 from "@/assets/tears/tear_1.png";
import tear2 from "@/assets/tears/tear_2.png";
import tear3 from "@/assets/tears/tear_3.png";
import edge1 from "@/assets/edge_damage/edge_1.png";
import edge2 from "@/assets/edge_damage/edge_2.png";
import edge3 from "@/assets/edge_damage/edge_3.png";
import hole1 from "@/assets/holes/hole_1.png";
import hole2 from "@/assets/holes/hole_2.png";
import hole3 from "@/assets/holes/hole_3.png";
import layer1 from "@/assets/layer_peeling/layer_1.png";
import layer2 from "@/assets/layer_peeling/layer_2.png";
import layer3 from "@/assets/layer_peeling/layer_3.png";

function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" }); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function yesterdayStr() { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); }

const SEV_COLORS: Record<string, string> = { low: "#27a372", medium: "#f59e0b", high: "#ef4444" };

const DEFECT_ICONS: Record<DefectType, React.ReactNode> = {
  tear: <Scissors size={11} />, hole: <Circle size={11} />,
  edge_damage: <AlignLeft size={11} />, layer_peeling: <Layers size={11} />, none: <Circle size={11} />,
};

function parseAndSearch(query: string): VideoEvent[] {
  const q = query.toLowerCase();
  const beltKeywords: Record<string, string[]> = {
    "COAL-CHP-01":     ["coal belt 1","coal belt"],
    "COAL-CHP-02":     ["coal belt 2"],
    "RM-IRONORE-01":   ["iron ore belt 1","iron ore belt","iron ore","ironore"],
    "RM-IRONORE-02":   ["iron ore belt 2"],
    "SINTER-DISCH-01": ["sinter discharge","sinter belt","sinter"],
    "BF-BURDEN-01":    ["burden belt","burden"],
  };
  let beltIds: string[] = [];
  for (const [id, keywords] of Object.entries(beltKeywords)) {
    if (keywords.some((kw) => q.includes(kw))) beltIds.push(id);
  }
  if (beltIds.length === 0) {
    const matMap: [string, string][] = [["coal","coal"],["iron","iron"],["sinter","sinter"],["burden","burden"],["coke","coke"],["pellet","pellet"],["slag","slag"],["limestone","limestone"]];
    for (const [kw, mat] of matMap) {
      if (q.includes(kw)) beltIds = [...beltIds, ...BELT_CATALOG.filter((b) => b.material.toLowerCase().includes(mat)).map((b) => b.id)];
    }
  }
  let targetDate: string | null = null;
  if (q.includes("yesterday")) targetDate = yesterdayStr();
  else if (q.includes("today")) targetDate = todayStr();
  let targetHour: number | null = null;
  const hourMatch = q.match(/(\d{1,2})\s*(?:pm|am)/);
  if (hourMatch) { let h = parseInt(hourMatch[1], 10); if (q.includes("pm") && h < 12) h += 12; if (q.includes("am") && h === 12) h = 0; targetHour = h; }
  const time24 = q.match(/(\d{1,2}):(\d{2})/);
  if (time24) targetHour = parseInt(time24[1], 10);
  if (q.includes("last hour")) { targetDate = todayStr(); targetHour = new Date().getHours(); }
  const defectMap: Record<string, DefectType> = { tear:"tear",tears:"tear",hole:"hole",holes:"hole","edge damage":"edge_damage",edge:"edge_damage","layer peeling":"layer_peeling",peeling:"layer_peeling" };
  let targetDefect: DefectType | null = null;
  for (const [kw, dt] of Object.entries(defectMap)) { if (q.includes(kw)) { targetDefect = dt; break; } }
  let targetSeverity: "low"|"medium"|"high"|null = null;
  if (q.includes("critical")||q.includes("high severity")||q.includes("high")) targetSeverity = "high";
  else if (q.includes("warning")||q.includes("medium")) targetSeverity = "medium";
  else if (q.includes("low")) targetSeverity = "low";
  let results = VIDEO_EVENTS.filter((ev) => {
    if (beltIds.length > 0 && !beltIds.includes(ev.beltId)) return false;
    if (targetDate && ev.timestamp.slice(0,10) !== targetDate) return false;
    if (targetHour !== null && Math.abs(new Date(ev.timestamp).getHours() - targetHour) > 1) return false;
    if (targetDefect && ev.defectType !== targetDefect) return false;
    if (targetSeverity && ev.severity !== targetSeverity) return false;
    return true;
  });
  if (results.length === 0 && q.trim().length > 0) {
    const words = q.split(/\s+/).filter((w) => w.length > 3);
    results = VIDEO_EVENTS.filter((ev) => words.some((w) => ev.beltName.toLowerCase().includes(w)||ev.material.toLowerCase().includes(w)||ev.defectType.includes(w)));
  }
  return results.sort((a,b) => new Date(b.timestamp).getTime()-new Date(a.timestamp).getTime());
}

// ── Defect image pools (same as VisionPage) ───────────────────────────────────
const DEFECT_IMAGE_POOLS: Partial<Record<DefectType, string[]>> = {
  tear:          [tear1, tear2, tear3],
  hole:          [hole1, hole2, hole3],
  edge_damage:   [edge1, edge2, edge3],
  layer_peeling: [layer1, layer2, layer3],
};

function pickDefectImage(type: DefectType, id: string): string | null {
  const pool = DEFECT_IMAGE_POOLS[type];
  if (!pool) return null;
  const seed = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return pool[seed % pool.length];
}

function FrameCard({ event, selected, onClick }: { event: VideoEvent; selected: boolean; onClick: () => void }) {
  const color    = DEFECT_COLORS[event.defectType];
  const sevColor = SEV_COLORS[event.severity];
  const imgSrc   = pickDefectImage(event.defectType, event.id);

  const FRAME_W = 1280, FRAME_H = 720;
  const [bx, by, bw, bh] = event.bbox;
  const left   = `${(bx / FRAME_W) * 100}%`;
  const top    = `${(by / FRAME_H) * 100}%`;
  const width  = `${(bw / FRAME_W) * 100}%`;
  const height = `${(bh / FRAME_H) * 100}%`;

  const BELT_LEN = 100, BELT_W = 1.2;
  const fromLeft = (event.beltPosition / 100) * BELT_LEN;
  const yNorm    = event.bbox[1] / 720;
  const wNorm    = event.bbox[3] / 720;
  const leftOff  = Math.min(yNorm * BELT_W, BELT_W);
  const defW     = Math.max(0.01, wNorm * BELT_W);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="rounded-xl overflow-hidden cursor-pointer group"
      style={{
        backgroundColor: 'var(--color-panel)',
        border: selected ? `2px solid ${color}` : '1px solid var(--color-border)',
        boxShadow: selected ? `0 0 0 3px ${color}22` : undefined,
      }}
    >
      {/* ── Image frame ── */}
      <div className="relative overflow-hidden" style={{ height: 120 }}>
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={DEFECT_LABELS[event.defectType]}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ filter: 'brightness(0.88) contrast(1.05)' }}
          />
        ) : (
          <div className="w-full h-full" style={{ background: color + '18' }} />
        )}

        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 6px)' }} />

        {/* Bbox */}
        <div className="absolute z-10 pointer-events-none"
          style={{ left, top, width, height, border: `1.5px solid ${color}`, boxShadow: `0 0 4px ${color}88` }}>
          <span className="absolute -top-4 left-0 text-[8px] font-bold px-1 py-0.5 whitespace-nowrap"
            style={{ background: color, color: '#fff', borderRadius: 2 }}>
            {DEFECT_LABELS[event.defectType]}
          </span>
        </div>

        {/* Severity pill — top right */}
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase z-10"
          style={{ background: sevColor, color: '#fff' }}>
          {event.severity}
        </span>

        {/* Frame + time — bottom */}
        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between z-10 pointer-events-none">
          <span className="text-[8px] font-mono text-white/60">#{event.frameNumber}</span>
          <span className="text-[8px] font-mono text-white/60">{fmtTime(event.timestamp)}</span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
            style={{ background: color }}>
            <Play size={10} fill="white" />Play
          </span>
        </div>
      </div>

      {/* ── Info row ── */}
      <div className="px-3 py-2 space-y-1">
        {/* Belt + date */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-primary truncate">{event.beltName}</span>
          <span className="text-[10px] text-muted flex-shrink-0">{fmtDate(event.timestamp)}</span>
        </div>

        {/* Confidence + material */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
            <div className="h-full rounded-full" style={{ width: `${event.confidence * 100}%`, backgroundColor: color }} />
          </div>
          <span className="text-[10px] font-mono font-semibold flex-shrink-0" style={{ color }}>
            {Math.round(event.confidence * 100)}%
          </span>
          <span className="text-[10px] text-muted flex-shrink-0">{event.camera}</span>
        </div>

        {/* Location pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold"
            style={{ background: color + '15', color }}>
            {fromLeft.toFixed(1)} m
          </span>
          <span className="text-[9px] text-muted">from head ·</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold"
            style={{ background: color + '15', color }}>
            {leftOff.toFixed(2)} m
          </span>
          <span className="text-[9px] text-muted">left edge ·</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold"
            style={{ background: color + '15', color }}>
            {defW.toFixed(2)} m
          </span>
          <span className="text-[9px] text-muted">wide</span>
        </div>
      </div>
    </motion.div>
  );
}

function VideoPlayerPanel({ event, videoRef, videoPlaying, setVideoPlaying, onClose }: { event: VideoEvent; videoRef: React.RefObject<HTMLVideoElement>; videoPlaying: boolean; setVideoPlaying: (v:boolean)=>void; onClose: ()=>void }) {
  const color = DEFECT_COLORS[event.defectType];
  const sevColor = SEV_COLORS[event.severity];
  const togglePlay = () => { if (!videoRef.current) return; if (videoPlaying) { videoRef.current.pause(); setVideoPlaying(false); } else { videoRef.current.play(); setVideoPlaying(true); } };
  const restart = () => { if (!videoRef.current) return; videoRef.current.currentTime = event.videoTimestamp; videoRef.current.play(); setVideoPlaying(true); };
  return (
    <motion.div initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:20 }}
      className="sticky top-4 rounded-2xl overflow-hidden"
      style={{ backgroundColor:"var(--color-panel)", border:`1px solid ${color}55`, boxShadow:`0 0 24px ${color}22` }}>
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom:"1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2">
          <Video size={15} style={{ color }}/>
          <span className="text-sm font-bold text-primary">Live Playback</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background:color+"22",color }}>{event.camera}</span>
        </div>
        <button onClick={onClose} className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"><X size={13}/>Close</button>
      </div>
      <div className="relative bg-black" style={{ aspectRatio:"16/9" }}>
        <video ref={videoRef} src={frontViewVideo} className="w-full h-full object-cover" loop muted playsInline/>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)" }}/>
        <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.55) 100%)" }}/>
        <div className="absolute top-2.5 left-3 flex items-center gap-1.5 z-10">
          <motion.div animate={{ opacity:[1,0.2,1] }} transition={{ duration:1.2,repeat:Infinity }} className="w-2 h-2 rounded-full bg-red-500"/>
          <span className="text-[10px] font-bold text-white/80 tracking-widest">REC</span>
        </div>
        <div className="absolute top-2.5 right-3 z-10"><span className="text-[10px] font-mono text-white/60">{event.camera}</span></div>
        <div className="absolute bottom-2.5 left-3 z-10"><span className="text-[10px] font-mono text-white/60">{new Date(event.timestamp).toLocaleString()}</span></div>
        <div className="absolute bottom-2.5 right-3 z-10"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background:color+"cc",color:"#fff" }}>{DEFECT_LABELS[event.defectType]}</span></div>
      </div>
      <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom:"1px solid var(--color-border)" }}>
        <button onClick={restart} className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 text-muted hover:text-primary" title="Jump to event timestamp"><SkipBack size={15}/></button>
        <button onClick={togglePlay} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background:`linear-gradient(135deg,${color},${color}bb)` }}>
          {videoPlaying?<Pause size={13} fill="white"/>:<Play size={13} fill="white"/>}{videoPlaying?"Pause":"Play"}
        </button>
        <span className="text-[10px] font-mono text-muted ml-auto">t={event.videoTimestamp.toFixed(2)}s</span>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-xs font-bold text-muted uppercase tracking-wide">Event Details</p>
        <div className="grid grid-cols-2 gap-2">
          {[{label:"Belt",value:event.beltName},{label:"Material",value:event.material},{label:"Defect",value:DEFECT_LABELS[event.defectType]},{label:"Severity",value:event.severity,color:sevColor},{label:"Confidence",value:`${Math.round(event.confidence*100)}%`},{label:"Frame",value:`#${event.frameNumber}`},{label:"Belt Pos",value:`${event.beltPosition}%`},{label:"Camera",value:event.camera}].map(({label,value,color:c})=>(
            <div key={label} className="rounded-lg px-2.5 py-2" style={{ backgroundColor:"var(--color-surface)" }}>
              <p className="text-[10px] text-muted mb-0.5">{label}</p>
              <p className="text-xs font-semibold" style={{ color:c??"var(--text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor:"var(--color-surface)" }}>
          <p className="text-[10px] text-muted mb-0.5">Bounding Box</p>
          <p className="text-[10px] font-mono text-secondary">x={event.bbox[0]} y={event.bbox[1]} w={event.bbox[2]} h={event.bbox[3]}</p>
        </div>
        <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor:"var(--color-surface)" }}>
          <p className="text-[10px] text-muted mb-0.5">Captured At</p>
          <p className="text-xs font-mono text-secondary">{new Date(event.timestamp).toLocaleString()}</p>
        </div>

        {/* ── Physical location measurement ── */}
        {(() => {
          const BELT_LEN = 100;
          const BELT_W   = 1.2;
          const fromLeft  = (event.beltPosition / 100) * BELT_LEN;
          const fromRight = BELT_LEN - fromLeft;
          const yNorm     = event.bbox[1] / 720;
          const wNorm     = event.bbox[3] / 720;
          const leftOff   = Math.min(yNorm * BELT_W, BELT_W);
          const defW      = Math.max(0.01, wNorm * BELT_W);
          const rightOff  = Math.max(0, BELT_W - leftOff - defW);
          return (
            <div className="rounded-xl p-3 space-y-2" style={{ background: color + "0d", border: `1px solid ${color}44` }}>
              <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle cx="6" cy="6" r="5" stroke={color} strokeWidth="1.2"/>
                  <path d="M6 3v3l2 1" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
                Exact Physical Location
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor:"var(--color-surface)" }}>
                  <p className="text-[9px] text-muted">← From Head End</p>
                  <p className="text-sm font-mono font-bold" style={{ color }}>{fromLeft.toFixed(1)} m</p>
                </div>
                <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor:"var(--color-surface)" }}>
                  <p className="text-[9px] text-muted">From Tail End →</p>
                  <p className="text-sm font-mono font-bold" style={{ color }}>{fromRight.toFixed(1)} m</p>
                </div>
                <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor:"var(--color-surface)" }}>
                  <p className="text-[9px] text-muted">← Left Edge</p>
                  <p className="text-sm font-mono font-bold" style={{ color }}>{leftOff.toFixed(2)} m</p>
                </div>
                <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor:"var(--color-surface)" }}>
                  <p className="text-[9px] text-muted">Right Edge →</p>
                  <p className="text-sm font-mono font-bold" style={{ color }}>{rightOff.toFixed(2)} m</p>
                </div>
              </div>
              <div className="rounded-lg px-2.5 py-2" style={{ backgroundColor:"var(--color-surface)" }}>
                <p className="text-[9px] text-muted mb-0.5">Defect Span</p>
                <p className="text-xs font-mono font-bold" style={{ color }}>{defW.toFixed(2)} m wide · {(Math.max(0.01, event.bbox[2] / 1280 * BELT_LEN * 0.05)).toFixed(2)} m along belt</p>
              </div>
              <p className="text-[9px] text-muted text-center pt-0.5">
                Walk to <span className="font-bold" style={{ color }}>{fromLeft.toFixed(1)} m</span> from head pulley, <span className="font-bold" style={{ color }}>{leftOff.toFixed(2)} m</span> from left edge
              </p>
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
}

// ── CCTV clock ────────────────────────────────────────────────────────────────
function useCCTVClock() {
  const [ts, setTs] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setTs(new Date()), 1000); return () => clearInterval(id); }, []);
  return ts;
}

// ── Camera view data ──────────────────────────────────────────────────────────
const CAMERA_VIEWS: Array<{ label: string; sublabel: string; angle: string; color: string; camId: string; videoMode?: "full"|"left"|"right"; previewImages: string[] }> = [
  { label:"Front View",  sublabel:"RGB · Head-on",       angle:"CAM-01", color:"#3b82f6", camId:"cam01", videoMode:"full",  previewImages:[tear1,tear2,tear3] },
  { label:"Side Left",   sublabel:"RGB · Left Crop",     angle:"CAM-02", color:"#27a372", camId:"cam02", videoMode:"left",  previewImages:[edge1,edge2,edge3] },
  { label:"Side Right",  sublabel:"RGB · Right Crop",    angle:"CAM-03", color:"#f59e0b", camId:"cam03", videoMode:"right", previewImages:[hole1,hole2,hole3] },
  { label:"Bottom View", sublabel:"Thermal · Underside", angle:"CAM-04", color:"#ef4444", camId:"cam04",                    previewImages:[layer1,layer2,layer3] },
];

// ── VideoLightboxModal ────────────────────────────────────────────────────────
function VideoLightboxModal({ label, angle, color, videoMode, onClose }: { label:string; angle:string; color:string; videoMode:"full"|"left"|"right"; onClose:()=>void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ts = useCCTVClock();
  useEffect(() => {
    videoRef.current?.play().catch(()=>{});
    const h = (e: KeyboardEvent) => { if (e.key==="Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  const cropStyle: React.CSSProperties =
    videoMode==="left"  ? { objectFit:"cover", objectPosition:"left center",  transform:"scaleX(2)", transformOrigin:"left center" } :
    videoMode==="right" ? { objectFit:"cover", objectPosition:"right center", transform:"scaleX(2)", transformOrigin:"right center" } :
    { objectFit:"cover" };
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background:"rgba(0,0,0,0.96)", backdropFilter:"blur(8px)" }} onClick={onClose}>
      <motion.div initial={{ scale:0.92,opacity:0 }} animate={{ scale:1,opacity:1 }} exit={{ scale:0.92,opacity:0 }}
        transition={{ type:"spring", stiffness:320, damping:28 }}
        className="relative w-full max-w-5xl mx-4" onClick={(e)=>e.stopPropagation()}>
        <div className="relative rounded-2xl overflow-hidden" style={{ aspectRatio:"16/9", background:"#000", boxShadow:`0 0 0 1px ${color}55,0 32px 80px rgba(0,0,0,0.8)` }}>
          <video ref={videoRef} src={frontViewVideo} muted loop playsInline autoPlay className="absolute inset-0 w-full h-full" style={{ ...cropStyle, filter:"grayscale(20%) contrast(1.1) brightness(0.9)" }}/>
          <div className="absolute inset-0 pointer-events-none" style={{ background:"repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 6px)" }}/>
          <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.65) 100%)" }}/>
          <div className="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
            <motion.div animate={{ opacity:[1,0.2,1] }} transition={{ duration:1.2,repeat:Infinity }} className="w-2 h-2 rounded-full bg-red-500"/>
            <span className="text-[10px] font-bold text-white/80 tracking-widest">REC</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded" style={{ background:color+"33",color,border:`1px solid ${color}55` }}>{angle}</span>
            <VolumeX size={13} className="text-white/50 ml-1"/>
          </div>
          <div className="absolute top-4 right-4 pointer-events-none"><span className="text-xs font-mono text-white/60 uppercase tracking-widest">{label}</span></div>
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <p className="text-[11px] font-mono text-white/60">{ts.toLocaleDateString("en-GB").replace(/\//g,"-")}</p>
            <p className="text-sm font-mono font-bold text-white/90 tabular-nums">{ts.toLocaleTimeString("en-GB",{hour12:false})}</p>
          </div>
          <div className="absolute bottom-4 right-4 flex items-center gap-1.5 pointer-events-none">
            <Wifi size={12} className="text-white/40"/><span className="text-[11px] font-mono text-white/50">LIVE · HD</span>
          </div>
        </div>
        <button onClick={onClose} className="absolute -top-12 right-0 flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium">
          <X size={18}/>Close <span className="text-white/30 text-xs">(Esc)</span>
        </button>
        <div className="mt-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"/><span className="text-xs text-white/70 font-mono">{label} — {angle}</span></div>
          <span className="text-xs text-white/40 font-mono">front_view.mp4 · loop · muted</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── CameraViewPanel ───────────────────────────────────────────────────────────
function CameraViewPanel({ label, sublabel, angle, color, camId, videoMode, previewImages, onZoom, onVideoExpand }: {
  label:string; sublabel:string; angle:string; color:string; camId:string; videoMode?:"full"|"left"|"right";
  previewImages:string[]; onZoom:(lb:{src:string;alt:string})=>void;
  onVideoExpand:(v:{label:string;angle:string;color:string;videoMode:"full"|"left"|"right"})=>void;
}) {
  const hasVideo = !!videoMode;
  // Auto-start: video cameras begin active, image cameras begin cycling
  const [active, setActive]     = useState(true);
  const [frameIdx, setFrameIdx] = useState(0);
  const videoRef                = useRef<HTMLVideoElement>(null);
  const intervalRef             = useRef<ReturnType<typeof setInterval>|null>(null);
  const ts                      = useCCTVClock();

  // Auto-play on mount
  useEffect(() => {
    if (hasVideo) {
      videoRef.current?.play().catch(() => {});
    } else {
      intervalRef.current = setInterval(() => setFrameIdx((i) => (i + 1) % previewImages.length), 1800);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleActivate = () => {
    if (!active) {
      setActive(true);
      if (hasVideo) { videoRef.current?.play().catch(() => {}); }
      else { intervalRef.current = setInterval(()=>setFrameIdx((i)=>(i+1)%previewImages.length),1800); }
    } else {
      setActive(false);
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current=null; }
      setFrameIdx(0);
      if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime=0; }
    }
  };

  const handleVideoMetadata = () => { if (videoRef.current && !active) videoRef.current.currentTime = 1; };

  const cropStyle: React.CSSProperties =
    videoMode==="left"  ? { objectFit:"cover", objectPosition:"left center",  transform:"scaleX(2)", transformOrigin:"left center" } :
    videoMode==="right" ? { objectFit:"cover", objectPosition:"right center", transform:"scaleX(2)", transformOrigin:"right center" } :
    { objectFit:"cover" };

  const cctvDate = ts.toLocaleDateString("en-GB").replace(/\//g,"-");
  const cctvTime = ts.toLocaleTimeString("en-GB",{hour12:false});

  return (
    <div className="rounded-xl overflow-hidden transition-all" style={{ border:`1px solid ${active?color+"88":"var(--color-border)"}`, boxShadow:active?`0 0 0 1px ${color}33,0 4px 20px ${color}22`:undefined }}>
      <div className="relative overflow-hidden cursor-pointer group" style={{ height:160, backgroundColor:"#000" }} onClick={handleActivate}>
        {hasVideo && (
          <video ref={videoRef} src={frontViewVideo} muted loop playsInline preload="auto" onLoadedMetadata={handleVideoMetadata}
            className="absolute inset-0 w-full h-full transition-all duration-500"
            style={{ ...cropStyle, opacity:1, filter:"grayscale(25%) contrast(1.08) brightness(0.92)" }}/>
        )}
        {!hasVideo && (
          <motion.img key={active?frameIdx:"preview"} src={previewImages[active?frameIdx:0]} alt={label}
            initial={{ opacity:0 }} animate={{ opacity:active?1:0.45 }} transition={{ duration:0.4 }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter:active?"grayscale(20%) contrast(1.1) brightness(0.9)":"grayscale(70%) brightness(0.55)" }}/>
        )}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg" style={{ background:"rgba(255,255,255,0.18)", backdropFilter:"blur(6px)", border:"1.5px solid rgba(255,255,255,0.35)" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><polygon points="5,3 15,9 5,15" fill="white" opacity="0.9"/></svg>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background:"rgba(0,0,0,0.45)", color:"rgba(255,255,255,0.85)", backdropFilter:"blur(4px)" }}>{sublabel}</span>
          </div>
        )}
        {active && (
          <>
            <div className="absolute inset-0 pointer-events-none" style={{ background:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)" }}/>
            <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.55) 100%)" }}/>
            <div className="absolute top-2 left-2 flex items-center gap-1.5 pointer-events-none">
              <span className="flex items-center gap-1 text-[10px] font-bold text-white/90 font-mono drop-shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>REC
              </span>
              <span className="text-[10px] font-mono text-white/70">{angle}</span>
            </div>
            <div className="absolute top-2 right-2 pointer-events-none"><VolumeX size={11} className="text-white/60"/></div>
            <div className="absolute bottom-2 left-2 pointer-events-none">
              <p className="text-[9px] font-mono text-white/75 leading-tight drop-shadow">{cctvDate}</p>
              <p className="text-[10px] font-mono font-bold text-white/90 leading-tight drop-shadow">{cctvTime}</p>
            </div>
            <div className="absolute bottom-2 right-2 flex items-center gap-1 pointer-events-none">
              <Wifi size={9} className="text-white/50"/><span className="text-[9px] font-mono text-white/60">{label.toUpperCase()}</span>
            </div>
            {hasVideo && (
              <button onClick={(e)=>{ e.stopPropagation(); onVideoExpand({label,angle,color,videoMode:videoMode!}); }}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-[11px] font-semibold"
                  style={{ background:"rgba(255,255,255,0.12)", backdropFilter:"blur(4px)", border:"1px solid rgba(255,255,255,0.25)" }}>
                  <ZoomIn size={13}/>Full Screen
                </div>
              </button>
            )}
          </>
        )}
      </div>
      <div className="px-3 py-2 flex items-center justify-between border-t" style={{ backgroundColor:"var(--color-panel)", borderColor:"var(--color-border)" }}>
        <div>
          <p className="text-xs font-semibold text-primary">{label}</p>
          <p className="text-[10px] text-muted">{hasVideo?"MP4 · Muted":"WebRTC / RTSP"}</p>
        </div>
        <button onClick={handleActivate} className="text-xs px-2.5 py-1 rounded-lg font-medium transition-all"
          style={{ background:active?color+"22":"var(--color-surface)", color:active?color:"var(--text-secondary)", border:`1px solid ${active?color+"44":"var(--color-border)"}` }}>
          {active?"Disconnect":"View"}
        </button>
      </div>
    </div>
  );
}

// ── Fullscreen Playback Modal ─────────────────────────────────────────────────
function PlaybackModal({ event, videoRef, videoPlaying, setVideoPlaying, onClose }: {
  event: VideoEvent;
  videoRef: React.RefObject<HTMLVideoElement>;
  videoPlaying: boolean;
  setVideoPlaying: (v: boolean) => void;
  onClose: () => void;
}) {
  const color    = DEFECT_COLORS[event.defectType];
  const sevColor = SEV_COLORS[event.severity];

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoPlaying) { videoRef.current.pause(); setVideoPlaying(false); }
    else              { videoRef.current.play();  setVideoPlaying(true);  }
  };

  const restart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = event.videoTimestamp;
    videoRef.current.play();
    setVideoPlaying(true);
  };

  const BELT_LEN = 100, BELT_W = 1.2;
  const fromLeft  = (event.beltPosition / 100) * BELT_LEN;
  const fromRight = BELT_LEN - fromLeft;
  const yNorm     = event.bbox[1] / 720;
  const wNorm     = event.bbox[3] / 720;
  const leftOff   = Math.min(yNorm * BELT_W, BELT_W);
  const defW      = Math.max(0.01, wNorm * BELT_W);
  const rightOff  = Math.max(0, BELT_W - leftOff - defW);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      {/* ── Floating window ── */}
      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 16 }}
        animate={{ scale: 1,    opacity: 1, y: 0  }}
        exit={{   scale: 0.93, opacity: 0, y: 16  }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        className="relative flex flex-col rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '90vh',
          backgroundColor: 'var(--color-panel)',
          border: `1px solid ${color}44`,
          boxShadow: `0 0 0 1px ${color}22, 0 32px 80px rgba(0,0,0,0.5)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 h-11 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
            <span className="text-sm font-bold text-primary truncate">{event.beltName}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold flex-shrink-0"
              style={{ background: color + '18', color, border: `1px solid ${color}33` }}>
              {event.camera}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase flex-shrink-0"
              style={{ background: sevColor + '18', color: sevColor }}>
              {event.severity}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase flex-shrink-0"
              style={{ background: color + '18', color }}>
              {DEFECT_LABELS[event.defectType]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-muted hover:text-primary text-xs font-medium transition-colors px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0"
          >
            <X size={13} /> Close
          </button>
        </div>

        {/* ── Video — sticky, never scrolls ── */}
        <div className="relative bg-black flex-shrink-0" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            src={frontViewVideo}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'grayscale(15%) contrast(1.08) brightness(0.88)' }}
            loop muted playsInline
          />
          {/* Scanlines */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.05) 3px,rgba(0,0,0,0.05) 6px)' }} />
          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.5) 100%)' }} />
          {/* REC */}
          <div className="absolute top-2.5 left-3 flex items-center gap-1.5 pointer-events-none">
            <motion.div animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-white/80 tracking-widest font-mono">REC</span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
              style={{ background: color + '33', color, border: `1px solid ${color}44` }}>
              {event.camera}
            </span>
          </div>
          {/* Defect badge */}
          <div className="absolute top-2.5 right-3 pointer-events-none">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
              style={{ background: color, color: '#fff' }}>
              {DEFECT_LABELS[event.defectType]}
            </span>
          </div>
          {/* Timestamp */}
          <div className="absolute bottom-2.5 left-3 pointer-events-none">
            <p className="text-[10px] font-mono text-white/55">{new Date(event.timestamp).toLocaleString()}</p>
          </div>
          <div className="absolute bottom-2.5 right-3 pointer-events-none">
            <span className="text-[10px] font-mono text-white/35">t={event.videoTimestamp.toFixed(2)}s · #{event.frameNumber}</span>
          </div>
        </div>

        {/* ── Controls ── */}
        <div
          className="flex items-center gap-3 px-4 h-11 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          <button onClick={restart} className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <SkipBack size={14} />
          </button>
          <button onClick={togglePlay}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
            {videoPlaying ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" />}
            {videoPlaying ? 'Pause' : 'Play'}
          </button>
          {/* Confidence */}
          <div className="flex items-center gap-2 flex-1 max-w-[180px]">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.round(event.confidence * 100)}%`, backgroundColor: color }} />
            </div>
            <span className="text-[11px] font-mono font-bold flex-shrink-0" style={{ color }}>
              {Math.round(event.confidence * 100)}%
            </span>
          </div>
          <span className="text-[10px] text-muted ml-auto hidden sm:block truncate">{event.material} · {event.beltName}</span>
        </div>

        {/* ── Scrollable details ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-4 py-4 space-y-3">

            {/* 8-cell grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Belt',       value: event.beltName },
                { label: 'Material',   value: event.material },
                { label: 'Defect',     value: DEFECT_LABELS[event.defectType], c: color },
                { label: 'Severity',   value: event.severity,                  c: sevColor },
                { label: 'Confidence', value: `${Math.round(event.confidence * 100)}%` },
                { label: 'Frame',      value: `#${event.frameNumber}` },
                { label: 'Belt Pos',   value: `${event.beltPosition}%` },
                { label: 'Camera',     value: event.camera },
              ].map(({ label, value, c }) => (
                <div key={label} className="rounded-xl px-3 py-2"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <p className="text-[10px] text-muted">{label}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: c ?? 'var(--text-primary)' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Location */}
            <div className="rounded-xl p-3 space-y-2"
              style={{ background: color + '08', border: `1px solid ${color}33` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>📍 Exact Location</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '← From Head', value: `${fromLeft.toFixed(1)} m` },
                  { label: 'From Tail →',  value: `${fromRight.toFixed(1)} m` },
                  { label: '← Left Edge', value: `${leftOff.toFixed(2)} m` },
                  { label: 'Right Edge →', value: `${rightOff.toFixed(2)} m` },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg px-2.5 py-2"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    <p className="text-[9px] text-muted">{label}</p>
                    <p className="text-base font-mono font-bold" style={{ color }}>{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg px-2.5 py-2"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <p className="text-[9px] text-muted">Defect Span</p>
                  <p className="text-sm font-mono font-bold" style={{ color }}>{defW.toFixed(2)} m wide</p>
                </div>
                <div className="flex-1 rounded-lg px-2.5 py-2"
                  style={{ background: color + '12', border: `1px solid ${color}33` }}>
                  <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color }}>🚶 Walk-to</p>
                  <p className="text-xs font-semibold text-primary mt-0.5">
                    <span style={{ color }}>{fromLeft.toFixed(1)} m</span> from head ·{' '}
                    <span style={{ color }}>{leftOff.toFixed(2)} m</span> from left edge
                  </p>
                </div>
              </div>
            </div>

            {/* Bbox + timestamp */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl px-3 py-2"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-[10px] text-muted">Bounding Box</p>
                <p className="text-[11px] font-mono text-secondary mt-0.5">
                  x={event.bbox[0]} y={event.bbox[1]} w={event.bbox[2]} h={event.bbox[3]}
                </p>
              </div>
              <div className="rounded-xl px-3 py-2"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <p className="text-[10px] text-muted">Captured At</p>
                <p className="text-[11px] font-mono text-secondary mt-0.5">{new Date(event.timestamp).toLocaleString()}</p>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatsOverview() {
  const now = Date.now();
  const last24h = VIDEO_EVENTS.filter((e) => now - new Date(e.timestamp).getTime() < 86_400_000);
  const defectCounts = (["tear","hole","edge_damage","layer_peeling"] as DefectType[]).map((dt) => ({ type:dt, count:last24h.filter((e)=>e.defectType===dt).length, color:DEFECT_COLORS[dt] }));
  const recent = VIDEO_EVENTS.slice(0,10);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-4" style={{ backgroundColor:"var(--color-panel)",border:"1px solid var(--color-border)" }}>
          <div className="flex items-center gap-2 mb-2"><BarChart3 size={15} style={{ color:"#27a372" }}/><span className="text-xs text-muted font-medium">Events (24h)</span></div>
          <p className="text-3xl font-bold text-primary">{last24h.length}</p>
          <p className="text-xs text-muted mt-1">across all belts</p>
        </div>
        {defectCounts.map(({type,count,color})=>(
          <div key={type} className="rounded-2xl p-4" style={{ backgroundColor:"var(--color-panel)",border:`1px solid ${color}33` }}>
            <div className="flex items-center gap-2 mb-2"><span style={{ color }}>{DEFECT_ICONS[type]}</span><span className="text-xs text-muted font-medium">{DEFECT_LABELS[type]}</span></div>
            <p className="text-3xl font-bold" style={{ color }}>{count}</p>
            <p className="text-xs text-muted mt-1">last 24 hours</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor:"var(--color-panel)",border:"1px solid var(--color-border)" }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom:"1px solid var(--color-border)" }}>
          <Clock size={14} style={{ color:"#27a372" }}/><span className="text-sm font-bold text-primary">Recent Events</span>
          <span className="text-xs text-muted ml-auto">Last 10 detections</span>
        </div>
        <div className="divide-y" style={{ borderColor:"var(--color-border)" }}>
          {recent.map((ev)=>{
            const c=DEFECT_COLORS[ev.defectType],sc=SEV_COLORS[ev.severity];
            return (
              <div key={ev.id} className="flex items-center gap-3 px-5 py-2.5">
                <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor:c }}/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary truncate">{ev.beltName}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase flex-shrink-0" style={{ background:c+"22",color:c }}>{DEFECT_LABELS[ev.defectType]}</span>
                  </div>
                  <p className="text-[10px] text-muted">{ev.material} · {fmtDate(ev.timestamp)} {fmtTime(ev.timestamp)}</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0" style={{ background:sc+"22",color:sc }}>{ev.severity}</span>
                <span className="text-[10px] font-mono text-muted flex-shrink-0">{Math.round(ev.confidence*100)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function VideoAnalyticsPage() {
  const defaultDate = yesterdayStr();
  const [query,setQuery]                     = useState("");
  const [results,setResults]                 = useState<VideoEvent[]>([]);
  const [searched,setSearched]               = useState(false);
  const [videoLightbox, setVideoLightbox]    = useState<{label:string;angle:string;color:string;videoMode:"full"|"left"|"right"}|null>(null);
  const [selectedEvent,setSelectedEvent]     = useState<VideoEvent|null>(null);
  const [filterDefect,setFilterDefect]       = useState<DefectType|"all">("all");
  const [filterSeverity,setFilterSeverity]   = useState<"all"|"low"|"medium"|"high">("all");
  const [filterBelt,setFilterBelt]           = useState<string>("all");
  const [filterDate,setFilterDate]           = useState<string>(defaultDate);
  const [filterHourFrom,setFilterHourFrom]   = useState<number>(0);
  const [filterHourTo,setFilterHourTo]       = useState<number>(23);
  const [videoPlaying,setVideoPlaying]       = useState(false);
  const [showFilters,setShowFilters]         = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(()=>{
    if (!selectedEvent||!videoRef.current) return;
    videoRef.current.currentTime = selectedEvent.videoTimestamp;
    videoRef.current.play().then(()=>setVideoPlaying(true)).catch(()=>{});
  },[selectedEvent]);

  const handleSearch = () => {
    let base = query.trim()===""?[...VIDEO_EVENTS]:parseAndSearch(query);
    const filtered = base.filter((ev)=>{
      if (filterDefect!=="all"&&ev.defectType!==filterDefect) return false;
      if (filterSeverity!=="all"&&ev.severity!==filterSeverity) return false;
      if (filterBelt!=="all"&&ev.beltId!==filterBelt) return false;
      if (filterDate&&ev.timestamp.slice(0,10)!==filterDate) return false;
      const evHour=new Date(ev.timestamp).getHours();
      if (evHour<filterHourFrom||evHour>filterHourTo) return false;
      return true;
    });
    setResults(filtered); setSearched(true); setSelectedEvent(null);
  };

  const summary = useMemo(()=>{
    if (!searched) return null;
    const belts=new Set(results.map((e)=>e.beltId)).size;
    const defects=new Set(results.map((e)=>e.defectType)).size;
    const byDefect=(["tear","hole","edge_damage","layer_peeling"] as DefectType[]).map((dt)=>({type:dt,count:results.filter((e)=>e.defectType===dt).length})).filter((d)=>d.count>0);
    return {total:results.length,belts,defects,byDefect};
  },[results,searched]);

  const EXAMPLES=["Coal belt yesterday 4pm defects","Iron ore belt high severity tears","All belts today edge damage","Sinter belt last hour critical"];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2"><Video size={22} style={{ color:"#27a372" }}/>Video Analytics</h1>
          <p className="text-secondary text-sm mt-1">Search defect events by belt, time, and defect type — click any frame to jump to that timestamp</p>
        </div>
      </div>

      {/* ── Search bar ── */}
      <div className="rounded-2xl p-4 space-y-3" style={{ backgroundColor:"var(--color-panel)",border:"1px solid var(--color-border)" }}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:"var(--text-muted)" }}/>
            <input value={query} onChange={(e)=>setQuery(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&handleSearch()}
              placeholder={`e.g. "coal belt yesterday 4pm holes" or "iron ore belt high severity tears today"`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{ backgroundColor:"var(--color-surface)",border:"1px solid var(--color-border)",color:"var(--text-primary)" }}/>
          </div>
          <button onClick={handleSearch} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 active:scale-95" style={{ background:"linear-gradient(135deg,#27a372,#1a835c)" }}>
            <Search size={14}/>Search
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] text-muted self-center">Try:</span>
          {EXAMPLES.map((eq)=>(
            <button key={eq} onClick={()=>setQuery(eq)} className="text-[11px] px-2.5 py-1 rounded-full transition-all hover:opacity-80"
              style={{ backgroundColor:"var(--color-surface)",border:"1px solid var(--color-border)",color:"var(--text-secondary)" }}>{eq}</button>
          ))}
        </div>
      </div>

      {/* ── Live Camera Views — auto-play, after search ───────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor:"var(--color-panel)", border:"1px solid var(--color-border)" }}>
        <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor:"var(--color-border)" }}>
          <Camera size={14} className="text-secondary"/>
          <h2 className="text-sm font-bold text-primary">Live Camera Views</h2>
          <span className="text-xs text-muted ml-auto">Hover for full screen</span>
        </div>
        <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CAMERA_VIEWS.map((view) => (
            <CameraViewPanel
              key={view.label}
              {...view}
              onZoom={(lb) => {}}
              onVideoExpand={(v) => setVideoLightbox(v)}
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor:"var(--color-panel)",border:"1px solid var(--color-border)" }}>
        <button onClick={()=>setShowFilters((v)=>!v)} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-secondary hover:text-primary transition-colors">
          <div className="flex items-center gap-2">
            <Filter size={14} style={{ color:"#27a372" }}/><span>Advanced Filters</span>
            {(filterDefect!=="all"||filterSeverity!=="all"||filterBelt!=="all")&&<span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background:"#27a37222",color:"#27a372" }}>Active</span>}
          </div>
          <ChevronDown size={14} className="transition-transform" style={{ transform:showFilters?"rotate(180deg)":"rotate(0deg)" }}/>
        </button>
        <AnimatePresence>
          {showFilters&&(
            <motion.div initial={{ height:0,opacity:0 }} animate={{ height:"auto",opacity:1 }} exit={{ height:0,opacity:0 }} className="overflow-hidden">
              <div className="px-4 pb-4 space-y-4" style={{ borderTop:"1px solid var(--color-border)" }}>
                <div className="flex flex-wrap gap-3 pt-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={13} className="text-muted"/><label className="text-xs text-muted">Date</label>
                    <input type="date" value={filterDate} onChange={(e)=>setFilterDate(e.target.value)} className="text-xs px-2 py-1.5 rounded-lg outline-none"
                      style={{ backgroundColor:"var(--color-surface)",border:"1px solid var(--color-border)",color:"var(--text-primary)" }}/>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={13} className="text-muted"/><label className="text-xs text-muted">Hour from</label>
                    <select value={filterHourFrom} onChange={(e)=>setFilterHourFrom(Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg outline-none"
                      style={{ backgroundColor:"var(--color-surface)",border:"1px solid var(--color-border)",color:"var(--text-primary)" }}>
                      {Array.from({length:24},(_,i)=><option key={i} value={i}>{String(i).padStart(2,"0")}:00</option>)}
                    </select>
                    <label className="text-xs text-muted">to</label>
                    <select value={filterHourTo} onChange={(e)=>setFilterHourTo(Number(e.target.value))} className="text-xs px-2 py-1.5 rounded-lg outline-none"
                      style={{ backgroundColor:"var(--color-surface)",border:"1px solid var(--color-border)",color:"var(--text-primary)" }}>
                      {Array.from({length:24},(_,i)=><option key={i} value={i}>{String(i).padStart(2,"0")}:00</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">Defect:</span>
                  {(["all","tear","hole","edge_damage","layer_peeling"] as const).map((dt)=>{
                    const active=filterDefect===dt,c=dt==="all"?"#27a372":DEFECT_COLORS[dt];
                    return <button key={dt} onClick={()=>setFilterDefect(dt)} className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all"
                      style={{ background:active?c+"22":"var(--color-surface)",border:`1px solid ${active?c+"88":"var(--color-border)"}`,color:active?c:"var(--text-secondary)" }}>
                      {dt==="all"?"All Types":DEFECT_LABELS[dt]}</button>;
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">Severity:</span>
                  {(["all","low","medium","high"] as const).map((sv)=>{
                    const active=filterSeverity===sv,c=sv==="all"?"#27a372":SEV_COLORS[sv];
                    return <button key={sv} onClick={()=>setFilterSeverity(sv)} className="text-[11px] px-2.5 py-1 rounded-full font-medium capitalize transition-all"
                      style={{ background:active?c+"22":"var(--color-surface)",border:`1px solid ${active?c+"88":"var(--color-border)"}`,color:active?c:"var(--text-secondary)" }}>
                      {sv==="all"?"All Severities":sv}</button>;
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Belt:</span>
                  <select value={filterBelt} onChange={(e)=>setFilterBelt(e.target.value)} className="text-xs px-3 py-1.5 rounded-lg outline-none max-w-xs"
                    style={{ backgroundColor:"var(--color-surface)",border:"1px solid var(--color-border)",color:"var(--text-primary)" }}>
                    <option value="all">All Belts</option>
                    {BELT_CATALOG.map((b)=><option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {searched&&summary&&(
          <motion.div initial={{ opacity:0,y:-8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0 }}
            className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ backgroundColor:"var(--color-panel)",border:"1px solid var(--color-border)" }}>
            <span className="text-sm font-semibold text-primary">{summary.total} event{summary.total!==1?"s":""} found</span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-secondary">{summary.belts} belt{summary.belts!==1?"s":""}</span>
            <span className="text-xs text-muted">·</span>
            <span className="text-xs text-secondary">{summary.defects} defect type{summary.defects!==1?"s":""}</span>
            <div className="flex gap-1.5 ml-auto flex-wrap">
              {summary.byDefect.map(({type,count})=>(
                <span key={type} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background:DEFECT_COLORS[type]+"22",color:DEFECT_COLORS[type] }}>{DEFECT_LABELS[type]}: {count}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {searched && results.length===0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="rounded-2xl p-12 text-center"
          style={{ backgroundColor:"var(--color-panel)",border:"1px solid var(--color-border)" }}>
          <AlertTriangle size={36} className="mx-auto mb-4" style={{ color:"#f59e0b" }}/>
          <p className="text-lg font-bold text-primary mb-2">No events found</p>
          <p className="text-sm text-secondary mb-4">No defect events matched your search criteria.</p>
          <div className="text-xs text-muted space-y-1">
            <p>Suggestions:</p>
            <p>• Try a broader date range or remove the hour filter</p>
            <p>• Check the belt name spelling (e.g. "coal belt", "iron ore belt")</p>
            <p>• Leave the search box empty and click Search to see all events</p>
          </div>
        </motion.div>
      ) : searched && results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {results.map((ev)=>(
              <FrameCard key={ev.id} event={ev} selected={selectedEvent?.id===ev.id}
                onClick={()=>setSelectedEvent((prev)=>prev?.id===ev.id?null:ev)}/>
            ))}
          </AnimatePresence>
        </div>
      ) : null}

      {/* ── Fullscreen playback modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEvent && (
          <PlaybackModal
            event={selectedEvent}
            videoRef={videoRef}
            videoPlaying={videoPlaying}
            setVideoPlaying={setVideoPlaying}
            onClose={() => { setSelectedEvent(null); videoRef.current?.pause(); setVideoPlaying(false); }}
          />
        )}
      </AnimatePresence>

      {/* ── Video lightbox ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {videoLightbox && (
          <VideoLightboxModal
            label={videoLightbox.label}
            angle={videoLightbox.angle}
            color={videoLightbox.color}
            videoMode={videoLightbox.videoMode}
            onClose={() => setVideoLightbox(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
