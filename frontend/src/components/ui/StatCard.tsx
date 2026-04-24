import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  status?: 'ok' | 'warning' | 'critical';
  subtitle?: string;
}

const statusBorder = {
  ok:       'border-green-500/30',
  warning:  'border-amber-500/30',
  critical: 'border-red-500/30',
};

const statusBg = {
  ok:       'bg-green-500/10',
  warning:  'bg-amber-500/10',
  critical: 'bg-red-500/10',
};

const statusText = {
  ok:       'text-green-600 dark:text-green-400',
  warning:  'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400',
};

const iconBg = {
  ok:       'bg-green-500/15 text-green-600 dark:text-green-400',
  warning:  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  critical: 'bg-red-500/15 text-red-600 dark:text-red-400',
};

export default function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  status = 'ok',
  subtitle,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card border ${statusBorder[status]} ${statusBg[status]}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-primary">{value}</span>
            {unit && <span className="text-sm text-muted">{unit}</span>}
          </div>
          {subtitle && <p className={`text-xs mt-1 ${statusText[status]}`}>{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${iconBg[status]}`}>
          <Icon size={20} />
        </div>
      </div>
    </motion.div>
  );
}
