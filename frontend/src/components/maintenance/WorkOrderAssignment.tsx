import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wrench, Mail, Phone, MessageSquare,
  Ticket, Send, CheckCircle2, ChevronDown, ChevronUp,
  AlertTriangle, Thermometer, Zap, Activity, Settings,
  HardHat, ClipboardList, Shield, Star, Tag, X,
  Eye, Bell, MapPin, Search, Plus,
} from "lucide-react";
import { useAlerts, useVisionDetections } from "@/api/hooks";
import { BELT_CATALOG } from "@/data/beltCatalog";

// ── Engineer roster ────────────────────────────────────────────────────────────
export interface Engineer {
  id: string;
  name: string;
  role: "maintenance" | "quality" | "service" | "head" | "thermal" | "electrical" | "safety";
  title: string;
  phone: string;
  email: string;
  whatsapp: string;
  avatar: string;
  available: boolean;
  currentLoad: number;
  specialties: string[];
}

export const ENGINEERS: Engineer[] = [
  { id: "eng-001", name: "Rajesh Kumar",  role: "head",        title: "Chief Maintenance Engineer",    phone: "+91-98765-43210", email: "rajesh.kumar@beltguard.io",  whatsapp: "+919876543210", avatar: "RK", available: true,  currentLoad: 45, specialties: ["Belt Systems","Predictive Maintenance","Root Cause Analysis"] },
  { id: "eng-002", name: "Priya Sharma",  role: "maintenance", title: "Senior Maintenance Engineer",   phone: "+91-98765-43211", email: "priya.sharma@beltguard.io",  whatsapp: "+919876543211", avatar: "PS", available: true,  currentLoad: 60, specialties: ["Conveyor Belts","Idler Replacement","Tension Adjustment"] },
  { id: "eng-003", name: "Arjun Mehta",   role: "maintenance", title: "Maintenance Technician",        phone: "+91-98765-43212", email: "arjun.mehta@beltguard.io",   whatsapp: "+919876543212", avatar: "AM", available: false, currentLoad: 90, specialties: ["Belt Splicing","Pulley Alignment","Lubrication"] },
  { id: "eng-004", name: "Sunita Patel",  role: "quality",     title: "Quality Control Engineer",      phone: "+91-98765-43213", email: "sunita.patel@beltguard.io",  whatsapp: "+919876543213", avatar: "SP", available: true,  currentLoad: 30, specialties: ["Defect Analysis","Material Testing","ISO Compliance"] },
  { id: "eng-005", name: "Vikram Singh",  role: "service",     title: "Field Service Engineer",        phone: "+91-98765-43214", email: "vikram.singh@beltguard.io",  whatsapp: "+919876543214", avatar: "VS", available: true,  currentLoad: 55, specialties: ["On-site Repair","Emergency Response","Belt Tracking"] },
  { id: "eng-006", name: "Deepa Nair",    role: "thermal",     title: "Thermal Systems Specialist",    phone: "+91-98765-43215", email: "deepa.nair@beltguard.io",    whatsapp: "+919876543215", avatar: "DN", available: true,  currentLoad: 40, specialties: ["Thermal Imaging","Heat Zone Analysis","Friction Reduction"] },
  { id: "eng-007", name: "Karan Joshi",   role: "electrical",  title: "Electrical & Controls Engineer",phone: "+91-98765-43216", email: "karan.joshi@beltguard.io",   whatsapp: "+919876543216", avatar: "KJ", available: true,  currentLoad: 50, specialties: ["Drive Systems","VFD Control","Sensor Calibration"] },
  { id: "eng-008", name: "Meera Iyer",    role: "safety",      title: "HSE & Safety Officer",          phone: "+91-98765-43217", email: "meera.iyer@beltguard.io",    whatsapp: "+919876543217", avatar: "MI", available: true,  currentLoad: 25, specialties: ["Safety Audits","LOTO Procedures","Incident Investigation"] },
];

