import { Bell, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
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

  // Live clock
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
      className="h-14 flex items-center flex-shrink-0 border-b transition-colors"
      style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
    >
      {/* ── LEFT: Belt name + selector ──────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 flex-shrink-0 min-w-0" style={{ flex: '0 0 auto', maxWidth: '55%' }}>
        {/* Belt name headline */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: selectedBelt.color }}
            />
            <span className="text-sm font-bold text-primary truncate leading-tight">
              {selectedBelt.name}
            </span>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold flex-shrink-0 hidden sm:inline"
              style={{ background: selectedBelt.color + '18', color: selectedBelt.color }}
            >
              {selectedBelt.id}
            </span>
          </div>
          <span className="text-[10px] text-muted leading-tight truncate hidden sm:block">
            {selectedBelt.material} · {selectedBelt.area}
          </span>
        </div>

        {/* Belt selector dropdown */}
        <div className="flex-shrink-0">
          <BeltSelector />
        </div>
      </div>

      {/* ── CENTER: Health + status ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-1 justify-center px-2">
        {summary && (
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: healthColor + '18', color: healthColor, border: `1px solid ${healthColor}33` }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: healthColor }}
            />
            Health {summary.beltHealth}%
          </div>
        )}
        <div className="flex items-center gap-1 text-xs">
          {isOnline ? (
            <>
              <Wifi size={12} className="text-green-500" />
              <span className="text-green-600 dark:text-green-400 hidden md:inline text-[11px]">Live</span>
            </>
          ) : (
            <WifiOff size={12} className="text-red-500" />
          )}
        </div>
      </div>

      {/* ── RIGHT: Actions ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 flex-shrink-0">
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
        <span className="text-muted text-xs font-mono pl-1 hidden sm:block tabular-nums">
          {time}
        </span>
      </div>
    </header>
  );
}
