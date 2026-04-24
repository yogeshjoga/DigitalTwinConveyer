import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCheck, Filter, ClipboardList, X, Wrench, Send, CheckCircle2, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useAlerts, useAcknowledgeAlert } from '@/api/hooks';
import AlertBadge from '@/components/ui/AlertBadge';
import { useBeltStore } from '@/store/useBeltStore';
import { ENGINEERS, TASK_TEMPLATES, type Engineer } from '@/components/maintenance/WorkOrderAssignment';
import type { AlertSeverity, AlertType, Alert } from '@/types';

const TYPE_LABELS: Record<AlertType, string> = {
  overload:        'Overload',
  impact_spike:    'Impact Spike',
  heat_alert:      'Heat Alert',
  tear_risk:       'Tear Risk',
  misalignment:    'Misalignment',
  speed_anomaly:   'Speed Anomaly',
  vibration_spike: 'Vibration Spike',
};

// Map alert type → anomaly type for task template lookup
const ALERT_TO_ANOMALY: Partial<Record<AlertType, string>> = {
  tear_risk:       'Belt Tear',
  heat_alert:      'Overheating',
  overload:        'Belt Burst',
  misalignment:    'Misalignment',
  vibration_spike: 'Misalignment',
  impact_spike:    'Belt Tear',
  speed_anomaly:   'General Maintenance',
};

type Channel = 'whatsapp' | 'email' | 'sms' | 'jira' | 'servicenow' | 'maximo';

const CHANNELS: { id: Channel; label: string; color: string }[] = [
  { id: 'whatsapp',   label: 'WhatsApp',   color: '#25D366' },
  { id: 'email',      label: 'Email',      color: '#3b82f6' },
  { id: 'sms',        label: 'SMS',        color: '#8b5cf6' },
  { id: 'jira',       label: 'Jira',       color: '#0052CC' },
  { id: 'servicenow', label: 'ServiceNow', color: '#62d84e' },
  { id: 'maximo',     label: 'IBM Maximo', color: '#f59e0b' },
];

const ROLE_COLORS: Record<Engineer['role'], string> = {
  head: '#f59e0b', maintenance: '#27a372', quality: '#3b82f6',
  service: '#8b5cf6', thermal: '#ef4444', electrical: '#f59e0b', safety: '#f97316',
};

interface SentTicket {
  id: string; engineerName: string; channel: Channel;
  taskTitle: string; priority: string; sentAt: Date; ticketRef: string;
}

