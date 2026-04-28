/**
 * PLCNotificationToast
 *
 * Only renders the toast stack (bottom-right slide-in cards).
 * The bell button + notification panel live in Topbar so there is
 * exactly one bell in the UI.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, AlertTriangle, Info, X } from 'lucide-react';
import { usePLCNotifications } from '@/api/hooks';
import type { PLCNotification } from '@/types';

export const SEVERITY_CONFIG = {
  critical: { icon: AlertOctagon, color: '#ef4444', bg: '#ef444412', border: '#ef444433', label: 'CRITICAL' },
  warning:  { icon: AlertTriangle, color: '#f59e0b', bg: '#f59e0b12', border: '#f59e0b33', label: 'WARNING'  },
  info:     { icon: Info,          color: '#3b82f6', bg: '#3b82f612', border: '#3b82f633', label: 'INFO'     },
};

const MAX_VISIBLE    = 3;
const AUTO_DISMISS_MS = 8000;

export default function PLCNotificationToast() {
  const { data: notifications } = usePLCNotifications();
  const seenIds = useRef<Set<string>>(new Set());
  const [toasts, setToasts] = useState<PLCNotification[]>([]);

  useEffect(() => {
    if (!notifications?.length) return;
    const newOnes = notifications.filter((n) => !n.read && !seenIds.current.has(n.id));
    if (!newOnes.length) return;

    newOnes.forEach((n) => seenIds.current.add(n.id));
    setToasts((prev) => [...newOnes, ...prev].slice(0, MAX_VISIBLE));

    newOnes.forEach((n) => {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== n.id)), AUTO_DISMISS_MS);
    });
  }, [notifications]);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-end pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const cfg  = SEVERITY_CONFIG[toast.severity];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{   opacity: 0, x: 60,  scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto w-80 rounded-2xl shadow-2xl overflow-hidden"
              style={{ border: `1.5px solid ${cfg.border}`, backgroundColor: 'var(--color-panel)' }}
            >
              <div className="h-1" style={{ backgroundColor: cfg.color }} />
              <div className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cfg.bg }}>
                    <Icon size={16} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: cfg.color }}>{cfg.label}</span>
                      <button onClick={() => dismiss(toast.id)}
                        className="text-muted hover:text-primary transition-colors flex-shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-xs font-bold text-primary mt-0.5 leading-tight">{toast.title}</p>
                    <p className="text-[11px] text-secondary mt-1 leading-snug">{toast.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-muted font-mono">
                        {new Date(toast.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-[10px] text-muted">📢 All workers notified</span>
                    </div>
                  </div>
                </div>
              </div>
              <motion.div
                className="h-0.5"
                style={{ backgroundColor: cfg.color, opacity: 0.4 }}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