export const TASK_TEMPLATES: Record<string, { title: string; description: string; priority: "low"|"medium"|"high"|"critical"; suggestedRoles: Engineer["role"][] }> = {
  "Belt Tear":          { title: "Inspect & Repair Belt Tear",          description: "Perform visual and tactile inspection of belt surface for tear propagation. Measure tear dimensions. Assess if cold repair or full replacement is required. Check load cell readings for overload events.",                                                                    priority: "critical", suggestedRoles: ["maintenance","service","head"] },
  "Overheating":        { title: "Thermal Inspection — Overheat Zone",  description: "Conduct thermal imaging scan across all idler zones. Identify friction hotspots. Check idler bearing condition and lubrication. Verify belt speed and tension are within spec.",                                                                                             priority: "high",     suggestedRoles: ["thermal","maintenance"] },
  "Belt Burst":         { title: "Emergency Belt Burst Assessment",      description: "Immediate shutdown and lockout/tagout. Inspect splice joints and belt edges for burst initiation points. Check for foreign object damage. Coordinate with safety officer before restart.",                                                                                   priority: "critical", suggestedRoles: ["maintenance","safety","head"] },
  "Misalignment":       { title: "Belt Tracking & Alignment Correction", description: "Check belt tracking across all idler sets. Adjust training idlers as needed. Inspect pulley lagging and crown. Verify structural frame alignment. Log vibration readings before and after.",                                                                                priority: "medium",   suggestedRoles: ["maintenance","electrical"] },
  "General Maintenance":{ title: "Scheduled Preventive Maintenance",    description: "Full belt inspection per PM checklist. Lubricate all bearings. Check belt tension and sag. Inspect scrapers and cleaners. Verify all sensors are calibrated and reading correctly.",                                                                                         priority: "medium",   suggestedRoles: ["maintenance","quality"] },
};

type Channel = "whatsapp"|"email"|"sms"|"jira"|"servicenow"|"maximo";
const CHANNELS: { id: Channel; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { id: "whatsapp",   label: "WhatsApp",   icon: MessageSquare, color: "#25D366", description: "Instant message via WhatsApp" },
  { id: "email",      label: "Email",      icon: Mail,          color: "#3b82f6", description: "Send formal email notification" },
  { id: "sms",        label: "SMS",        icon: Phone,         color: "#8b5cf6", description: "Text message to mobile" },
  { id: "jira",       label: "Jira",       icon: Ticket,        color: "#0052CC", description: "Create Jira maintenance ticket" },
  { id: "servicenow", label: "ServiceNow", icon: ClipboardList, color: "#62d84e", description: "Raise ServiceNow work order" },
  { id: "maximo",     label: "IBM Maximo", icon: Settings,      color: "#f59e0b", description: "Create Maximo work order" },
];

const ROLE_META: Record<Engineer["role"], { label: string; icon: React.ElementType; color: string }> = {
  head:        { label: "Head Engineer",      icon: Star,          color: "#f59e0b" },
  maintenance: { label: "Maintenance",        icon: Wrench,        color: "#27a372" },
  quality:     { label: "Quality Control",    icon: Shield,        color: "#3b82f6" },
  service:     { label: "Field Service",      icon: HardHat,       color: "#8b5cf6" },
  thermal:     { label: "Thermal Specialist", icon: Thermometer,   color: "#ef4444" },
  electrical:  { label: "Electrical",         icon: Zap,           color: "#f59e0b" },
  safety:      { label: "HSE Safety",         icon: AlertTriangle, color: "#f97316" },
};

interface SentTicket {
  id: string; engineerId: string; engineerName: string;
  channel: Channel; taskTitle: string; priority: string;
  sentAt: Date; ticketRef: string;
}

// ── Tagged issue types ─────────────────────────────────────────────────────────
type TaggedIssue =
  | { kind: "alert";   id: string; label: string; severity: string; beltId?: string }
  | { kind: "vision";  id: string; label: string; defectType: string; position?: string; beltId?: string }
  | { kind: "belt";    id: string; label: string; position: string; beltId: string };

