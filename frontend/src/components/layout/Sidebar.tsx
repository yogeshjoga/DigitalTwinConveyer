import { NavLink, Link } from 'react-router-dom';
import dtcLogo from '@/assets/DTC_LOGO.png';
import {
  LayoutDashboard, Box, Activity, Thermometer, Eye,
  Brain, Bell, Settings, ChevronLeft, ChevronRight,
  Gauge, ClipboardList, Film, HelpCircle, Info, Cpu, Home,
  SlidersHorizontal,
} from 'lucide-react';
import { useBeltStore } from '@/store/useBeltStore';
import { useAlerts } from '@/api/hooks';

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { to: '/',             icon: Home,            label: 'Fleet Overview', exact: true },
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Belt Dashboard' },
      { to: '/digital-twin', icon: Box,             label: 'Digital Twin' },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { to: '/sensors',         icon: Activity,    label: 'Sensors' },
      { to: '/load',            icon: Gauge,       label: 'Load Analysis' },
      { to: '/thermal',         icon: Thermometer, label: 'Thermal' },
      { to: '/vision',          icon: Eye,         label: 'Vision' },
      { to: '/video-analytics', icon: Film,        label: 'Video Analytics' },
    ],
  },
  {
    label: 'Control',
    items: [
      { to: '/plc',         icon: Cpu,          label: 'PLC / HMI' },
      { to: '/work-orders', icon: ClipboardList, label: 'Work Orders' },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/prediction', icon: Brain, label: 'ML Prediction' },
      { to: '/alerts',     icon: Bell,  label: 'Alerts', badge: true },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/config', icon: Settings, label: 'Belt Config' },
    ],
  },
];

const BOTTOM_NAV = [
  { to: '/settings', icon: SlidersHorizontal, label: 'Settings' },
  { to: '/help',     icon: HelpCircle,        label: 'Help' },
  { to: '/about',    icon: Info,              label: 'About' },
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
      style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
    >
      {/* Logo — clicking navigates to Fleet Overview (home) */}
      <Link
        to="/"
        className="flex items-center gap-3 px-4 py-4 border-b transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        style={{ borderColor: 'var(--color-border)' }}
        title="Fleet Overview — Home"
      >
        <img src={dtcLogo} alt="DTC Logo"
          className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
          style={{ background: 'var(--color-surface)' }} />
        {sidebarOpen && (
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight text-primary truncate">DigitalTwin</p>
            <p className="text-[10px] text-muted leading-tight">Conveyor Belt</p>
          </div>
        )}
      </Link>

      {/* Nav groups */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-0.5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {sidebarOpen && (
              <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted select-none">
                {group.label}
              </p>
            )}
            {!sidebarOpen && (
              <div className="mx-3 my-1.5 border-t" style={{ borderColor: 'var(--color-border)' }} />
            )}

            {group.items.map(({ to, icon: Icon, label, badge, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                title={!sidebarOpen ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors relative ${
                    isActive
                      ? 'bg-brand-500/20 text-brand-500 dark:text-brand-400 font-medium'
                      : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
                  }`
                }
              >
                <Icon size={17} className="flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{label}</span>}
                {badge && criticalCount > 0 && (
                  <span className={`${sidebarOpen ? 'ml-auto' : 'absolute top-1 right-1'} bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-bold`}>
                    {criticalCount > 9 ? '9+' : criticalCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t py-2" style={{ borderColor: 'var(--color-border)' }}>
        {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            title={!sidebarOpen ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-brand-500/20 text-brand-500 font-medium'
                  : 'text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} className="flex-shrink-0" />
            {sidebarOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </div>

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
