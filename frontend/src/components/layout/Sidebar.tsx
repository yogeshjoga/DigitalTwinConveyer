import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Activity,
  Thermometer,
  Eye,
  Brain,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  Gauge,
  ClipboardList,
} from 'lucide-react';
import { useBeltStore } from '@/store/useBeltStore';
import { useAlerts } from '@/api/hooks';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/digital-twin', icon: Box,             label: 'Digital Twin' },
  { to: '/load',         icon: Gauge,           label: 'Load Analysis' },
  { to: '/sensors',      icon: Activity,        label: 'Sensors' },
  { to: '/thermal',      icon: Thermometer,     label: 'Thermal' },
  { to: '/vision',       icon: Eye,             label: 'Vision' },
  { to: '/prediction',   icon: Brain,           label: 'ML Prediction' },
  { to: '/alerts',       icon: Bell,            label: 'Alerts' },
  { to: '/work-orders',  icon: ClipboardList,   label: 'Work Orders' },
  { to: '/config',       icon: Settings,        label: 'Belt Config' },
];

export default function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useBeltStore();
  const { data: alerts } = useAlerts();
  const criticalCount = alerts?.filter(
    (a) => a.severity === 'critical' && !a.acknowledged
  ).length ?? 0;

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300 border-r ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
      style={{
        backgroundColor: 'var(--color-panel)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-5 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">DT</span>
        </div>
        {sidebarOpen && (
          <div>
            <p className="font-semibold text-sm leading-tight text-primary">DigitalTwin</p>
            <p className="text-xs text-muted">Conveyer Belt</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors relative ${
                isActive
                  ? 'bg-brand-500/20 text-brand-500 dark:text-brand-400 font-medium'
                  : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`
            }
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
            {label === 'Alerts' && criticalCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {criticalCount > 9 ? '9+' : criticalCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-center p-3 border-t text-secondary hover:text-primary transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ borderColor: 'var(--color-border)' }}
        aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
      </button>
    </aside>
  );
}
