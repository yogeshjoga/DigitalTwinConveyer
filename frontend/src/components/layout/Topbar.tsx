import { Bell, Wifi, WifiOff, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardSummary, useAlerts } from '@/api/hooks';
import { useBeltStore } from '@/store/useBeltStore';
import BeltSelector from './BeltSelector';

export default function Topbar() {
  const navigate      = useNavigate();
  const { data: summary } = useDashboardSummary();
  const { data: alerts }  = useAlerts();
  const theme             = useBeltStore((s) => s.theme);
  const toggleTheme       = useBeltStore((s) => s.toggleTheme);
  const selectedBelt      = useBeltStore((s) => s.selectedBeltEntry);

  const unread   = alerts?.filter((a) => !a.acknowledged).length ?? 0;
  const isOnline = true;

  return (
    <header
      className="h-14 flex items-center justify-between px-4 flex-shrink-0 border-b transition-colors gap-4"
      style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
    >
      {/* ── Left: health badge ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
        {summary && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
              summary.beltHealth >= 80
                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                : summary.beltHealth >= 50
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            Health {summary.beltHealth}%
          </span>
        )}
        {/* Material type pill */}
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium hidden md:inline-flex"
          style={{
            background: selectedBelt.color + '18',
            color: selectedBelt.color,
            border: `1px solid ${selectedBelt.color}33`,
          }}
        >
          {selectedBelt.material}
        </span>
      </div>

      {/* ── Center: Belt selector dropdown ──────────────────────────────── */}
      <div className="flex-1 flex justify-center">
        <BeltSelector />
      </div>

      {/* ── Right: indicators ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Connection */}
        <div className="flex items-center gap-1 text-xs px-2">
          {isOnline ? (
            <>
              <Wifi size={13} className="text-green-500" />
              <span className="text-green-600 dark:text-green-400 hidden sm:inline">Live</span>
            </>
          ) : (
            <>
              <WifiOff size={13} className="text-red-500" />
              <span className="text-red-500 hidden sm:inline">Offline</span>
            </>
          )}
        </div>

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
        <span className="text-muted text-xs font-mono pl-1 hidden sm:block">
          {new Date().toLocaleTimeString()}
        </span>
      </div>
    </header>
  );
}
