import dtcLogo from '@/assets/DTC_LOGO.png';
import { motion } from 'framer-motion';
import {
  Brain, Eye, Wrench, BarChart3, Video, ClipboardList,
  Box, Activity, Thermometer, Gauge, Bell, Settings,
  Github, Mail, Globe, Shield, Zap, Clock, Cpu, Home,
  BellRing, Power, ToggleRight,
} from 'lucide-react';

const FEATURES = [
  { icon: Home,         color: '#27a372', title: 'Fleet Overview',            desc: 'Landing page showing all 44 belts with defect counts, severity breakdown (high/medium/low), 12-hour sparklines, and one-click navigation to any belt dashboard.' },
  { icon: BarChart3,    color: '#3b82f6', title: 'Belt Dashboard',            desc: 'Per-belt live KPI monitoring — health, speed, load, temperature, remaining life. Grafana-style scrollable load trend chart that freezes when belt is stopped.' },
  { icon: Box,          color: '#8b5cf6', title: '3D Digital Twin',           desc: 'Interactive Three.js belt model with thermal overlays, defect markers, material flow particles, and 5 camera presets. Animation freezes when PLC stops the belt.' },
  { icon: Cpu,          color: '#ef4444', title: 'PLC / HMI Control',         desc: 'Real-time belt control: start/stop/e-stop, speed setpoint, safety interlocks, motor status. Editable auto-response rules with 10-minute sustained-condition gate before stopping.' },
  { icon: Eye,          color: '#a855f7', title: 'Computer Vision',           desc: 'AI defect detection — tears, holes, edge damage, layer peeling. E-Stop and Assign buttons on each detection card. Exact physical location tags (distance from head, tail, edges).' },
  { icon: Video,        color: '#f59e0b', title: 'Video Analytics',           desc: 'Natural language search across 48h of detection history. Compact 5-per-row result cards. Click any frame to seek the video to that exact timestamp.' },
  { icon: Brain,        color: '#ef4444', title: 'ML Prediction',             desc: 'Physics-informed predictor for remaining belt life, tear/burst/overheat/misalignment risk with anomaly forecasts and smart maintenance insights.' },
  { icon: Thermometer,  color: '#f97316', title: 'Thermal Monitoring',        desc: 'Zone-by-zone temperature mapping with friction index and hotspot detection. Updates every 5 seconds.' },
  { icon: Activity,     color: '#06b6d4', title: 'Sensor Dashboard',          desc: 'Scrollable live charts for all 6 sensor channels. Charts freeze with STOPPED overlay when belt is halted. Normalised overlay for cross-sensor comparison.' },
  { icon: Gauge,        color: '#8b5cf6', title: 'Load Analysis',             desc: 'Point load, UDL, peak stress, impact velocity, mass flow rate. Side-by-side scrollable UDL and impact force charts.' },
  { icon: BellRing,     color: '#f59e0b', title: 'Unified Notifications',     desc: 'Single bell button combining PLC auto-rule events and system alerts. Toast popups for new events. Seen IDs persisted to sessionStorage — no duplicate toasts on refresh.' },
  { icon: Bell,         color: '#f97316', title: 'Alerts',                    desc: 'Auto-generated threshold alerts with one-click work order assignment. PLC condition-detected and belt-stopped events also appear here.' },
  { icon: ClipboardList,color: '#27a372', title: 'Work Orders',               desc: 'Assign tasks to engineers via WhatsApp, Email, SMS, Jira, ServiceNow, IBM Maximo. Resolving a ticket unlocks the PLC restart gate — belt can only restart after ticket resolution or defect clearance.' },
  { icon: Power,        color: '#22c55e', title: 'PLC Restart Gate',          desc: 'When the belt is auto-stopped, restart is blocked until: (1) a work order ticket is marked resolved, or (2) all vision defects are cleared. Enforced at the API level.' },
  { icon: ToggleRight,  color: '#3b82f6', title: 'Editable Auto-Rules',       desc: 'Each PLC auto-rule has an inline editor for threshold, cooldown, and reduce-speed target. Changes take effect immediately on the next simulator tick.' },
  { icon: Settings,     color: '#64748b', title: 'Belt Configuration',        desc: '45 steel-plant belts across 9 areas. Configure physical parameters: width, thickness, length, speed, tensile strength, hardness, elastic modulus.' },
  { icon: Wrench,       color: '#f59e0b', title: 'Engineer Management',       desc: '8 engineers across 7 roles with workload bars, availability status, and SUGGESTED matching to anomaly type.' },
];

const TECH_STACK = [
  { layer: 'Frontend',   items: ['React 18', 'TypeScript 5', 'Vite 5', 'Tailwind CSS 3', 'Framer Motion', 'Three.js / R3F', 'TanStack Query', 'Zustand', 'Chart.js', 'React Router 6', 'Lucide React', 'Axios'] },
  { layer: 'Backend',    items: ['Node.js', 'Express 4', 'TypeScript 5', 'WebSocket (ws)', 'Helmet', 'Morgan', 'UUID', 'CORS'] },
  { layer: 'ML Service', items: ['Python 3.10+', 'FastAPI', 'Pydantic 2', 'scikit-learn', 'LangChain', 'GPT-4o-mini', 'httpx', 'uvicorn'] },
];

