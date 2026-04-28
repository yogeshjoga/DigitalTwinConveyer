import { Bell, Wifi, WifiOff, Sun, Moon, X, CheckCheck, AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboardSummary, useAlerts, usePLCNotifications, useMarkNotificationsRead } from '@/api/hooks';
import { useBeltStore } from '@/store/useBeltStore';
import BeltSelector from './BeltSelector';
import type { PLCNotification } from '@/types';

// Severity colours shared with toast
const SEV = {
  critical: { icon: AlertOctagon,  color: '#ef4444', bg: '#ef444412' },
  warning:  { icon: AlertTriangle, color: '#f59e0b', bg: '#f59e0b12' },
  info:     { icon: Info,          color: '#3b82f6', bg: '#3b82f612' },
};

export default function Topbar() {
  const navigate           = useNavigate();
  const { data: summary }  = useDashboardSummary();
  const { data: alerts }   = useAlerts();
  const { data: plcNotifs } = usePLCNotifications();
  const markPLCRead        = useMarkNotificationsRead();
  const theme              = useBeltStore((s) => s.theme);
  const toggleTheme        = useBeltStore((s) => s.toggleTheme);
  const selectedBelt       = useBeltStore((s) => s.selectedBeltEntry);

  const [showPanel, setShowPanel] = useState(false);
  const [tab, setTab]             = useState<'system' | 'plc'>('plc');
  const panelRef                  = useRef<HTMLDivElement>(null);

  const systemUnread = alerts?.filter((a) => !a.acknowledged).length ?? 0;
  const plcUnread    = plcNotifs?.filter((n) => !n.read).length ?? 0;
  const totalUnread  = systemUnread + plcUnread;

  const isOnline = true;

  const [time, setTime] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPanel]);

  const handleBellClick = () => {
    if (!showPanel) {
      // Default to whichever tab has unread, preferring PLC
      setTab(plcUnread > 0 ? 'plc' : 'system');
    }
    setShowPanel((v) => !v);
  };

  const healthColor =
    (summary?.beltHealth ?? 100) >= 80 ? '#22c55e' :
    (summary?.beltHealth ?? 100) >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <header
      className="h-14 flex items-center flex-shrink-0 border-b"
      style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
    >
      {/* LEFT: Belt selector */}
      <div className="flex items-center px-4 flex-shrink-0" style={{ width: 220 }}>
        <BeltSelector />
      </div>

      {/* CENTER: Belt name */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-4">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: selectedBelt.color }} />
          <span className="text-base font-bold text-primary leading-tight truncate">{selectedBelt.name}</span>
          <span
            className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md flex-shrink-0 hidden sm:inline"
            style={{ background: selectedBelt.color + '18', color: selectedBelt.color, border: `1px solid ${selectedBelt.color}33` }}
          >
            {selectedBelt.id}
          </span>
        </div>
        <span className="text-[11px] text-muted leading-tight hidden sm:block">
          {selectedBelt.material} · {selectedBelt.area}
        </span>
      </div>

      {/* RIGHT: Health · Live · Bell · Theme · Clock */}
      <div className="flex items-center gap-2 px-4 flex-shrink-0">
        {summary && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: healthColor + '18', color: healthColor, border: `1px solid ${healthColor}33` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: healthColor }} />
            Health {summary.beltHealth}%
          </div>
        )}

        <div className="flex items-center gap-1 text-xs font-medium hidden sm:flex">
          {isOnline
            ? <><Wifi size={13} className="text-green-500" /><span className="text-green-600 dark:text-green-400">Live</span></>
            : <><WifiOff size={13} className="text-red-500" /><span className="text-red-500">Offline</span></>}
        </div>

        <div className="w-px h-5 hidden sm:block" style={{ backgroundColor: 'var(--color-border)' }} />

        {/* ── Single unified bell button ── */}
        <div className="relative" ref={panelRef}>
          <button
            onClick={handleBellClick}
            className="relative p-2 rounded-lg transition-colors text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
            aria-label="Notifications"
          >
            <Bell size={17} />
            {totalUnread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none animate-pulse">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </button>

          {/* ── Unified notification panel ── */}
          <AnimatePresence>
            {showPanel && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{   opacity: 0, y: -6,  scale: 0.97 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-full mt-2 z-50 w-96 max-h-[75vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
                style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
              >
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-secondary" />
                    <span className="text-sm font-bold text-primary">Notifications</span>
                    {totalUnread > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
                        {totalUnread} new
                      </span>
                    )}
                  </div>
                  <button onClick={() => setShowPanel(false)} className="text-muted hover:text-primary transition-colors">
                    <X size={14} />
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
                  {([
                    { id: 'plc',    label: 'PLC / Auto-Rules', count: plcUnread    },
                    { id: 'system', label: 'System Alerts',    count: systemUnread },
                  ] as const).map(({ id, label, count }) => (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors"
                      style={{
                        color: tab === id ? '#27a372' : 'var(--text-muted)',
                        borderBottom: tab === id ? '2px solid #27a372' : '2px solid transparent',
                        backgroundColor: tab === id ? '#27a37208' : 'transparent',
                      }}
                    >
                      {label}
                      {count > 0 && (
                        <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                          {count > 9 ? '9+' : count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto">
                  {/* PLC tab */}
                  {tab === 'plc' && (
                    <>
                      {plcUnread > 0 && (
                        <div className="px-4 py-2 border-b flex justify-end" style={{ borderColor: 'var(--color-border)' }}>
                          <button
                            onClick={() => markPLCRead.mutate()}
                            className="flex items-center gap-1 text-[10px] text-muted hover:text-primary transition-colors"
                          >
                            <CheckCheck size={11} /> Mark all read
                          </button>
                        </div>
                      )}
                      {(!plcNotifs || plcNotifs.length === 0) ? (
                        <div className="py-10 text-center text-muted text-sm">No PLC notifications yet</div>
                      ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                          {plcNotifs.slice(0, 30).map((n) => {
                            const cfg  = SEV[n.severity];
                            const Icon = cfg.icon;
                            return (
                              <div key={n.id} className="px-4 py-3 flex items-start gap-3"
                                style={{ backgroundColor: n.read ? undefined : cfg.bg }}>
                                <Icon size={14} style={{ color: cfg.color }} className="flex-shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-primary leading-tight">{n.title}</p>
                                  <p className="text-[11px] text-secondary mt-0.5 leading-snug">{n.message}</p>
                                  <p className="text-[10px] text-muted mt-1 font-mono">
                                    {new Date(n.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                    style={{ backgroundColor: cfg.color }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* System alerts tab */}
                  {tab === 'system' && (
                    <>
                      {(!alerts || alerts.length === 0) ? (
                        <div className="py-10 text-center text-muted text-sm">No system alerts</div>
                      ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                          {alerts.slice(0, 30).map((a) => {
                            const color =
                              a.severity === 'critical' ? '#ef4444' :
                              a.severity === 'warning'  ? '#f59e0b' : '#3b82f6';
                            const bg =
                              a.severity === 'critical' ? '#ef444412' :
                              a.severity === 'warning'  ? '#f59e0b12' : '#3b82f612';
                            return (
                              <div key={a.id}
                                className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                style={{ backgroundColor: a.acknowledged ? undefined : bg }}
                                onClick={() => { navigate('/alerts'); setShowPanel(false); }}
                              >
                                <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                  style={{ backgroundColor: color }} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-primary leading-tight truncate">{a.message}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] font-bold uppercase"
                                      style={{ color }}>{a.severity}</span>
                                    <span className="text-[10px] text-muted font-mono">
                                      {new Date(a.timestamp).toLocaleTimeString()}
                                    </span>
                                  </div>
                                </div>
                                {!a.acknowledged && (
                                  <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                                    style={{ backgroundColor: color }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <button
                          onClick={() => { navigate('/alerts'); setShowPanel(false); }}
                          className="w-full text-xs font-semibold text-center py-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                          style={{ color: '#27a372' }}
                        >
                          View all alerts →
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
          aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Clock */}
        <span className="text-muted text-xs font-mono tabular-nums hidden md:block">{time}</span>
      </div>
    </header>
  );
}