interface WorkOrderAssignmentProps {
  beltName: string; beltId: string;
  anomalyType?: string; nextMaintenanceDays?: number;
}

// ── Tag Picker sub-component ───────────────────────────────────────────────────
function TagPicker({
  currentBeltId,
  tagged,
  onAdd,
  onRemove,
}: {
  currentBeltId: string;
  tagged: TaggedIssue[];
  onAdd: (issue: TaggedIssue) => void;
  onRemove: (id: string) => void;
}) {
  const { data: alerts }     = useAlerts();
  const { data: detections } = useVisionDetections();
  const [tab, setTab]        = useState<"alerts"|"vision"|"belt">("alerts");
  const [search, setSearch]  = useState("");
  const [beltSearch, setBeltSearch] = useState("");
  const [posInput, setPosInput]     = useState("");
  const [open, setOpen]             = useState(false);

  const taggedIds = new Set(tagged.map((t) => t.id));

  const filteredAlerts = useMemo(() => {
    const list = alerts ?? [];
    return list.filter((a) =>
      !taggedIds.has(a.id) &&
      (a.message.toLowerCase().includes(search.toLowerCase()) ||
       a.type.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 8);
  }, [alerts, search, taggedIds]);

  const filteredVision = useMemo(() => {
    const list = detections ?? [];
    return list.filter((d) =>
      !taggedIds.has(d.id) &&
      d.defectType !== "none" &&
      (d.defectType.toLowerCase().includes(search.toLowerCase()) ||
       d.id.toLowerCase().includes(search.toLowerCase()))
    ).slice(0, 8);
  }, [detections, search, taggedIds]);

  const filteredBelts = useMemo(() =>
    BELT_CATALOG.filter((b) =>
      b.id.toLowerCase().includes(beltSearch.toLowerCase()) ||
      b.name.toLowerCase().includes(beltSearch.toLowerCase())
    ).slice(0, 10),
  [beltSearch]);

  const severityColor = (s: string) =>
    s === "critical" ? "#ef4444" : s === "warning" ? "#f59e0b" : "#27a372";

  return (
    <div>
      {/* Tagged chips */}
      {tagged.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tagged.map((t) => {
            const color =
              t.kind === "alert"  ? severityColor((t as any).severity) :
              t.kind === "vision" ? "#8b5cf6" : "#06b6d4";
            const Icon =
              t.kind === "alert"  ? Bell :
              t.kind === "vision" ? Eye  : MapPin;
            return (
              <span
                key={t.id}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{ background: color + "22", color, border: `1px solid ${color}44` }}
              >
                <Icon size={10} />
                {t.label}
                <button onClick={() => onRemove(t.id)} className="ml-0.5 hover:opacity-70">
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Toggle picker */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all"
        style={{ background: "#27a37215", color: "#27a372", border: "1px solid #27a37233" }}
      >
        <Plus size={12} />
        Tag Alert / Vision Issue / Belt Position
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2"
          >
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
            >
              {/* Tabs */}
              <div className="flex border-b" style={{ borderColor: "var(--color-border)" }}>
                {([
                  { id: "alerts", label: "Alerts", icon: Bell },
                  { id: "vision", label: "Vision Detections", icon: Eye },
                  { id: "belt",   label: "Belt Position", icon: MapPin },
                ] as const).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors"
                    style={{
                      color: tab === id ? "#27a372" : "var(--text-muted)",
                      borderBottom: tab === id ? "2px solid #27a372" : "2px solid transparent",
                      background: tab === id ? "#27a37208" : "transparent",
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-3 space-y-2">
                {/* Search */}
                {tab !== "belt" && (
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={tab === "alerts" ? "Search alerts…" : "Search detections…"}
                      className="w-full text-xs pl-7 pr-3 py-1.5 rounded-lg outline-none"
                      style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", color: "var(--text-primary)" }}
                    />
                  </div>
                )}

                {/* Alerts list */}
                {tab === "alerts" && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredAlerts.length === 0 && (
                      <p className="text-xs text-muted text-center py-3">No untagged alerts</p>
                    )}
                    {filteredAlerts.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => {
                          onAdd({ kind: "alert", id: a.id, label: `${a.type.replace(/_/g," ")} · ${a.severity}`, severity: a.severity, beltId: currentBeltId });
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: severityColor(a.severity) }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-primary truncate">{a.message}</p>
                          <p className="text-[10px] text-muted">{a.type.replace(/_/g," ")} · {new Date(a.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase flex-shrink-0"
                          style={{ background: severityColor(a.severity) + "22", color: severityColor(a.severity) }}
                        >
                          {a.severity}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Vision list */}
                {tab === "vision" && (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredVision.length === 0 && (
                      <p className="text-xs text-muted text-center py-3">No untagged detections</p>
                    )}
                    {filteredVision.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          onAdd({
                            kind: "vision",
                            id: d.id,
                            label: `${d.defectType.replace(/_/g," ")} · ${(d.confidence*100).toFixed(0)}%`,
                            defectType: d.defectType,
                            position: `x:${d.position.x.toFixed(0)} y:${d.position.y.toFixed(0)}`,
                            beltId: currentBeltId,
                          });
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <Eye size={12} className="text-purple-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-primary capitalize">{d.defectType.replace(/_/g," ")}</p>
                          <p className="text-[10px] text-muted">ID: {d.id} · pos ({d.position.x.toFixed(0)}, {d.position.y.toFixed(0)}) · {(d.confidence*100).toFixed(0)}% conf</p>
                        </div>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase flex-shrink-0"
                          style={{ background: d.severity === "high" ? "#ef444422" : d.severity === "medium" ? "#f59e0b22" : "#27a37222", color: d.severity === "high" ? "#ef4444" : d.severity === "medium" ? "#f59e0b" : "#27a372" }}
                        >
                          {d.severity}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Belt position picker */}
                {tab === "belt" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
                      <input
                        value={beltSearch}
                        onChange={(e) => setBeltSearch(e.target.value)}
                        placeholder="Search belt ID or name…"
                        className="w-full text-xs pl-7 pr-3 py-1.5 rounded-lg outline-none"
                        style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", color: "var(--text-primary)" }}
                      />
                    </div>
                    <input
                      value={posInput}
                      onChange={(e) => setPosInput(e.target.value)}
                      placeholder="Position on belt (e.g. 12.5m, Zone 3, Head Pulley)"
                      className="w-full text-xs px-3 py-1.5 rounded-lg outline-none"
                      style={{ background: "var(--color-panel)", border: "1px solid var(--color-border)", color: "var(--text-primary)" }}
                    />
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {filteredBelts.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            if (!posInput.trim()) return;
                            const uid = `${b.id}-${posInput}-${Date.now()}`;
                            onAdd({ kind: "belt", id: uid, label: `${b.id} @ ${posInput}`, position: posInput, beltId: b.id });
                            setPosInput("");
                            setOpen(false);
                          }}
                          disabled={!posInput.trim()}
                          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40"
                        >
                          <MapPin size={12} className="text-cyan-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-primary">{b.name}</p>
                            <p className="text-[10px] text-muted">{b.id} · {b.area}</p>
                          </div>
                          {posInput.trim() && (
                            <span className="text-[10px] text-cyan-500 flex-shrink-0">@ {posInput}</span>
                          )}
                        </button>
                      ))}
                    </div>
                    {!posInput.trim() && (
                      <p className="text-[10px] text-muted text-center">Enter a position above, then click a belt to tag it</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function WorkOrderAssignment({
  beltName, beltId,
  anomalyType = "General Maintenance",
  nextMaintenanceDays = 7,
}: WorkOrderAssignmentProps) {
  const template = TASK_TEMPLATES[anomalyType] ?? TASK_TEMPLATES["General Maintenance"];

  const [taggedIssues, setTaggedIssues]       = useState<TaggedIssue[]>([]);
  const [selectedEngineers, setSelectedEngineers] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels]   = useState<Channel[]>(["whatsapp","email"]);
  const [taskTitle, setTaskTitle]             = useState(template.title);
  const [taskDesc, setTaskDesc]               = useState(template.description);
  const [priority, setPriority]               = useState<"low"|"medium"|"high"|"critical">(template.priority);
  const [dueDate, setDueDate]                 = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + nextMaintenanceDays);
    return d.toISOString().split("T")[0];
  });
  const [sentTickets, setSentTickets]         = useState<SentTicket[]>([]);
  const [sending, setSending]                 = useState(false);
  const [showSent, setShowSent]               = useState(false);
  const [filterRole, setFilterRole]           = useState<Engineer["role"]|"all">("all");
  const [resolvedTicketRef, setResolvedTicketRef] = useState<string | null>(null);

  // When tagged issues change, append a reference line to the description
  const addTag = (issue: TaggedIssue) => {
    setTaggedIssues((prev) => [...prev, issue]);
    const ref =
      issue.kind === "alert"  ? `\n\n[Alert ref: ${issue.id} — ${issue.label}]` :
      issue.kind === "vision" ? `\n\n[Vision detection: ${issue.id} — ${issue.label} at position ${(issue as any).position ?? "unknown"}]` :
                                `\n\n[Belt position: ${(issue as any).beltId} @ ${(issue as any).position}]`;
    setTaskDesc((prev) => prev + ref);
  };

  const removeTag = (id: string) => {
    const issue = taggedIssues.find((t) => t.id === id);
    if (!issue) return;
    setTaggedIssues((prev) => prev.filter((t) => t.id !== id));
    // Remove the appended reference line from description
    const ref =
      issue.kind === "alert"  ? `\n\n[Alert ref: ${issue.id} — ${issue.label}]` :
      issue.kind === "vision" ? `\n\n[Vision detection: ${issue.id} — ${issue.label} at position ${(issue as any).position ?? "unknown"}]` :
                                `\n\n[Belt position: ${(issue as any).beltId} @ ${(issue as any).position}]`;
    setTaskDesc((prev) => prev.replace(ref, ""));
  };

  const toggleEngineer = (id: string) =>
    setSelectedEngineers((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);

  const toggleChannel = (ch: Channel) =>
    setSelectedChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);

  const filteredEngineers = filterRole === "all" ? ENGINEERS : ENGINEERS.filter((e) => e.role === filterRole);

  const priorityColor = { low:"#27a372", medium:"#f59e0b", high:"#f97316", critical:"#ef4444" }[priority];

  const handleSend = async () => {
    if (selectedEngineers.length === 0 || selectedChannels.length === 0) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1400));
    const now = new Date();
    const newTickets: SentTicket[] = [];
    for (const engId of selectedEngineers) {
      const eng = ENGINEERS.find((e) => e.id === engId)!;
      for (const ch of selectedChannels) {
        const prefix = ch==="jira"?"BELT":ch==="servicenow"?"SN":ch==="maximo"?"WO":"MSG";
        newTickets.push({
          id: `${engId}-${ch}-${Date.now()}`,
          engineerId: engId, engineerName: eng.name, channel: ch,
          taskTitle, priority, sentAt: now,
          ticketRef: `${prefix}-${Math.floor(10000+Math.random()*90000)}`,
        });
      }
    }
    setSentTickets((prev) => [...newTickets, ...prev]);
    setResolvedTicketRef(newTickets[0]?.ticketRef ?? null);
    setSending(false); setShowSent(true); setSelectedEngineers([]);
  };

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:"#27a37222" }}>
            <Wrench size={16} style={{ color:"#27a372" }} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-primary">Assign Work Order</h2>
            <p className="text-xs text-muted">{beltName} · {beltId}</p>
          </div>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide"
          style={{ background:priorityColor+"22", color:priorityColor, border:`1px solid ${priorityColor}44` }}>
          {priority} priority
        </span>
      </div>

      {/* ── Tagged Issues ── */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Tag size={13} style={{ color:"#27a372" }} />
          <label className="text-xs font-semibold text-secondary">Tagged Issues</label>
          {taggedIssues.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background:"#27a37222", color:"#27a372" }}>
              {taggedIssues.length}
            </span>
          )}
        </div>
        <TagPicker
          currentBeltId={beltId}
          tagged={taggedIssues}
          onAdd={addTag}
          onRemove={removeTag}
        />
      </div>

      {/* Task details */}
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted mb-1 block">Task Title</label>
          <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
            className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-colors"
            style={{ backgroundColor:"var(--color-surface)", border:"1px solid var(--color-border)", color:"var(--text-primary)" }} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted mb-1 block">Description</label>
          <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={4}
            className="w-full text-sm px-3 py-2 rounded-lg outline-none transition-colors resize-none font-mono"
            style={{ backgroundColor:"var(--color-surface)", border:"1px solid var(--color-border)", color:"var(--text-primary)" }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ backgroundColor:"var(--color-surface)", border:"1px solid var(--color-border)", color:"var(--text-primary)" }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg outline-none"
              style={{ backgroundColor:"var(--color-surface)", border:"1px solid var(--color-border)", color:"var(--text-primary)" }} />
          </div>
        </div>
      </div>

      {/* Channels */}
      <div>
        <label className="text-xs font-medium text-muted mb-2 block">Notify via</label>
        <div className="grid grid-cols-3 gap-2">
          {CHANNELS.map(({ id, label, icon: Icon, color, description }) => {
            const active = selectedChannels.includes(id);
            return (
              <button key={id} onClick={() => toggleChannel(id)} title={description}
                className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-medium transition-all"
                style={{ background:active?color+"22":"var(--color-surface)", border:`1px solid ${active?color+"88":"var(--color-border)"}`, color:active?color:"var(--text-secondary)" }}>
                <Icon size={16} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Engineers */}
      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <label className="text-xs font-medium text-muted">Assign Engineers</label>
          <div className="flex gap-1 flex-wrap">
            {(["all","head","maintenance","quality","service","thermal","electrical","safety"] as const).map((role) => (
              <button key={role} onClick={() => setFilterRole(role)}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-all capitalize"
                style={{ background:filterRole===role?"#27a37222":"var(--color-surface)", border:`1px solid ${filterRole===role?"#27a37288":"var(--color-border)"}`, color:filterRole===role?"#27a372":"var(--text-muted)" }}>
                {role}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filteredEngineers.map((eng) => {
            const selected = selectedEngineers.includes(eng.id);
            const meta = ROLE_META[eng.role];
            const RoleIcon = meta.icon;
            const isSuggested = template.suggestedRoles.includes(eng.role);
            return (
              <motion.button key={eng.id} onClick={() => toggleEngineer(eng.id)} whileTap={{ scale:0.98 }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                style={{ background:selected?"#27a37215":"var(--color-surface)", border:`1px solid ${selected?"#27a37266":"var(--color-border)"}` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative"
                  style={{ background:meta.color+"33", color:meta.color }}>
                  {eng.avatar}
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${eng.available?"bg-green-500":"bg-red-500"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-primary">{eng.name}</span>
                    {isSuggested && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background:"#27a37222", color:"#27a372" }}>SUGGESTED</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <RoleIcon size={10} style={{ color:meta.color }} />
                    <span className="text-[11px] text-muted">{eng.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor:"var(--color-border)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width:`${eng.currentLoad}%`, backgroundColor:eng.currentLoad>80?"#ef4444":eng.currentLoad>60?"#f59e0b":"#27a372" }} />
                    </div>
                    <span className="text-[10px] text-muted w-8 text-right">{eng.currentLoad}%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0 text-muted">
                  <span className="text-[10px]">{eng.phone}</span>
                  <span className="text-[10px] truncate max-w-[120px]">{eng.email}</span>
                </div>
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                  style={{ background:selected?"#27a372":"var(--color-border)", border:`1px solid ${selected?"#27a372":"var(--color-border)"}` }}>
                  {selected && <CheckCircle2 size={12} className="text-white" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Send */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-muted">
          {selectedEngineers.length} engineer{selectedEngineers.length!==1?"s":""} · {selectedChannels.length} channel{selectedChannels.length!==1?"s":""}
          {selectedEngineers.length>0&&selectedChannels.length>0&&(
            <span className="text-brand-500 ml-1">→ {selectedEngineers.length*selectedChannels.length} notification{selectedEngineers.length*selectedChannels.length!==1?"s":""}</span>
          )}
          {taggedIssues.length>0&&(
            <span className="text-purple-500 ml-1">· {taggedIssues.length} issue{taggedIssues.length!==1?"s":""} tagged</span>
          )}
        </p>
        <button onClick={handleSend}
          disabled={selectedEngineers.length===0||selectedChannels.length===0||sending}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
          style={{ background:"linear-gradient(135deg,#27a372,#1a835c)" }}>
          {sending ? (
            <><motion.div animate={{ rotate:360 }} transition={{ duration:1,repeat:Infinity,ease:"linear" }}><Settings size={14}/></motion.div>Sending…</>
          ) : (
            <><Send size={14}/>Send Work Order</>
          )}
        </button>
      </div>

      {/* Sent log */}
      <AnimatePresence>
        {sentTickets.length>0&&(
          <motion.div initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:"auto" }} exit={{ opacity:0,height:0 }} className="overflow-hidden">
            <div className="rounded-xl p-3 space-y-2" style={{ background:"var(--color-surface)", border:"1px solid var(--color-border)" }}>
              <button onClick={() => setShowSent((v)=>!v)} className="w-full flex items-center justify-between text-xs font-semibold text-secondary">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} style={{ color:"#27a372" }}/>
                  Sent Notifications ({sentTickets.length})
                </span>
                {showSent?<ChevronUp size={13}/>:<ChevronDown size={13}/>}
              </button>
              <AnimatePresence>
                {showSent&&(
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-1.5 pt-1">
                    {sentTickets.map((t) => {
                      const ch = CHANNELS.find((c)=>c.id===t.channel)!;
                      const ChIcon = ch.icon;
                      const pColor = { low:"#27a372",medium:"#f59e0b",high:"#f97316",critical:"#ef4444" }[t.priority]??"#27a372";
                      return (
                        <div key={t.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                          style={{ background:"var(--color-panel)", border:"1px solid var(--color-border)" }}>
                          <ChIcon size={13} style={{ color:ch.color }} className="flex-shrink-0"/>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-primary truncate">{t.engineerName}</p>
                            <p className="text-[10px] text-muted truncate">{t.taskTitle}</p>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background:ch.color+"22", color:ch.color }}>{t.ticketRef}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ background:pColor+"22", color:pColor }}>{t.priority}</span>
                          <span className="text-[10px] text-muted flex-shrink-0">{t.sentAt.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                        </div>
                      );
                    })}

                    {/* Mark resolved → unlock belt restart */}
                    {resolvedTicketRef && (
                      <div className="mt-2 pt-2 border-t" style={{ borderColor:"var(--color-border)" }}>
                        <p className="text-[11px] text-muted mb-2">
                          Once the engineer has completed the repair, mark the ticket as resolved to unlock belt restart:
                        </p>
                        <button
                          onClick={async () => {
                            await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api'}/plc/clear-gate/ticket`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ ticketRef: resolvedTicketRef, resolvedBy: 'Work Order System' }),
                            });
                            setResolvedTicketRef(null);
                          }}
                          className="w-full py-2 rounded-xl text-xs font-bold text-white transition-all"
                          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                        >
                          ✅ Mark {resolvedTicketRef} as Resolved → Unlock Belt Restart
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