const STATS = [
  { icon: Shield,  color: '#27a372', value: '44',    label: 'Belt Types' },
  { icon: Zap,     color: '#3b82f6', value: '6',     label: 'Sensor Channels' },
  { icon: Brain,   color: '#a855f7', value: '10s',   label: 'Prediction Interval' },
  { icon: Clock,   color: '#f59e0b', value: '2s',    label: 'Sensor Refresh' },
  { icon: Cpu,     color: '#ef4444', value: '6',     label: 'PLC Auto-Rules' },
  { icon: Bell,    color: '#f97316', value: '10 min',label: 'Stop Delay Gate' },
];

export default function AboutPage() {
  return (
    <div className="space-y-10 pb-16 max-w-4xl">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6 p-8 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #27a37212, #3b82f612)', border: '1px solid var(--color-border)' }}
      >
        <img src={dtcLogo} alt="DTC Logo" className="w-20 h-20 rounded-2xl object-contain flex-shrink-0 shadow-lg" />
        <div>
          <h1 className="text-3xl font-bold text-primary">DigitalTwin Conveyor Belt</h1>
          <p className="text-secondary mt-1 text-base">
            AI-powered predictive monitoring + PLC control platform for industrial conveyor belt systems
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['v2.0.0', 'React 18', 'FastAPI', 'Three.js', 'PLC/HMI', 'GPT-4o-mini'].map((tag) => (
              <span key={tag} className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: '#27a37222', color: '#27a372', border: '1px solid #27a37244' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* What is this */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-primary">What is DigitalTwin Conveyor Belt?</h2>
        <p className="text-secondary leading-relaxed">
          DigitalTwin Conveyor Belt is a full-stack Industrial IoT platform that creates a real-time digital replica
          of conveyor belt systems used in steel plants, coal handling, and mining operations. It combines live sensor
          telemetry, physics-informed machine learning, computer vision defect detection, a 3D interactive model,
          and a full PLC/HMI control layer to give maintenance engineers complete visibility and control over belt
          health — before failures happen.
        </p>
        <p className="text-secondary leading-relaxed">
          The platform monitors <strong className="text-primary">44 belt types</strong> across{' '}
          <strong className="text-primary">9 plant areas</strong>, generates predictions every 10 seconds,
          enforces a <strong className="text-primary">10-minute sustained-condition gate</strong> before auto-stopping,
          and requires either a resolved work order ticket or cleared defects before the belt can restart.
        </p>
      </section>

      {/* What's new in v2 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-primary">What's New in v2.0</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Home,         color: '#27a372', title: 'Fleet Overview',         desc: 'New landing page showing all 44 belts with defect counts, severity breakdown, and sparklines.' },
            { icon: Cpu,          color: '#ef4444', title: 'PLC / HMI Control',      desc: 'Full belt control panel with start/stop/e-stop, speed, interlocks, motor status, and editable auto-rules.' },
            { icon: Power,        color: '#22c55e', title: 'Restart Gate',           desc: 'Belt restart blocked after auto-stop until work order resolved or defects cleared.' },
            { icon: Clock,        color: '#f59e0b', title: '10-Min Sustained Gate',  desc: 'Critical conditions must persist for 10 minutes before belt stops — prevents transient spike stops.' },
            { icon: BellRing,     color: '#a855f7', title: 'Unified Notifications',  desc: 'Single bell combining PLC events + system alerts. No duplicate toasts on page refresh.' },
            { icon: ToggleRight,  color: '#3b82f6', title: 'Editable Auto-Rules',    desc: 'Change thresholds, cooldowns, and actions from the PLC page UI.' },
            { icon: Activity,     color: '#06b6d4', title: 'Chart Freeze on Stop',   desc: 'All scrollable charts freeze with STOPPED overlay when belt is halted. Data resumes on restart.' },
            { icon: Eye,          color: '#a855f7', title: 'E-Stop from Vision',     desc: 'E-Stop and Assign buttons on each detection card for immediate response.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="flex gap-3 p-3 rounded-xl"
              style={{ backgroundColor: 'var(--color-panel)', border: `1px solid ${color}33` }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: color + '22' }}>
                <Icon size={13} style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">{title}</p>
                <p className="text-xs text-secondary mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-primary">All Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex gap-3 p-4 rounded-xl"
              style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: color + '22' }}>
                <Icon size={15} style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary">{title}</p>
                <p className="text-xs text-secondary mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATS.map(({ icon: Icon, color, value, label }) => (
            <div key={label} className="p-4 rounded-xl text-center"
              style={{ backgroundColor: 'var(--color-panel)', border: `1px solid ${color}33` }}>
              <Icon size={18} className="mx-auto mb-2" style={{ color }} />
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-[10px] text-muted mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-primary">Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TECH_STACK.map(({ layer, items }) => (
            <div key={layer} className="p-4 rounded-xl space-y-2"
              style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{layer}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((item) => (
                  <span key={item} className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--text-secondary)', border: '1px solid var(--color-border)' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="p-6 rounded-2xl space-y-3"
        style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
        <h2 className="text-base font-bold text-primary">Contact & Links</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { icon: Github, label: 'GitHub Repository', href: '#', color: '#333' },
            { icon: Mail,   label: 'dev@digitaltwin.io', href: 'mailto:dev@digitaltwin.io', color: '#3b82f6' },
            { icon: Globe,  label: 'digitaltwin.io', href: '#', color: '#27a372' },
          ].map(({ icon: Icon, label, href, color }) => (
            <a key={label} href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-80"
              style={{ background: color + '18', color, border: `1px solid ${color}33` }}>
              <Icon size={14} />
              {label}
            </a>
          ))}
        </div>
        <p className="text-xs text-muted">
          Built for industrial conveyor belt monitoring in steel, coal, and mining operations. MIT License.
        </p>
      </section>
    </div>
  );
}
