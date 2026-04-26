import dtcLogo from '@/assets/DTC_LOGO.png';
import { motion } from 'framer-motion';
import {
  Brain, Eye, Wrench, BarChart3, Video, ClipboardList,
  Box, Activity, Thermometer, Gauge, Bell, Settings,
  Github, Mail, Globe, Shield, Zap, Clock,
} from 'lucide-react';

const FEATURES = [
  { icon: BarChart3,   color: '#27a372', title: 'Real-time Dashboard',     desc: 'Live KPI monitoring — health, speed, load, temperature, remaining life. Belt-reactive values change per selected belt.' },
  { icon: Box,         color: '#3b82f6', title: '3D Digital Twin',          desc: 'Interactive Three.js belt model with thermal overlays, defect markers, material flow particles, and 5 camera presets.' },
  { icon: Eye,         color: '#a855f7', title: 'Computer Vision',          desc: 'AI-powered defect detection — tears, holes, edge damage, layer peeling. Real images, exact physical location tags, full detail modal.' },
  { icon: Video,       color: '#f59e0b', title: 'Video Analytics',          desc: 'Natural language search across 48h of detection history. Click any frame to seek the video to that exact timestamp.' },
  { icon: Brain,       color: '#ef4444', title: 'ML Prediction',            desc: 'Physics-informed predictor for remaining belt life, tear/burst/overheat/misalignment risk with anomaly forecasts.' },
  { icon: Thermometer, color: '#f97316', title: 'Thermal Monitoring',       desc: 'Zone-by-zone temperature mapping with friction index and hotspot detection.' },
  { icon: Activity,    color: '#06b6d4', title: 'Sensor Dashboard',         desc: 'Live charts for all 6 sensor channels — load cell, impact force, belt speed, temperature, vibration, UDL.' },
  { icon: Gauge,       color: '#8b5cf6', title: 'Load Analysis',            desc: 'Point load, UDL, peak stress, impact velocity, mass flow rate, and deposition rate.' },
  { icon: Bell,        color: '#ef4444', title: 'Alerts & Quick Assign',    desc: 'Auto-generated threshold alerts with one-click work order assignment directly from the alert row.' },
  { icon: ClipboardList,color:'#27a372', title: 'Work Orders',              desc: 'Assign maintenance tasks to engineers via WhatsApp, Email, SMS, Jira, ServiceNow, or IBM Maximo. Tag alerts and vision detections.' },
  { icon: Wrench,      color: '#f59e0b', title: 'Engineer Management',      desc: '8 engineers across 7 roles — head, maintenance, quality, service, thermal, electrical, safety — with workload bars and availability.' },
  { icon: Settings,    color: '#64748b', title: 'Belt Configuration',       desc: '45 steel-plant belts across 9 areas. Configure physical parameters: width, thickness, length, speed, tensile strength.' },
];

const TECH_STACK = [
  { layer: 'Frontend',   items: ['React 18', 'TypeScript 5', 'Vite 5', 'Tailwind CSS 3', 'Framer Motion', 'Three.js / R3F', 'TanStack Query', 'Zustand', 'Chart.js'] },
  { layer: 'Backend',    items: ['Node.js', 'Express 4', 'TypeScript 5', 'WebSocket (ws)', 'Helmet', 'Morgan', 'UUID'] },
  { layer: 'ML Service', items: ['Python 3.10+', 'FastAPI', 'Pydantic 2', 'scikit-learn', 'LangChain', 'GPT-4o-mini', 'httpx', 'uvicorn'] },
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
          <h1 className="text-3xl font-bold text-primary">DigitalTwin Conveyer Belt</h1>
          <p className="text-secondary mt-1 text-base">
            AI-powered predictive monitoring platform for industrial conveyor belt systems
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['v1.0.0', 'React 18', 'FastAPI', 'Three.js', 'GPT-4o-mini'].map((tag) => (
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
        <h2 className="text-lg font-bold text-primary">What is DigitalTwin Conveyer Belt?</h2>
        <p className="text-secondary leading-relaxed">
          DigitalTwin Conveyer Belt is a full-stack Industrial IoT platform that creates a real-time digital replica
          of conveyor belt systems used in steel plants, coal handling, and mining operations. It combines live sensor
          telemetry, physics-informed machine learning, computer vision defect detection, and a 3D interactive model
          to give maintenance engineers complete visibility into belt health — before failures happen.
        </p>
        <p className="text-secondary leading-relaxed">
          The platform monitors <strong className="text-primary">45 belt types</strong> across{' '}
          <strong className="text-primary">9 plant areas</strong>, generates predictions every 10 seconds,
          and enables engineers to assign work orders directly from detected defects via WhatsApp, Email, Jira,
          ServiceNow, or IBM Maximo.
        </p>
      </section>

      {/* Features grid */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-primary">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
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

      {/* Stats */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Shield,  color: '#27a372', value: '45',    label: 'Belt Types' },
            { icon: Zap,     color: '#3b82f6', value: '6',     label: 'Sensor Channels' },
            { icon: Brain,   color: '#a855f7', value: '10s',   label: 'Prediction Interval' },
            { icon: Clock,   color: '#f59e0b', value: '2s',    label: 'Sensor Refresh' },
          ].map(({ icon: Icon, color, value, label }) => (
            <div key={label} className="p-4 rounded-xl text-center"
              style={{ backgroundColor: 'var(--color-panel)', border: `1px solid ${color}33` }}>
              <Icon size={20} className="mx-auto mb-2" style={{ color }} />
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted mt-0.5">{label}</p>
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
