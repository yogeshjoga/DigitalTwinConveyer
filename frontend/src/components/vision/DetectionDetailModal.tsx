/**
 * DetectionDetailModal
 * Full-screen drawer that opens when any vision detection card is clicked.
 * Shows: full image, exact location, AI suggestions, fix time estimate,
 * and an embedded work order assignment panel pre-tagged with this detection.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ZoomIn, MapPin, Clock, Wrench, AlertTriangle,
  CheckCircle2, ChevronRight, Send, MessageSquare,
  Mail, Phone, Ticket, ClipboardList, Settings,
  Scissors, Circle, AlignLeft, Layers, Star,
  HardHat, Shield, Zap, Thermometer, CheckCircle,
} from "lucide-react";
import type { VisionDetection, DefectType } from "@/types";
import { ENGINEERS, TASK_TEMPLATES } from "@/components/maintenance/WorkOrderAssignment";
import { useBeltStore } from "@/store/useBeltStore";

// ── Defect knowledge base ──────────────────────────────────────────────────────
const DEFECT_KNOWLEDGE: Record<Exclude<DefectType,"none">, {
  color: string;
  icon: React.ElementType;
  cause: string[];
  immediateActions: string[];
  preventive: string[];
  fixTimeHours: { low: number; medium: number; high: number };
  suggestedRoles: Array<"maintenance"|"quality"|"service"|"head"|"thermal"|"electrical"|"safety">;
  priority: "low"|"medium"|"high"|"critical";
}> = {
  tear: {
    color: "#ef4444",
    icon: Scissors,
    cause: [
      "Sharp foreign objects (rocks, metal scrap) in material feed",
      "Overloading beyond rated tensile strength",
      "Splice joint failure under cyclic stress",
      "Impact damage from material drop height",
    ],
    immediateActions: [
      "Reduce belt speed by 30% immediately",
      "Inspect and remove any foreign objects from feed",
      "Apply cold vulcanisation repair if tear < 50mm",
      "Mark tear boundaries with chalk for monitoring",
      "Check load cell readings for overload events",
    ],
    preventive: [
      "Install rock trap / grizzly screen at feed point",
      "Reduce drop height with chute modifications",
      "Schedule splice inspection every 500 operating hours",
      "Install rip detection loop sensor",
    ],
    fixTimeHours: { low: 2, medium: 6, high: 24 },
    suggestedRoles: ["maintenance", "service", "head"],
    priority: "critical",
  },
  hole: {
    color: "#f97316",
    icon: Circle,
    cause: [
      "Puncture from sharp material (ore lumps, metal debris)",
      "Idler roller failure causing belt to contact frame",
      "Excessive impact force at loading zone",
      "Corrosive material degrading belt cover",
    ],
    immediateActions: [
      "Inspect hole diameter — if > 25mm, stop belt",
      "Remove any embedded foreign objects",
      "Apply patch repair for holes < 50mm diameter",
      "Check idler rollers in the affected zone",
      "Inspect loading chute for sharp edges",
    ],
    preventive: [
      "Install impact idlers at loading zone",
      "Add rubber lining to chute impact area",
      "Increase belt cover thickness specification",
      "Install metal detector in material feed",
    ],
    fixTimeHours: { low: 1, medium: 4, high: 12 },
    suggestedRoles: ["maintenance", "service"],
    priority: "high",
  },
  edge_damage: {
    color: "#f59e0b",
    icon: AlignLeft,
    cause: [
      "Belt misalignment causing edge contact with structure",
      "Overloading causing belt sag and edge spillage",
      "Incorrect belt width for the conveyor frame",
      "Training idler misadjustment",
    ],
    immediateActions: [
      "Check belt tracking — adjust training idlers",
      "Inspect all idler sets for misalignment",
      "Reduce load if belt sag is visible",
      "Trim damaged edge if fraying is < 20mm",
      "Check belt tension — retension if slack",
    ],
    preventive: [
      "Install belt alignment sensors / switches",
      "Schedule monthly tracking inspection",
      "Verify idler spacing meets belt sag specification",
      "Install edge protection guards",
    ],
    fixTimeHours: { low: 1, medium: 3, high: 8 },
    suggestedRoles: ["maintenance", "electrical"],
    priority: "medium",
  },
  layer_peeling: {
    color: "#a855f7",
    icon: Layers,
    cause: [
      "Thermal degradation from hot material (sinter, slag)",
      "Chemical attack from acidic or alkaline material",
      "Adhesion failure between cover and carcass",
      "Age-related rubber hardening and cracking",
      "Water ingress causing delamination",
    ],
    immediateActions: [
      "Measure peeling area extent — mark boundaries",
      "Check material temperature at loading point",
      "Apply cold bonding adhesive to peeling edges",
      "Reduce belt speed to lower thermal stress",
      "Inspect for water ingress at splice joints",
    ],
    preventive: [
      "Use heat-resistant belt grade for hot material",
      "Install temperature monitoring at loading zone",
      "Apply belt dressing to maintain cover flexibility",
      "Schedule annual belt hardness testing",
    ],
    fixTimeHours: { low: 2, medium: 8, high: 48 },
    suggestedRoles: ["maintenance", "quality", "thermal"],
    priority: "high",
  },
};

const DEFECT_LABELS: Record<DefectType, string> = {
  tear: "Tear", hole: "Hole", edge_damage: "Edge Damage",
  layer_peeling: "Layer Peeling", none: "No Defect",
};

type Channel = "whatsapp"|"email"|"sms"|"jira"|"servicenow"|"maximo";
const CHANNELS: { id: Channel; label: string; color: string }[] = [
  { id: "whatsapp",   label: "WhatsApp",   color: "#25D366" },
  { id: "email",      label: "Email",      color: "#3b82f6" },
  { id: "sms",        label: "SMS",        color: "#8b5cf6" },
  { id: "jira",       label: "Jira",       color: "#0052CC" },
  { id: "servicenow", label: "ServiceNow", color: "#62d84e" },
  { id: "maximo",     label: "IBM Maximo", color: "#f59e0b" },
];

const ROLE_COLORS: Record<string, string> = {
  head:"#f59e0b", maintenance:"#27a372", quality:"#3b82f6",
  service:"#8b5cf6", thermal:"#ef4444", electrical:"#f59e0b", safety:"#f97316",
};

interface SentTicket {
  id: string; engineerName: string; channel: Channel;
  taskTitle: string; priority: string; sentAt: Date; ticketRef: string;
}

interface Props {
  detection: VisionDetection;
  imgSrc: string | null;
  onClose: () => void;
}
export default function DetectionDetailModal({ detection, imgSrc, onClose }: Props) {
  const d = detection;
  if (d.defectType === "none") return null;
  const knowledge = DEFECT_KNOWLEDGE[d.defectType as Exclude<DefectType,"none">];
  const color = knowledge.color;
  const Icon = knowledge.icon;
  const selectedBelt = useBeltStore((s) => s.selectedBeltEntry);

  const BELT_LEN = 100, BELT_W = 1.2;
  const fromLeft  = d.position.x * BELT_LEN;
  const fromRight = BELT_LEN - fromLeft;
  const leftOff   = d.position.y * BELT_W;
  const defW      = Math.max(0.01, d.position.w * BELT_W);
  const rightOff  = Math.max(0, BELT_W - leftOff - defW);
  const fixHours  = knowledge.fixTimeHours[d.severity];

  const [activeTab, setActiveTab]           = useState<"overview"|"actions"|"assign">("overview");
  const [imgZoom, setImgZoom]               = useState(false);
  const [selectedEngineers, setSelectedEngineers] = useState<string[]>(() =>
    ENGINEERS.filter((e) => knowledge.suggestedRoles.includes(e.role) && e.available).slice(0,1).map((e) => e.id)
  );
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(["whatsapp","email"]);
  const [sending, setSending]               = useState(false);
  const [sent, setSent]                     = useState(false);
  const [sentTickets, setSentTickets]       = useState<SentTicket[]>([]);
  const [filterRole, setFilterRole]         = useState<string>("all");

  const defectTypeKey = d.defectType === "tear" ? "Belt Tear" : d.defectType === "hole" ? "Belt Tear" : d.defectType === "edge_damage" ? "Misalignment" : "General Maintenance";
  const template = TASK_TEMPLATES[defectTypeKey] ?? TASK_TEMPLATES["General Maintenance"];
  const [taskTitle, setTaskTitle] = useState(`${DEFECT_LABELS[d.defectType]} at ${fromLeft.toFixed(1)}m — ${selectedBelt.name}`);
  const [taskDesc, setTaskDesc]   = useState(
    `${template.description}\n\n[Vision detection: ${d.id} — ${DEFECT_LABELS[d.defectType]} · ${(d.confidence*100).toFixed(0)}% confidence]\n[Location: ${fromLeft.toFixed(1)}m from head, ${leftOff.toFixed(2)}m from left edge]\n[Defect span: ${defW.toFixed(2)}m wide]`
  );
  const [priority, setPriority]   = useState<"low"|"medium"|"high"|"critical">(knowledge.priority);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const toggleEng = (id: string) => setSelectedEngineers((p) => p.includes(id) ? p.filter((e) => e !== id) : [...p, id]);
  const toggleCh  = (ch: Channel) => setSelectedChannels((p) => p.includes(ch) ? p.filter((c) => c !== ch) : [...p, ch]);

  const handleSend = async () => {
    if (!selectedEngineers.length || !selectedChannels.length) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    const now = new Date();
    const tickets: SentTicket[] = [];
    for (const engId of selectedEngineers) {
      const eng = ENGINEERS.find((e) => e.id === engId)!;
      for (const ch of selectedChannels) {
        const prefix = ch==="jira"?"BELT":ch==="servicenow"?"SN":ch==="maximo"?"WO":"MSG";
        tickets.push({ id:`${engId}-${ch}-${Date.now()}`, engineerName:eng.name, channel:ch, taskTitle, priority, sentAt:now, ticketRef:`${prefix}-${Math.floor(10000+Math.random()*90000)}` });
      }
    }
    setSentTickets(tickets); setSending(false); setSent(true);
  };

  const filteredEngineers = filterRole === "all" ? ENGINEERS : ENGINEERS.filter((e) => e.role === filterRole);
  const priorityColor = { low:"#27a372", medium:"#f59e0b", high:"#f97316", critical:"#ef4444" }[priority];
  const sevColor = d.severity === "high" ? "#ef4444" : d.severity === "medium" ? "#f59e0b" : "#27a372";

  return (
    <>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        className="fixed inset-0 z-50" style={{ background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)" }}
        onClick={onClose}/>

      <motion.div initial={{ x:"100%" }} animate={{ x:0 }} exit={{ x:"100%" }}
        transition={{ type:"spring", stiffness:320, damping:32 }}
        className="fixed right-0 top-0 h-full z-50 flex flex-col overflow-hidden"
        style={{ width:"min(680px,100vw)", backgroundColor:"var(--color-panel)", borderLeft:"1px solid var(--color-border)", boxShadow:"-8px 0 40px rgba(0,0,0,0.25)" }}>

        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor:"var(--color-border)", background:`linear-gradient(135deg,${color}12,transparent)` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:color+"22" }}>
            <Icon size={18} style={{ color }}/>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-primary">{DEFECT_LABELS[d.defectType]}</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background:sevColor+"22",color:sevColor }}>{d.severity}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={{ background:priorityColor+"22",color:priorityColor }}>{priority} priority</span>
            </div>
            <p className="text-xs text-muted mt-0.5">{d.id} · {new Date(d.timestamp).toLocaleString()} · {selectedBelt.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-muted hover:text-primary transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex-shrink-0">
            <X size={18}/>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor:"var(--color-border)" }}>
          {([
            { id:"overview", label:"Overview & Location" },
            { id:"actions",  label:"Fix Actions & AI Suggestions" },
            { id:"assign",   label:"Assign Work Order" },
          ] as const).map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex-1 py-2.5 text-xs font-semibold transition-colors"
              style={{ color:activeTab===id?color:"var(--text-muted)", borderBottom:activeTab===id?`2px solid ${color}`:"2px solid transparent", background:activeTab===id?color+"08":"transparent" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <div className="p-5 space-y-5">
              {/* Full image */}
              <div className="relative rounded-2xl overflow-hidden group cursor-pointer" style={{ background:color+"0d", border:`1px solid ${color}33` }}
                onClick={() => setImgZoom(true)}>
                {imgSrc ? (
                  <>
                    <img src={imgSrc} alt={DEFECT_LABELS[d.defectType]} className="w-full object-cover rounded-2xl" style={{ maxHeight:280 }}/>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" style={{ background:"rgba(0,0,0,0.4)" }}>
                      <span className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold" style={{ background:"rgba(255,255,255,0.15)", backdropFilter:"blur(4px)" }}>
                        <ZoomIn size={15}/>Full Screen
                      </span>
                    </div>
                    {/* Bbox overlay */}
                    <div className="absolute pointer-events-none" style={{ left:`${d.position.x*100}%`, top:`${d.position.y*100}%`, width:`${Math.max(3,d.position.w*100)}%`, height:`${Math.max(3,d.position.h*100)}%`, border:`2px solid ${color}`, boxShadow:`0 0 8px ${color}88` }}>
                      <span className="absolute -top-5 left-0 text-[9px] font-bold px-1.5 py-0.5 whitespace-nowrap" style={{ background:color, color:"#fff", borderRadius:3 }}>{DEFECT_LABELS[d.defectType]}</span>
                    </div>
                    <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase" style={{ background:sevColor, color:"#fff" }}>{d.severity}</span>
                  </>
                ) : (
                  <div className="h-40 flex items-center justify-center gap-2 opacity-40">
                    <Icon size={36} style={{ color }}/><span className="text-sm text-muted">No image available</span>
                  </div>
                )}
              </div>

              {/* Confidence */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)" }}>
                <div className="flex-1">
                  <p className="text-xs text-muted mb-1">Detection Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor:"var(--color-border)" }}>
                      <div className="h-full rounded-full" style={{ width:`${d.confidence*100}%`, backgroundColor:color }}/>
                    </div>
                    <span className="font-mono font-bold text-sm" style={{ color }}>{(d.confidence*100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Physical location */}
              <div className="rounded-xl p-4 space-y-3" style={{ background:color+"0d", border:`1px solid ${color}44` }}>
                <div className="flex items-center gap-2">
                  <MapPin size={14} style={{ color }}/>
                  <span className="text-sm font-bold" style={{ color }}>Exact Physical Location</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label:"← From Head End", value:`${fromLeft.toFixed(1)} m` },
                    { label:"From Tail End →",  value:`${fromRight.toFixed(1)} m` },
                    { label:"← Left Edge",      value:`${leftOff.toFixed(2)} m` },
                    { label:"Right Edge →",      value:`${rightOff.toFixed(2)} m` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg px-3 py-2.5" style={{ backgroundColor:"var(--color-surface)" }}>
                      <p className="text-[10px] text-muted">{label}</p>
                      <p className="text-base font-mono font-bold mt-0.5" style={{ color }}>{value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg px-3 py-2.5" style={{ backgroundColor:"var(--color-surface)" }}>
                  <p className="text-[10px] text-muted">Defect Span</p>
                  <p className="text-sm font-mono font-bold mt-0.5" style={{ color }}>{defW.toFixed(2)} m wide · {Math.max(0.01, d.position.h * BELT_W).toFixed(2)} m along belt</p>
                </div>
                <div className="rounded-lg px-3 py-2.5" style={{ background:color+"18", border:`1px solid ${color}33` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>🚶 Walk-to instruction</p>
                  <p className="text-sm font-semibold text-primary mt-1">
                    Go to <span style={{ color }}>{fromLeft.toFixed(1)} m</span> from head pulley,
                    measure <span style={{ color }}>{leftOff.toFixed(2)} m</span> from left belt edge
                  </p>
                </div>
              </div>

              {/* Cause analysis */}
              <div className="rounded-xl p-4 space-y-2" style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)" }}>
                <p className="text-xs font-bold text-secondary uppercase tracking-wide">Likely Causes</p>
                {knowledge.cause.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5 flex-shrink-0" style={{ color }}>•</span>
                    <p className="text-xs text-secondary">{c}</p>
                  </div>
                ))}
              </div>

              {/* Estimated fix time */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)" }}>
                <Clock size={16} style={{ color }}/>
                <div>
                  <p className="text-xs text-muted">Estimated Fix Time</p>
                  <p className="text-lg font-bold" style={{ color }}>{fixHours < 1 ? `${fixHours*60} min` : `${fixHours} hour${fixHours !== 1 ? "s" : ""}`}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted">Expected completion</p>
                  <p className="text-sm font-semibold text-primary">{new Date(Date.now() + fixHours*3600_000).toLocaleString([], { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── ACTIONS TAB ── */}
          {activeTab === "actions" && (
            <div className="p-5 space-y-5">
              <div className="rounded-xl p-4 space-y-3" style={{ background:color+"0d", border:`1px solid ${color}44` }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color }}/>
                  <span className="text-sm font-bold" style={{ color }}>Immediate Actions Required</span>
                </div>
                {knowledge.immediateActions.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor:"var(--color-surface)" }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white" style={{ background:color }}>{i+1}</span>
                    <p className="text-sm text-primary">{a}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4 space-y-3" style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)" }}>
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-green-500"/>
                  <span className="text-sm font-bold text-secondary">Preventive Measures</span>
                </div>
                {knowledge.preventive.map((p, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight size={13} className="text-green-500 mt-0.5 flex-shrink-0"/>
                    <p className="text-xs text-secondary">{p}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl p-4 space-y-2" style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)" }}>
                <p className="text-xs font-bold text-secondary uppercase tracking-wide">AI Recommendation</p>
                <p className="text-sm text-primary leading-relaxed">
                  Based on <strong style={{ color }}>{DEFECT_LABELS[d.defectType]}</strong> detected at{" "}
                  <strong style={{ color }}>{fromLeft.toFixed(1)}m</strong> with{" "}
                  <strong style={{ color }}>{(d.confidence*100).toFixed(0)}%</strong> confidence and{" "}
                  <strong style={{ color }}>{d.severity}</strong> severity:
                </p>
                <p className="text-sm text-secondary leading-relaxed">
                  {d.severity === "high"
                    ? `⚠️ Immediate shutdown recommended. Estimated repair time: ${fixHours}h. Assign head engineer + maintenance team. Use cold vulcanisation for temporary fix, schedule full replacement within 48h.`
                    : d.severity === "medium"
                    ? `Schedule repair within next maintenance window (${fixHours}h). Monitor defect progression every 2 hours. Reduce belt speed by 20% as precaution.`
                    : `Log for next scheduled maintenance. Monitor at each shift inspection. No immediate speed reduction required.`
                  }
                </p>
              </div>
            </div>
          )}

          {/* ── ASSIGN TAB ── */}
          {activeTab === "assign" && (
            <div className="p-5 space-y-4">
              {sent ? (
                <div className="rounded-2xl p-6 text-center space-y-3" style={{ background:"#27a37212", border:"1px solid #27a37244" }}>
                  <CheckCircle2 size={40} className="mx-auto text-green-500"/>
                  <p className="text-lg font-bold text-primary">Work Order Sent!</p>
                  <p className="text-sm text-secondary">{sentTickets.length} notification{sentTickets.length!==1?"s":""} dispatched</p>
                  <div className="space-y-1.5 mt-3">
                    {sentTickets.map((t) => {
                      const ch = CHANNELS.find((c) => c.id === t.channel)!;
                      return (
                        <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background:"var(--color-surface)" }}>
                          <span className="text-xs font-medium text-primary flex-1">{t.engineerName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background:ch.color+"22", color:ch.color }}>{t.ticketRef}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={onClose} className="mt-2 px-6 py-2 rounded-xl text-sm font-semibold text-white" style={{ background:"linear-gradient(135deg,#27a372,#1a835c)" }}>Close</button>
                </div>
              ) : (
                <>
                  {/* Task details */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted mb-1 block">Task Title</label>
                      <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                        style={{ backgroundColor:"var(--color-surface)", border:"1px solid var(--color-border)", color:"var(--text-primary)" }}/>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted mb-1 block">Description (pre-filled with detection data)</label>
                      <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={5}
                        className="w-full text-xs px-3 py-2 rounded-lg outline-none resize-none font-mono"
                        style={{ backgroundColor:"var(--color-surface)", border:"1px solid var(--color-border)", color:"var(--text-primary)" }}/>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-muted mb-1 block">Priority</label>
                        <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)} className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                          style={{ backgroundColor:"var(--color-surface)", border:"1px solid var(--color-border)", color:"var(--text-primary)" }}>
                          <option value="low">Low</option><option value="medium">Medium</option>
                          <option value="high">High</option><option value="critical">Critical</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <span className="w-full text-center text-xs font-bold px-3 py-2 rounded-lg uppercase" style={{ background:priorityColor+"18", color:priorityColor, border:`1px solid ${priorityColor}33` }}>{priority} priority</span>
                      </div>
                    </div>
                  </div>

                  {/* Channels */}
                  <div>
                    <label className="text-xs font-medium text-muted mb-2 block">Notify via</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CHANNELS.map(({ id, label, color: cc }) => {
                        const active = selectedChannels.includes(id);
                        return <button key={id} onClick={() => toggleCh(id)} className="py-2 rounded-xl text-xs font-medium transition-all"
                          style={{ background:active?cc+"22":"var(--color-surface)", border:`1px solid ${active?cc+"88":"var(--color-border)"}`, color:active?cc:"var(--text-secondary)" }}>{label}</button>;
                      })}
                    </div>
                  </div>

                  {/* Engineers */}
                  <div>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                      <label className="text-xs font-medium text-muted">Assign Engineers</label>
                      <div className="flex gap-1 flex-wrap">
                        {(["all","head","maintenance","quality","service","thermal","electrical","safety"] as const).map((role) => (
                          <button key={role} onClick={() => setFilterRole(role)} className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize transition-all"
                            style={{ background:filterRole===role?"#27a37222":"var(--color-surface)", border:`1px solid ${filterRole===role?"#27a37288":"var(--color-border)"}`, color:filterRole===role?"#27a372":"var(--text-muted)" }}>{role}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {filteredEngineers.map((eng) => {
                        const selected = selectedEngineers.includes(eng.id);
                        const isSuggested = knowledge.suggestedRoles.includes(eng.role);
                        const rc = ROLE_COLORS[eng.role];
                        return (
                          <motion.button key={eng.id} onClick={() => toggleEng(eng.id)} whileTap={{ scale:0.98 }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                            style={{ background:selected?"#27a37215":"var(--color-surface)", border:`1px solid ${selected?"#27a37266":"var(--color-border)"}` }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative" style={{ background:rc+"33", color:rc }}>
                              {eng.avatar}
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${eng.available?"bg-green-500":"bg-red-500"}`}/>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-primary">{eng.name}</span>
                                {isSuggested && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background:"#27a37222", color:"#27a372" }}>SUGGESTED</span>}
                              </div>
                              <p className="text-[10px] text-muted">{eng.title}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor:"var(--color-border)" }}>
                                  <div className="h-full rounded-full" style={{ width:`${eng.currentLoad}%`, backgroundColor:eng.currentLoad>80?"#ef4444":eng.currentLoad>60?"#f59e0b":"#27a372" }}/>
                                </div>
                                <span className="text-[10px] text-muted w-7 text-right">{eng.currentLoad}%</span>
                              </div>
                            </div>
                            <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background:selected?"#27a372":"var(--color-border)", border:`1px solid ${selected?"#27a372":"var(--color-border)"}` }}>
                              {selected && <CheckCircle2 size={12} className="text-white"/>}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Sticky footer ── */}
        {activeTab === "assign" && !sent && (
          <div className="sticky bottom-0 px-5 py-4 border-t flex items-center justify-between gap-3 flex-shrink-0"
            style={{ backgroundColor:"var(--color-panel)", borderColor:"var(--color-border)" }}>
            <p className="text-xs text-muted">
              {selectedEngineers.length} engineer{selectedEngineers.length!==1?"s":""} · {selectedChannels.length} channel{selectedChannels.length!==1?"s":""}
              {selectedEngineers.length>0&&selectedChannels.length>0&&<span className="text-brand-500 ml-1">→ {selectedEngineers.length*selectedChannels.length} notifications</span>}
            </p>
            <button onClick={handleSend} disabled={!selectedEngineers.length||!selectedChannels.length||sending}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background:"linear-gradient(135deg,#27a372,#1a835c)" }}>
              {sending ? <><motion.div animate={{ rotate:360 }} transition={{ duration:1,repeat:Infinity,ease:"linear" }}><Settings size={14}/></motion.div>Sending…</> : <><Send size={14}/>Send Work Order</>}
            </button>
          </div>
        )}
        {activeTab !== "assign" && (
          <div className="sticky bottom-0 px-5 py-3 border-t flex-shrink-0" style={{ backgroundColor:"var(--color-panel)", borderColor:"var(--color-border)" }}>
            <button onClick={() => setActiveTab("assign")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background:`linear-gradient(135deg,${color},${color}bb)` }}>
              <Wrench size={14}/>Assign Work Order for this Detection
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Full image zoom ── */}
      <AnimatePresence>
        {imgZoom && imgSrc && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            style={{ background:"rgba(0,0,0,0.92)", backdropFilter:"blur(8px)" }}
            onClick={() => setImgZoom(false)}>
            <motion.div initial={{ scale:0.85 }} animate={{ scale:1 }} exit={{ scale:0.85 }}
              className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setImgZoom(false)} className="absolute -top-10 right-0 flex items-center gap-1.5 text-white/70 hover:text-white text-sm">
                <X size={16}/>Close
              </button>
              <img src={imgSrc} alt={DEFECT_LABELS[d.defectType]} className="w-full rounded-2xl shadow-2xl"/>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
