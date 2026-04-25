import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Video, Filter, Clock, AlertTriangle, Scissors, Circle,
  AlignLeft, Layers, ChevronDown, Play, Pause, SkipBack, X,
  BarChart3, Calendar, Camera,
} from "lucide-react";
import type { DefectType } from "@/types";
import { type VideoEvent, VIDEO_EVENTS, DEFECT_COLORS, DEFECT_LABELS } from "@/data/videoAnalytics";
import { BELT_CATALOG } from "@/data/beltCatalog";
import frontViewVideo from "@/assets/front_view.mp4";

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

function FrameCard({ event, selected, onClick }: { event: VideoEvent; selected: boolean; onClick: () => void }) {
  const color = DEFECT_COLORS[event.defectType];
  const sevColor = SEV_COLORS[event.severity];
  const FRAME_W = 1280, FRAME_H = 720;
  const [bx, by, bw, bh] = event.bbox;
  const left = `${(bx/FRAME_W)*100}%`, top = `${(by/FRAME_H)*100}%`;
  const width = `${(bw/FRAME_W)*100}%`, height = `${(bh/FRAME_H)*100}%`;
  return (
    <motion.div layout initial={{ opacity:0,y:8 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,scale:0.95 }} whileHover={{ y:-2 }}
      onClick={onClick} className="rounded-xl overflow-hidden cursor-pointer relative group"
      style={{ backgroundColor:"var(--color-panel)", border: selected?`2px solid ${color}`:"1px solid var(--color-border)", boxShadow: selected?`0 0 0 3px ${color}33`:undefined }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ backgroundColor:color+"22", borderBottom:`1px solid ${color}44` }}>
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{DEFECT_ICONS[event.defectType]}</span>
          <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>{DEFECT_LABELS[event.defectType]}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase" style={{ background:sevColor+"22",color:sevColor }}>{event.severity}</span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background:"var(--color-surface)",color:"var(--text-muted)" }}><Camera size={8} className="inline mr-0.5"/>{event.camera}</span>
        </div>
      </div>
      <div className="relative overflow-hidden" style={{ height:160,background:"#0a0a0a" }}>
        <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.15) 2px,rgba(0,0,0,0.15) 4px)" }}/>
        <div className="absolute z-20 pointer-events-none" style={{ left,top,width,height,border:`2px solid ${color}`,boxShadow:`0 0 6px ${color}88` }}>
          <span className="absolute -top-4 left-0 text-[9px] font-bold px-1 py-0.5 whitespace-nowrap" style={{ background:color,color:"#fff",borderRadius:2 }}>{DEFECT_LABELS[event.defectType]}</span>
        </div>
        <span className="absolute bottom-1.5 left-2 text-[9px] font-mono z-20" style={{ color:"rgba(255,255,255,0.5)" }}>#{event.frameNumber}</span>
        <span className="absolute bottom-1.5 right-2 text-[9px] font-mono z-20" style={{ color:"rgba(255,255,255,0.5)" }}>{fmtTime(event.timestamp)}</span>
        <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background:"rgba(0,0,0,0.55)" }}>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background:color }}><Play size={11} fill="white"/>Jump to frame</span>
        </div>
      </div>
      <div className="px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-primary truncate">{event.beltName}</span>
          <span className="text-[10px] text-muted ml-2 flex-shrink-0">{fmtDate(event.timestamp)} {fmtTime(event.timestamp)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted w-16 flex-shrink-0">Confidence</span>
          <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor:"var(--color-border)" }}>
            <div className="h-full rounded-full" style={{ width:`${event.confidence*100}%`,backgroundColor:color }}/>
          </div>
          <span className="text-[10px] font-mono text-muted w-8 text-right">{Math.round(event.confidence*100)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted">Belt pos:</span>
          <span className="text-[10px] font-mono" style={{ color:"var(--text-secondary)" }}>{event.beltPosition}%</span>
          <span className="text-[10px] text-muted ml-auto">{event.material}</span>
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
      </div>
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

      {!searched ? <StatsOverview/> : results.length===0 ? (
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
      ) : (
        <div className={`grid gap-6 ${selectedEvent?"grid-cols-1 lg:grid-cols-[1fr_360px]":"grid-cols-1"}`}>
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {results.map((ev)=>(
                  <FrameCard key={ev.id} event={ev} selected={selectedEvent?.id===ev.id}
                    onClick={()=>setSelectedEvent((prev)=>prev?.id===ev.id?null:ev)}/>
                ))}
              </AnimatePresence>
            </div>
          </div>
          <AnimatePresence>
            {selectedEvent&&(
              <div>
                <VideoPlayerPanel event={selectedEvent} videoRef={videoRef} videoPlaying={videoPlaying} setVideoPlaying={setVideoPlaying}
                  onClose={()=>{ setSelectedEvent(null); videoRef.current?.pause(); setVideoPlaying(false); }}/>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