// ── Quick Assign Drawer ────────────────────────────────────────────────────────
function QuickAssignDrawer({
  alert,
  beltName,
  beltId,
  onClose,
}: {
  alert: Alert;
  beltName: string;
  beltId: string;
  onClose: () => void;
}) {
  const anomalyType = ALERT_TO_ANOMALY[alert.type] ?? 'General Maintenance';
  const template    = TASK_TEMPLATES[anomalyType] ?? TASK_TEMPLATES['General Maintenance'];

  const alertRef = `[Alert ref: ${alert.id} — ${alert.type.replace(/_/g, ' ')} · ${alert.severity}]\n${alert.message}`;

  const [selectedEngineers, setSelectedEngineers] = useState<string[]>(() =>
    // Pre-select first suggested available engineer
    ENGINEERS.filter((e) => template.suggestedRoles.includes(e.role) && e.available)
      .slice(0, 1).map((e) => e.id)
  );
  const [selectedChannels, setSelectedChannels] = useState<Channel[]>(['whatsapp', 'email']);
  const [taskTitle, setTaskTitle]   = useState(template.title);
  const [taskDesc, setTaskDesc]     = useState(`${template.description}\n\n${alertRef}`);
  const [priority, setPriority]     = useState<'low' | 'medium' | 'high' | 'critical'>(template.priority);
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [sentTickets, setSentTickets] = useState<SentTicket[]>([]);
  const [showTickets, setShowTickets] = useState(false);
  const [filterRole, setFilterRole] = useState<Engineer['role'] | 'all'>('all');

  const toggleEng = (id: string) =>
    setSelectedEngineers((p) => p.includes(id) ? p.filter((e) => e !== id) : [...p, id]);
  const toggleCh = (ch: Channel) =>
    setSelectedChannels((p) => p.includes(ch) ? p.filter((c) => c !== ch) : [...p, ch]);

  const priorityColor = { low: '#27a372', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }[priority];
  const severityColor = alert.severity === 'critical' ? '#ef4444' : alert.severity === 'warning' ? '#f59e0b' : '#3b82f6';

  const filteredEngineers = filterRole === 'all' ? ENGINEERS : ENGINEERS.filter((e) => e.role === filterRole);

  const handleSend = async () => {
    if (selectedEngineers.length === 0 || selectedChannels.length === 0) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    const now = new Date();
    const tickets: SentTicket[] = [];
    for (const engId of selectedEngineers) {
      const eng = ENGINEERS.find((e) => e.id === engId)!;
      for (const ch of selectedChannels) {
        const prefix = ch === 'jira' ? 'BELT' : ch === 'servicenow' ? 'SN' : ch === 'maximo' ? 'WO' : 'MSG';
        tickets.push({
          id: `${engId}-${ch}-${Date.now()}`,
          engineerName: eng.name, channel: ch,
          taskTitle, priority, sentAt: now,
          ticketRef: `${prefix}-${Math.floor(10000 + Math.random() * 90000)}`,
        });
      }
    }
    setSentTickets(tickets);
    setSending(false);
    setSent(true);
    setShowTickets(true);
  };

  return (
    // Backdrop
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}
    >
      {/* Drawer panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 32 }}
        className="relative h-full w-full max-w-lg overflow-y-auto flex flex-col"
        style={{ backgroundColor: 'var(--color-panel)', borderLeft: '1px solid var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Drawer header ── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b"
          style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#27a37222' }}>
              <Wrench size={15} style={{ color: '#27a372' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Quick Assign Work Order</p>
              <p className="text-xs text-muted">{beltName} · {beltId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-primary transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-5">
          {/* ── Alert being assigned ── */}
          <div
            className="rounded-xl p-3 flex items-start gap-3"
            style={{ background: severityColor + '10', border: `1px solid ${severityColor}33` }}
          >
            <AlertBadge severity={alert.severity} pulse={false} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-bold uppercase text-muted">{TYPE_LABELS[alert.type]}</span>
                {alert.value !== undefined && (
                  <span className="text-[10px] font-mono" style={{ color: severityColor }}>{alert.value} {alert.unit}</span>
                )}
              </div>
              <p className="text-sm font-medium text-primary">{alert.message}</p>
              <p className="text-[10px] text-muted mt-0.5">{new Date(alert.timestamp).toLocaleString()}</p>
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex-shrink-0"
              style={{ background: severityColor + '22', color: severityColor }}
            >
              {alert.severity}
            </span>
          </div>

          {/* ── Task details ── */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Task Title</label>
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted mb-1 block">Description</label>
              <textarea
                value={taskDesc}
                onChange={(e) => setTaskDesc(e.target.value)}
                rows={4}
                className="w-full text-sm px-3 py-2 rounded-lg outline-none resize-none font-mono"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted mb-1 block">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof priority)}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--text-primary)' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex items-end">
                <span
                  className="w-full text-center text-xs font-bold px-3 py-2 rounded-lg uppercase tracking-wide"
                  style={{ background: priorityColor + '18', color: priorityColor, border: `1px solid ${priorityColor}33` }}
                >
                  {priority} priority
                </span>
              </div>
            </div>
          </div>

          {/* ── Channels ── */}
          <div>
            <label className="text-xs font-medium text-muted mb-2 block">Notify via</label>
            <div className="grid grid-cols-3 gap-2">
              {CHANNELS.map(({ id, label, color }) => {
                const active = selectedChannels.includes(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleCh(id)}
                    className="py-2 rounded-xl text-xs font-medium transition-all"
                    style={{
                      background: active ? color + '22' : 'var(--color-surface)',
                      border: `1px solid ${active ? color + '88' : 'var(--color-border)'}`,
                      color: active ? color : 'var(--text-secondary)',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Engineers ── */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
              <label className="text-xs font-medium text-muted">Assign Engineers</label>
              <div className="flex gap-1 flex-wrap">
                {(['all', 'head', 'maintenance', 'quality', 'service', 'thermal', 'electrical', 'safety'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setFilterRole(role)}
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium transition-all capitalize"
                    style={{
                      background: filterRole === role ? '#27a37222' : 'var(--color-surface)',
                      border: `1px solid ${filterRole === role ? '#27a37288' : 'var(--color-border)'}`,
                      color: filterRole === role ? '#27a372' : 'var(--text-muted)',
                    }}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              {filteredEngineers.map((eng) => {
                const selected    = selectedEngineers.includes(eng.id);
                const isSuggested = template.suggestedRoles.includes(eng.role);
                const roleColor   = ROLE_COLORS[eng.role];
                return (
                  <motion.button
                    key={eng.id}
                    onClick={() => toggleEng(eng.id)}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: selected ? '#27a37215' : 'var(--color-surface)',
                      border: `1px solid ${selected ? '#27a37266' : 'var(--color-border)'}`,
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 relative"
                      style={{ background: roleColor + '33', color: roleColor }}
                    >
                      {eng.avatar}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 ${eng.available ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-primary">{eng.name}</span>
                        {isSuggested && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: '#27a37222', color: '#27a372' }}>
                            SUGGESTED
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted">{eng.title}</p>
                      {/* Workload */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-border)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${eng.currentLoad}%`,
                              backgroundColor: eng.currentLoad > 80 ? '#ef4444' : eng.currentLoad > 60 ? '#f59e0b' : '#27a372',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-muted w-7 text-right">{eng.currentLoad}%</span>
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        background: selected ? '#27a372' : 'var(--color-border)',
                        border: `1px solid ${selected ? '#27a372' : 'var(--color-border)'}`,
                      }}
                    >
                      {selected && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── Sent tickets log ── */}
          <AnimatePresence>
            {sentTickets.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <button
                    onClick={() => setShowTickets((v) => !v)}
                    className="w-full flex items-center justify-between text-xs font-semibold text-secondary"
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} style={{ color: '#27a372' }} />
                      Sent ({sentTickets.length} notifications)
                    </span>
                    {showTickets ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  <AnimatePresence>
                    {showTickets && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-1 pt-1">
                        {sentTickets.map((t) => {
                          const ch = CHANNELS.find((c) => c.id === t.channel)!;
                          const pColor = { low: '#27a372', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }[t.priority] ?? '#27a372';
                          return (
                            <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}>
                              <span className="text-xs font-medium text-primary flex-1 truncate">{t.engineerName}</span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: ch.color + '22', color: ch.color }}>{t.ticketRef}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ background: pColor + '22', color: pColor }}>{t.priority}</span>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Sticky footer ── */}
        <div
          className="sticky bottom-0 px-5 py-4 border-t flex items-center justify-between gap-3"
          style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
        >
          <p className="text-xs text-muted">
            {selectedEngineers.length} engineer{selectedEngineers.length !== 1 ? 's' : ''} · {selectedChannels.length} channel{selectedChannels.length !== 1 ? 's' : ''}
            {selectedEngineers.length > 0 && selectedChannels.length > 0 && (
              <span className="text-brand-500 ml-1">→ {selectedEngineers.length * selectedChannels.length} notifications</span>
            )}
          </p>
          {sent ? (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #27a372, #1a835c)' }}
            >
              <CheckCircle2 size={14} />
              Done
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={selectedEngineers.length === 0 || selectedChannels.length === 0 || sending}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #27a372, #1a835c)' }}
            >
              {sending ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Settings size={14} />
                  </motion.div>
                  Sending…
                </>
              ) : (
                <>
                  <Send size={14} />
                  Send Work Order
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Alerts Page ───────────────────────────────────────────────────────────
export default function AlertsPage() {
  const { data: alerts }     = useAlerts();
  const { mutate: ackAlert } = useAcknowledgeAlert();
  const selectedBelt         = useBeltStore((s) => s.selectedBeltEntry);

  const [filter, setFilter]       = useState<AlertSeverity | 'all'>('all');
  const [showAcked, setShowAcked] = useState(false);
  const [assignAlert, setAssignAlert] = useState<Alert | null>(null);

  const filtered = alerts?.filter((a) => {
    if (!showAcked && a.acknowledged) return false;
    if (filter !== 'all' && a.severity !== filter) return false;
    return true;
  }) ?? [];

  const counts = {
    critical: alerts?.filter((a) => a.severity === 'critical' && !a.acknowledged).length ?? 0,
    warning:  alerts?.filter((a) => a.severity === 'warning'  && !a.acknowledged).length ?? 0,
    info:     alerts?.filter((a) => a.severity === 'info'     && !a.acknowledged).length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Alerts</h1>
          <p className="text-secondary text-sm mt-1">
            {counts.critical} critical · {counts.warning} warnings · {counts.info} info
          </p>
        </div>
        <button
          onClick={() => setShowAcked((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors text-secondary hover:text-primary"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}
        >
          <CheckCheck size={14} />
          {showAcked ? 'Hide Acknowledged' : 'Show Acknowledged'}
        </button>
      </div>

      {/* Severity filter */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-muted" />
        {(['all', 'critical', 'warning', 'info'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === s
                ? s === 'critical' ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/40'
                : s === 'warning'  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                : s === 'info'     ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/40'
                :                   'bg-brand-500/20 text-brand-500 border border-brand-500/30'
                : 'bg-black/5 dark:bg-white/5 text-secondary border border-transparent hover:text-primary'
            }`}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-green-600 dark:text-green-400 font-medium">✓ No alerts match the current filter</p>
            </div>
          ) : (
            filtered.map((alert) => {
              const isCritical = alert.severity === 'critical' && !alert.acknowledged;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className={`card flex items-start gap-4 ${alert.acknowledged ? 'opacity-50' : ''}`}
                  style={isCritical ? { borderColor: '#ef444433', background: '#ef444408' } : undefined}
                >
                  <AlertBadge severity={alert.severity} pulse={isCritical} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-muted font-medium uppercase">{TYPE_LABELS[alert.type]}</span>
                      {alert.value !== undefined && (
                        <span className="text-xs font-mono text-secondary">{alert.value} {alert.unit}</span>
                      )}
                    </div>
                    <p className="text-sm text-primary">{alert.message}</p>
                    <p className="text-xs text-muted mt-0.5">{new Date(alert.timestamp).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Assign to Work Order button */}
                    {!alert.acknowledged && (
                      <button
                        onClick={() => setAssignAlert(alert)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: isCritical ? '#ef444418' : '#27a37215',
                          color: isCritical ? '#ef4444' : '#27a372',
                          border: `1px solid ${isCritical ? '#ef444433' : '#27a37233'}`,
                        }}
                        title="Assign to work order"
                      >
                        <ClipboardList size={12} />
                        Assign
                      </button>
                    )}

                    {/* Ack button */}
                    {!alert.acknowledged && (
                      <button
                        onClick={() => ackAlert(alert.id)}
                        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors text-secondary hover:text-primary"
                        style={{ borderColor: 'var(--color-border)' }}
                        aria-label="Acknowledge alert"
                      >
                        Ack
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Quick Assign Drawer */}
      <AnimatePresence>
        {assignAlert && (
          <QuickAssignDrawer
            alert={assignAlert}
            beltName={selectedBelt.name}
            beltId={selectedBelt.id}
            onClose={() => setAssignAlert(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
