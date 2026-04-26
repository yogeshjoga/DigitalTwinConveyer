import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown, ChevronRight, Search, LayoutDashboard, Box,
  Eye, Brain, Bell, ClipboardList, Video, Activity,
  Thermometer, Gauge, Settings, HelpCircle, Zap,
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
}

const SECTIONS: Section[] = [
  {
    icon: LayoutDashboard, color: '#27a372',
    title: 'Dashboard',
    description: 'The main overview page showing live KPIs for the selected belt.',
    steps: [
      'Select a belt from the top-left dropdown — all values update instantly.',
      'The 6 KPI cards show Belt Health %, Speed, Load, Temperature, Remaining Life, and Active Alerts.',
      'The Load Trend chart shows 30 minutes of UDL history. Hover for exact values.',
      'The two gauges show Health and Tear Risk. Red = critical, amber = warning, green = ok.',
      'Risk bars show Tear, Burst, Overheat, and Misalignment probabilities from the ML model.',
      'Click "Download Report" → Export PDF or Export Excel/CSV for audit reports.',
    ],
    faqs: [
      { q: 'Why do values change when I switch belts?', a: 'Each belt has different material, area, and operating characteristics. The dashboard applies belt-specific modifiers (temperature offsets, load multipliers, vibration factors) on top of the live sensor baseline.' },
      { q: 'What does Belt Health % mean?', a: 'It is a composite score (0–100) calculated from load stress, temperature stress, vibration stress, and active critical alerts. 80%+ is healthy, 50–79% is warning, below 50% is critical.' },
    ],
  },
  {
    icon: Box, color: '#3b82f6',
    title: 'Digital Twin',
    description: 'Interactive 3D visualization of the conveyor belt with live overlays.',
    steps: [
      'Use the camera preset buttons at the bottom to switch between Perspective, Front, Side, Top, and Bottom views.',
      'Drag to orbit, scroll to zoom, right-click to pan.',
      'Toggle Thermal, Material, and Defects overlays using the buttons in the top-right.',
      'Use the Material Load slider to simulate different load levels and see the 3D model update.',
      'Click any defect marker (pulsing ring with label) to jump directly to the Vision page for that detection.',
    ],
    faqs: [
      { q: 'How do I click a defect in the 3D view?', a: 'Hover over any labeled defect marker — it will glow and show "🔍 Click for details". Click it to open the full detection detail panel on the Vision page.' },
      { q: 'Can I load my own 3D model?', a: 'Yes. Place your exported .glb file at frontend/public/models/conveyor_belt.glb and update ConveyorBelt.tsx to load it via useGLTF(). All overlays and presets will continue to work.' },
    ],
  },
  {
    icon: Eye, color: '#a855f7',
    title: 'Computer Vision',
    description: 'AI-powered defect detection with real images and exact physical locations.',
    steps: [
      'The 4 category cards at the top show counts for Tear, Hole, Edge Damage, and Layer Peeling.',
      'Use the filter tabs and severity pills to narrow down detections.',
      'Click any detection card to open the full detail panel (slides in from the right).',
      'The detail panel has 3 tabs: Overview & Location, Fix Actions & AI Suggestions, Assign Work Order.',
      'The "Exact Location" block shows distance from head end, tail end, left edge, and right edge in metres.',
      'The "Walk-to instruction" tells the engineer exactly where to go on the belt.',
      'Use the camera feeds at the bottom — click "View" to activate, hover for "Full Screen" to expand.',
    ],
    faqs: [
      { q: 'What does the Exact Location block show?', a: 'It converts the normalised detection coordinates to real physical measurements: distance from the head pulley (e.g. 42.3m), distance from the tail, distance from the left belt edge, and the defect width span.' },
      { q: 'How do I assign a work order from a detection?', a: 'Click the detection card → go to the "Assign Work Order" tab → select engineers and notification channels → click Send Work Order.' },
    ],
  },
  {
    icon: Video, color: '#f59e0b',
    title: 'Video Analytics',
    description: 'Search historical defect events using natural language and jump to video timestamps.',
    steps: [
      'Type a natural language query like "coal belt yesterday 4pm holes" or "iron ore high severity tears".',
      'The parser extracts belt name, date, hour, defect type, and severity automatically.',
      'Use the example chips below the search box to try pre-built queries.',
      'Use Advanced Filters for precise date, hour range, defect type, severity, and belt selection.',
      'Click any frame card to open the video player on the right — it auto-seeks to that timestamp.',
      'The video player shows the exact event timestamp, camera ID, and CCTV overlays.',
      'The "Exact Physical Location" block in the player shows where on the belt the defect was.',
    ],
    faqs: [
      { q: 'What natural language queries work?', a: 'Belt names (coal belt, iron ore belt, sinter belt), dates (yesterday, today, last hour), times (4pm, 16:00), defect types (tear, hole, edge damage, peeling), and severity (high, critical, warning, low).' },
      { q: 'Why does the video always show the same footage?', a: 'The video is a demo recording (front_view.mp4). In production, each event would link to the actual recorded segment from the camera system. The timestamp seek simulates this behaviour.' },
    ],
  },
  {
    icon: Brain, color: '#ef4444',
    title: 'ML Prediction',
    description: 'Physics-informed machine learning predictions for belt health and risk.',
    steps: [
      'The Anomaly Forecast cards show predicted days until each risk event with probability %.',
      'The Belt Life Timeline shows remaining life vs. the 2000h total lifespan.',
      'The 4 gauge charts show Remaining Life %, Tear Risk %, Burst Risk %, and Overheat Risk %.',
      'Smart Insights at the bottom gives auto-generated maintenance recommendations.',
      'The ML service runs every 10 seconds, fetching live sensor data and running the predictor.',
    ],
    faqs: [
      { q: 'What model is used for predictions?', a: 'A physics-informed rule-based predictor that uses weighted degradation factors (load, temperature, vibration, UDL, speed). Replace the predict() method in ml-service/models/belt_predictor.py with a trained scikit-learn or PyTorch model when data is available.' },
      { q: 'What happens if the ML service is offline?', a: 'The frontend falls back to realistic mock prediction data automatically. All pages continue to work.' },
    ],
  },
  {
    icon: Bell, color: '#f97316',
    title: 'Alerts',
    description: 'Auto-generated threshold alerts with quick work order assignment.',
    steps: [
      'Alerts are auto-generated when sensor readings exceed thresholds (load > 480kg, temp > 80°C, vibration > 10mm/s).',
      'Filter by severity: All, Critical, Warning, Info.',
      'Click "Assign" on any unacknowledged alert to open the Quick Assign drawer.',
      'The drawer pre-fills the task title, description, and priority based on the alert type.',
      'Select engineers and notification channels, then click Send Work Order.',
      'Click "Ack" to acknowledge an alert and remove it from the active list.',
    ],
    faqs: [
      { q: 'How are alerts generated?', a: 'The backend simulator checks sensor readings every 2 seconds. When load > 480kg, temperature > 80°C, or vibration > 10mm/s, it creates an alert. Vision detections with high severity also generate tear_risk alerts.' },
    ],
  },
  {
    icon: ClipboardList, color: '#27a372',
    title: 'Work Orders',
    description: 'Assign maintenance tasks to engineers via multiple notification channels.',
    steps: [
      'The task title and description are auto-populated from the highest-probability anomaly.',
      'Use the "Tag Alert / Vision Issue / Belt Position" picker to attach specific issues to the work order.',
      'Select notification channels: WhatsApp, Email, SMS, Jira, ServiceNow, or IBM Maximo.',
      'Filter engineers by role: Head, Maintenance, Quality, Service, Thermal, Electrical, Safety.',
      'Engineers marked SUGGESTED match the anomaly type. Green dot = available, red = busy.',
      'The workload bar shows current load % — prefer engineers below 60%.',
      'After sending, a collapsible log shows all ticket references.',
    ],
    faqs: [
      { q: 'Are the notifications actually sent?', a: 'This is a demo — notifications are simulated and ticket references are generated locally. In production, connect the channel buttons to real APIs (WhatsApp Business API, SMTP, Jira REST API, ServiceNow API, Maximo REST API).' },
    ],
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
          <p className="text-sm font-bold text-primary">{section.title}</p>
          <p className="text-xs text-muted truncate">{section.description}</p>
        </div>
        <ChevronDown size={16} className="text-muted flex-shrink-0 transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
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
              {/* Steps */}
              <div className="pt-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">How to use</p>
                {section.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5 text-white"
                      style={{ background: section.color }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-sm text-secondary leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>

              {/* FAQs */}
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
                          <motion.div
                            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
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
          <p className="text-secondary text-sm mt-0.5">Step-by-step guides for every feature</p>
        </div>
      </div>

      {/* Quick start */}
      <div className="p-5 rounded-2xl space-y-3"
        style={{ background: 'linear-gradient(135deg, #27a37212, #3b82f608)', border: '1px solid #27a37233' }}>
        <div className="flex items-center gap-2">
          <Zap size={15} style={{ color: '#27a372' }} />
          <p className="text-sm font-bold text-primary">Quick Start</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: '1', text: 'Select a belt from the top-left dropdown to monitor it across all pages.' },
            { step: '2', text: 'Check the Dashboard for live KPIs, then visit ML Prediction for risk forecasts.' },
            { step: '3', text: 'When a defect is detected in Vision, click it to assign a work order instantly.' },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-2.5 p-3 rounded-xl"
              style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
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

      {/* Footer note */}
      <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
        <p className="text-xs text-muted">
          Need more help? Check the <strong className="text-primary">README.md</strong> in the project root for full API documentation, architecture diagrams, and developer guides.
        </p>
      </div>
    </div>
  );
}
