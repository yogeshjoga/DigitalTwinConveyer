import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Search, LayoutDashboard, Box,
  Eye, Brain, Bell, ClipboardList, Video, Activity,
  Thermometer, Gauge, Settings, HelpCircle, Zap, Cpu,
  Home, Film, AlertOctagon, Power, ToggleRight, BellRing,
} from 'lucide-react';
import dtcLogo from '@/assets/DTC_LOGO.png';

interface FAQItem { q: string; a: string }
interface Section {
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
  steps: string[];
  faqs: FAQItem[];
  isNew?: boolean;
}

const SECTIONS: Section[] = [
  {
    icon: Home, color: '#27a372', isNew: true,
    title: 'Fleet Overview (Main Dashboard)',
    description: 'The landing page — all 44 belts at a glance with defect counts, severity breakdown, and mini sparklines.',
    steps: [
      'Open the app — you land here automatically. The logo in the sidebar also returns you here from any page.',
      'The 6 KPI cards at the top show fleet-wide totals: Total Belts, Active Defects, Critical / Medium / Low counts, and System Alerts.',
      'The "Defect Categories" panel breaks down Tear, Hole, Edge Damage, and Layer Peeling across all belts with severity splits and fill bars.',
      'The "Live Sensor Snapshot" row shows the 6 live sensor readings with color-coded thresholds.',
      'Belts are grouped by plant area (Raw Material, Coal & Coke, Sinter, Blast Furnace, etc.) with area headers showing defect counts.',
      'Each belt card shows: name, ID, severity pills (high/medium/low), top defect type tags, and a 12-hour sparkline.',
      'Click any belt card → that belt is selected and you are taken to the Belt Dashboard for deep stats.',
    ],
    faqs: [
      { q: 'How is the Fleet Overview different from the Belt Dashboard?', a: 'Fleet Overview shows all 44 belts simultaneously at a high level — defect counts, severity, sparklines. Belt Dashboard shows deep per-belt stats: live KPIs, 30-min load trend chart, health gauge, risk bars, and alerts for the selected belt only.' },
      { q: 'How do I switch back to Fleet Overview?', a: 'Click the DigitalTwin logo at the top of the sidebar, or click "Fleet Overview" in the sidebar nav. Both navigate to the root path (/).' },
    ],
  },
  {
    icon: LayoutDashboard, color: '#3b82f6',
    title: 'Belt Dashboard',
    description: 'Deep per-belt stats — live KPIs, scrollable load trend chart, health gauges, risk analysis.',
    steps: [
      'Select a belt from the top-bar dropdown — all values update instantly for that belt.',
      'The 6 KPI cards show Belt Health %, Speed, Load, Temperature, Remaining Life, and Active Alerts.',
      'The Load Trend chart is a Grafana-style scrollable chart. Scroll left to explore history, zoom ± to adjust density.',
      'The chart shows LIVE (green pulse) when the belt is running, STOPPED (red) when the belt is halted.',
      'The two gauges show Health and Tear Risk. Red = critical, amber = warning, green = ok.',
      'Risk bars show Tear, Burst, Overheat, and Misalignment probabilities from the ML model.',
      'Click "Clear Defects" (top right) to reset all vision detections and unlock the belt restart gate.',
      'Click "Download Report" → Export PDF or Export Excel/CSV for audit reports.',
    ],
    faqs: [
      { q: 'Why does the chart show STOPPED and freeze?', a: 'When the PLC stops the belt (auto-rule or manual), the simulator stops generating new sensor readings. The chart freezes at the last real reading and shows a red STOPPED overlay. This is physically accurate — a static belt produces no new data.' },
      { q: 'Why do values change when I switch belts?', a: 'Each belt has different material, area, and operating characteristics. The dashboard applies belt-specific modifiers (temperature offsets, load multipliers, vibration factors) on top of the live sensor baseline.' },
    ],
  },
  {
    icon: Box, color: '#8b5cf6',
    title: 'Digital Twin',
    description: 'Interactive 3D belt model with live overlays, E-Stop button, and PLC-linked animation.',
    steps: [
      'The 3D belt animates at the live belt speed. When the PLC stops the belt, the animation freezes and materials stop moving.',
      'A red "Belt Stopped — 3D Model Frozen" banner appears when the belt is halted, with "Assign Worker" and "Restart Belt" buttons.',
      'Use the E-STOP button (top right of the 3D canvas) to trigger an emergency stop from the Digital Twin. Requires two-step confirm.',
      'Use the camera preset buttons at the bottom to switch between Perspective, Front, Side, Top, and Bottom views.',
      'Toggle Thermal, Material, and Defects overlays using the buttons in the top-right.',
      'Use the Material Load slider to simulate different load levels — the 3D particle system updates in real time.',
      'The belt running status indicator (top center) shows BELT RUNNING (green) or BELT STOPPED (red).',
    ],
    faqs: [
      { q: 'Why did the 3D model freeze?', a: 'The PLC auto-rule engine detected a sustained critical condition (e.g. load > 480 kg for 10 minutes, or 2+ high-severity vision defects in 10 minutes) and triggered an E-Stop. The 3D animation is linked to the PLC state — when the belt is stopped, all animations halt.' },
      { q: 'How do I restart the belt from Digital Twin?', a: 'Click "Restart Belt" in the red banner. This only works if the restart gate has been cleared — either by resolving a work order ticket or clearing all defects. If the gate is still active, the button will be blocked.' },
    ],
  },
  {
    icon: Cpu, color: '#ef4444', isNew: true,
    title: 'PLC / HMI Control Panel',
    description: 'Real-time belt control — start/stop, speed, interlocks, auto-response rules, and restart gate.',
    steps: [
      'The Belt State Banner shows the current PLC state: RUNNING (green), STOPPED (grey), E-STOP (red), STARTING (amber), etc.',
      'Use START BELT / STOP BELT buttons for normal operation. EMERGENCY STOP requires a two-step confirm to prevent accidents.',
      'The Speed Control panel has a slider (0.5–6.0 m/s) and preset buttons. Speed changes only apply when the belt is running.',
      'Motor Status cards show RPM, current draw (kW), and winding temperature for each motor.',
      'Safety Interlocks show OK (green) or TRIPPED (red). Tripped interlocks that have "Prevents start" block the START button.',
      'Auto-Response Rules: each rule has an IF condition → THEN action. Click "Edit" to change the threshold, cooldown, or reduce-speed target.',
      'Toggle rules on/off with the toggle switch. Disabled rules are shown at 55% opacity.',
      'The Command Audit Log records every command with operator, timestamp, value, reason, and accepted/rejected status.',
    ],
    faqs: [
      { q: 'Why is START BELT greyed out and shows "RESTART BLOCKED"?', a: 'The belt was stopped by an auto-rule. A restart gate is active. You must either: (1) resolve the work order ticket and enter the ticket reference in the "Option 1" panel, or (2) clear all defects using the "Option 2 — Clear Defects & Unlock" button. Both options are shown in the red restart gate banner.' },
      { q: 'When does the belt auto-stop?', a: 'Auto-stop rules require the condition to be sustained for 10 minutes before stopping. On first detection you get a warning notification. After 10 minutes of continuous condition, the belt stops. Vision defects require 2+ high-severity detections within 10 minutes.' },
      { q: 'What are the default auto-stop thresholds?', a: 'Load Cell > 480 kg sustained 10 min → E-Stop. Impact Force > 40 kN sustained 10 min → E-Stop. 2+ high-severity vision detections in 10 min → E-Stop. UDL > 420 kg/m → Reduce speed to 1.5 m/s. Temperature > 100°C sustained 10 min → Stop.' },
    ],
  },
  {
    icon: BellRing, color: '#f59e0b', isNew: true,
    title: 'Notifications (Bell Icon)',
    description: 'Unified notification center — PLC auto-rule events and system alerts in one bell button.',
    steps: [
      'Click the bell icon in the top-right of the header to open the notification panel.',
      'The badge shows the total unread count (PLC notifications + system alerts combined).',
      'The panel has two tabs: "PLC / Auto-Rules" for belt control events, and "System Alerts" for sensor threshold alerts.',
      'PLC notifications appear automatically when: a condition is first detected (warning), every 2 minutes while active (monitoring), and when the belt stops (critical).',
      'Toast popups appear bottom-right for new PLC events — they auto-dismiss after 8 seconds with a progress bar.',
      'Each toast shows: severity badge, title, message, timestamp, and "📢 All workers notified".',
      'Click "Mark all read" to clear the unread badge. Seen notifications are remembered across page refreshes (sessionStorage).',
      'Click any system alert row to navigate to the Alerts page.',
    ],
    faqs: [
      { q: 'Why do I see multiple notifications at once?', a: 'Each auto-rule fires independently. If multiple conditions are active simultaneously (e.g. high load AND high temperature), each generates its own notification. The toast stack shows up to 3 at once.' },
      { q: 'Will notifications re-appear after I refresh the page?', a: 'No. Seen notification IDs are stored in sessionStorage. Refreshing the page will not re-show notifications you have already seen in this browser session.' },
    ],
  },
  {
    icon: Activity, color: '#06b6d4',
    title: 'Sensors',
    description: 'Live scrollable charts for all 6 sensor channels with belt-stop freeze.',
    steps: [
      'The 4 KPI cards at the top show live values for Load Cell, Temperature, Vibration, and Belt Speed.',
      'Each sensor has its own scrollable chart. Scroll left to explore history, zoom ± to adjust point density.',
      'When the belt is stopped, all charts show a red STOPPED overlay and freeze at the last reading.',
      'The "All Sensors — Normalised Overlay" chart shows all 4 sensors scaled 0–1 against their critical threshold for comparison.',
      'The Latest Reading table at the bottom shows current values, warn/crit thresholds, and status badges.',
    ],
    faqs: [
      { q: 'Why are the charts empty when I first open the page?', a: 'Charts load historical data on first render. If the belt is stopped, the chart shows the last readings before the stop. If no data has been generated yet (fresh start), wait a few seconds for the first sensor readings to arrive.' },
    ],
  },
  {
    icon: Gauge, color: '#8b5cf6',
    title: 'Load Analysis',
    description: 'Physics-based load modeling with scrollable UDL and impact force charts.',
    steps: [
      'The 4 KPI cards show Point Load (kN), UDL (kg/m), Peak Stress (MPa), and Mass Flow Rate (kg/s).',
      'Material Drop Physics panel shows Drop Height, Impact Velocity (v = √2gH), Deposition Rate, and Impact Force.',
      'The UDL Trend and Load Cell vs Impact Force charts are side-by-side scrollable charts.',
      'Both charts freeze with a STOPPED overlay when the belt is halted.',
      'Engineering Constraints table shows current values vs. allowed ranges.',
    ],
    faqs: [],
  },
  {
    icon: Eye, color: '#a855f7',
    title: 'Computer Vision',
    description: 'AI defect detection with E-Stop and Assign buttons on each detection card.',
    steps: [
      'The 4 category cards show counts for Tear, Hole, Edge Damage, and Layer Peeling.',
      'Use filter tabs and severity pills to narrow down detections.',
      'Each detection card has an E-STOP button (red for high, amber for medium severity) — clicking it stops the belt immediately and records the reason.',
      'Each card also has an "Assign" button that navigates to Work Orders to assign a maintenance engineer.',
      'Click any card to open the full detail panel with exact physical location (distance from head, tail, left edge, right edge).',
      'The "Walk-to instruction" tells the engineer exactly where to go on the belt.',
    ],
    faqs: [
      { q: 'What happens when I click E-STOP on a detection card?', a: 'The belt stops immediately via the PLC command, the stop reason is recorded as "Vision: [defect type] detected ([confidence]% confidence)", and the restart gate is activated. The belt cannot restart until a work order ticket is resolved or defects are cleared.' },
    ],
  },
  {
    icon: Film, color: '#f59e0b',
    title: 'Video Analytics',
    description: 'Natural language search across 48h of detection history with compact result cards.',
    steps: [
      'Type a natural language query like "coal belt yesterday 4pm holes" or "iron ore high severity tears".',
      'Use Advanced Filters for precise date, hour range, defect type, severity, and belt selection.',
      'Results show as compact cards (5 per row on large screens) with image, severity pills, defect tags, and a compact location line.',
      'Click any card to open the video player modal — it auto-seeks to that timestamp.',
      'The Live Camera Views section shows 4 camera feeds — click "Full Screen" to expand any video.',
    ],
    faqs: [
      { q: 'What natural language queries work?', a: 'Belt names (coal belt, iron ore belt, sinter belt), dates (yesterday, today, last hour), times (4pm, 16:00), defect types (tear, hole, edge damage, peeling), and severity (high, critical, warning, low).' },
    ],
  },
  {
    icon: Brain, color: '#ef4444',
    title: 'ML Prediction',
    description: 'Physics-informed predictions for belt health, risk, and anomaly forecasts.',
    steps: [
      'The Anomaly Forecast cards show predicted days until each risk event with probability %.',
      'The Belt Life Timeline shows remaining life vs. the 2000h total lifespan.',
      'The 4 gauge charts show Remaining Life %, Tear Risk %, Burst Risk %, and Overheat Risk %.',
      'Smart Insights at the bottom gives auto-generated maintenance recommendations.',
      'The ML service runs every 10 seconds. If offline, realistic mock data is shown automatically.',
    ],
    faqs: [
      { q: 'What happens if the ML service is offline?', a: 'The frontend falls back to realistic mock prediction data automatically. All pages continue to work.' },
    ],
  },
  {
    icon: Bell, color: '#f97316',
    title: 'Alerts',
    description: 'Auto-generated threshold alerts with quick work order assignment.',
    steps: [
      'Alerts are auto-generated when sensor readings exceed thresholds (load > 480 kg, temp > 80°C, vibration > 10 mm/s).',
      'PLC auto-rule events also generate alerts (condition detected, monitoring reminders, belt stopped).',
      'Filter by severity: All, Critical, Warning, Info.',
      'Click "Assign" on any alert to open the Quick Assign drawer.',
      'Click "Ack" to acknowledge an alert and remove it from the active list.',
    ],
    faqs: [],
  },
  {
    icon: ClipboardList, color: '#27a372',
    title: 'Work Orders',
    description: 'Assign maintenance tasks to engineers. Resolving a ticket unlocks belt restart.',
    steps: [
      'The task title and description are auto-populated from the highest-probability anomaly.',
      'Tag alerts, vision detections, or belt positions using the Tag Picker.',
      'Select notification channels: WhatsApp, Email, SMS, Jira, ServiceNow, or IBM Maximo.',
      'Filter engineers by role. SUGGESTED badge highlights engineers matching the anomaly type.',
      'After sending, a ticket reference is generated (e.g. BELT-12345).',
      'If the belt was stopped by an auto-rule, a "Mark as Resolved → Unlock Belt Restart" button appears in the sent log.',
      'Clicking that button calls the PLC clear-gate API — the belt can now be restarted from the PLC page.',
    ],
    faqs: [
      { q: 'How does resolving a ticket unlock the belt?', a: 'When you click "Mark as Resolved", the system calls POST /api/plc/clear-gate/ticket with the ticket reference. This sets restartGated = false on the PLC state. A notification is sent to all workers: "Restart Cleared — Ticket Resolved". The belt can then be started from the PLC page.' },
    ],
  },
  {
    icon: Thermometer, color: '#f97316',
    title: 'Thermal',
    description: 'Zone-by-zone temperature mapping with friction index and hotspot detection.',
    steps: [
      'The heat map canvas shows temperature across all 10 idler zones along the belt.',
      'Zones exceeding 80°C are marked Critical (red), 60–80°C Warning (amber), below 60°C Normal (green).',
      'The friction index bar per zone shows bearing wear level (0 = new, 1 = critical).',
      'Thermal data updates every 5 seconds.',
    ],
    faqs: [],
  },
  {
    icon: Settings, color: '#64748b',
    title: 'Belt Config',
    description: 'View and edit physical belt parameters for all 45 configured belts.',
    steps: [
      'View all belt configurations: width, thickness, length, speed, material type, tensile strength, hardness, elastic modulus.',
      'Click Edit on any belt to modify its parameters.',
      'Create new belt configurations using the form at the bottom.',
      'Changes are persisted in the backend in-memory store (restart resets to defaults).',
    ],
    faqs: [],
  },
];

function SectionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const Icon = section.icon;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-black/3 dark:hover:bg-white/3"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: section.color + '22' }}>
          <Icon size={17} style={{ color: section.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-primary">{section.title}</p>
            {section.isNew && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                style={{ background: '#27a37222', color: '#27a372', border: '1px solid #27a37244' }}>
                New
              </span>
            )}
          </div>
          <p className="text-xs text-muted truncate">{section.description}</p>
        </div>
        <ChevronDown size={16} className="text-muted flex-shrink-0 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className="pt-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">How to use</p>
                {section.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 text-white"
                      style={{ background: section.color }}>
                      {i + 1}
                    </span>
                    <p className="text-sm text-secondary leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {section.faqs.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">FAQ</p>
                  {section.faqs.map((faq, i) => (
                    <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                      <button
                        onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                        className="w-full flex items-center gap-2 px-4 py-3 text-left"
                      >
                        <HelpCircle size={13} style={{ color: section.color }} className="flex-shrink-0" />
                        <span className="text-sm font-medium text-primary flex-1">{faq.q}</span>
                        <ChevronRight size={13} className="text-muted flex-shrink-0 transition-transform"
                          style={{ transform: faqOpen === i ? 'rotate(90deg)' : 'rotate(0deg)' }} />
                      </button>
                      <AnimatePresence>
                        {faqOpen === i && (
                          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                            <p className="px-4 pb-3 text-sm text-secondary leading-relaxed" style={{ borderTop: '1px solid var(--color-border)' }}>
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HelpPage() {
  const [search, setSearch] = useState('');

  const filtered = SECTIONS.filter((s) =>
    search === '' ||
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase()) ||
    s.steps.some((st) => st.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <img src={dtcLogo} alt="DTC Logo" className="w-12 h-12 rounded-xl object-contain flex-shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-primary">Help & Documentation</h1>
          <p className="text-secondary text-sm mt-0.5">Step-by-step guides for every feature — including new PLC, Fleet Overview, and notification system</p>
        </div>
      </div>

      {/* What's new banner */}
      <div className="p-4 rounded-2xl space-y-2"
        style={{ background: 'linear-gradient(135deg, #27a37212, #3b82f608)', border: '1px solid #27a37233' }}>
        <div className="flex items-center gap-2">
          <Zap size={14} style={{ color: '#27a372' }} />
          <p className="text-sm font-bold text-primary">What's New</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { icon: Home,         color: '#27a372', text: 'Fleet Overview — all 44 belts on one page with sparklines and defect counts' },
            { icon: Cpu,          color: '#ef4444', text: 'PLC / HMI — real belt control with start/stop, speed, interlocks, auto-rules' },
            { icon: AlertOctagon, color: '#f59e0b', text: '10-min sustained condition gate — belt only stops after 10 min of critical readings' },
            { icon: Power,        color: '#22c55e', text: 'Restart gate — belt restart requires resolved ticket OR cleared defects' },
            { icon: ToggleRight,  color: '#3b82f6', text: 'Editable auto-rules — change thresholds, cooldowns, and actions from the PLC page' },
            { icon: BellRing,     color: '#a855f7', text: 'Unified bell — PLC events + system alerts in one notification center' },
          ].map(({ icon: Icon, color, text }) => (
            <div key={text} className="flex items-start gap-2 p-2.5 rounded-xl"
              style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
              <Icon size={13} style={{ color }} className="flex-shrink-0 mt-0.5" />
              <p className="text-xs text-secondary leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick start */}
      <div className="p-5 rounded-2xl space-y-3"
        style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Quick Start</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: '1', text: 'Open the app → Fleet Overview shows all belts. Click any belt card to open its Belt Dashboard.' },
            { step: '2', text: 'Check the PLC page to see belt state. If stopped, resolve the work order ticket or clear defects to restart.' },
            { step: '3', text: 'When a defect is detected in Vision, click E-STOP to stop the belt, then Assign to create a work order.' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: '#27a372' }}>{step}</span>
              <p className="text-xs text-secondary leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search help topics…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
          style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted py-8">No help topics match "{search}"</p>
        ) : (
          filtered.map((section) => <SectionCard key={section.title} section={section} />)
        )}
      </div>

      <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs text-muted">
          Need more help? Check the <strong className="text-primary">README.md</strong> in the project root for full API documentation, architecture diagrams, and developer guides.
        </p>
      </div>
    </div>
  );
}
