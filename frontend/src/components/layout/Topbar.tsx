import { Bell, Wifi, WifiOff, Sun, Moon, ChevronDown } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardSummary, useAlerts } from '@/api/hooks';
import { useBeltStore } from '@/store/useBeltStore';
import BeltSelector from './BeltSelector';

export default function Topbar() {
  const navigate           = useNavigate();
  const { data: summary }  = useDashboardSummary();
  const { data: alerts }   = useAlerts();
  const theme              = useBeltStore((s) => s.theme);
  const toggleTheme        = useBeltStore((s) => s.toggleTheme);
  const selectedBelt       = useBeltStore((s) => s.selectedBeltEntry);

  const unread   = alerts?.filter((a) => !a.acknowledged).length ?? 0;
  const isOnline = true;

  const [time, setTime] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(id);
  }, []);

  const healthColor =
    (summary?.beltHealth ?? 100) >= 80 ? '#22c55e' :
    (summary?.beltHealth ?? 100) >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <header
      className="h-14 flex items-center flex-shrink-0 border-b"
      style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
    >
      {/* ── LEFT: Belt selector dropdown only ───────────────────────────── */}
      <div className="flex items-center px-4 flex-shrink-0" style={{ width: 220 }}>
        <BeltSelector />
      </div>

      {/* ── CENTER: Current belt name — big, clean, prominent ───────────── */}
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-4">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: selectedBelt.color }}
          />
          <span className="text-base font-bold text-primary leading-tight truncate">
            {selectedBelt.name}
          </span>
          <span
            className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md flex-shrink-0 hidden sm:inline"
            style={{
              background: selectedBelt.color + '18',
              color: selectedBelt.color,
              border: `1px solid ${selectedBelt.color}33`,
            }}
          >
            {selectedBelt.id}
          </span>
        </div>
        <span className="text-[11px] text-muted leading-tight hidden sm:block">
          {selectedBelt.material} · {selectedBelt.area}
        </span>
      </div>

      {/* ── RIGHT: Health · Live · Bell · Theme · Clock ──────────────────── */}
      <div className="flex items-center gap-2 px-4 flex-shrink-0">
        {/* Health badge */}
        {summary && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{
              background: healthColor + '18',
              color: healthColor,
              border: `1px solid ${healthColor}33`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: healthColor }} />
            Health {summary.beltHealth}%
          </div>
        )}

        {/* Live indicator */}
        <div className="flex items-center gap-1 text-xs font-medium hidden sm:flex">
          {isOnline ? (
            <>
              <Wifi size={13} className="text-green-500" />
              <span className="text-green-600 dark:text-green-400">Live</span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="text-red-500" />
              <span className="text-red-500">Offline</span>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 hidden sm:block" style={{ backgroundColor: 'var(--color-border)' }} />

        {/* Alert bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg transition-colors text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="View alerts"
        >
          <Bell size={17} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg transition-colors text-secondary hover:text-primary hover:bg-black/5 dark:hover:bg-white/5"
          aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Clock */}
        <span className="text-muted text-xs font-mono tabular-nums hidden md:block">
          {time}
        </span>
      </div>
    </header>
  );
}
