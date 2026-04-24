import type { AlertSeverity } from '@/types';

interface AlertBadgeProps {
  severity: AlertSeverity;
  pulse?: boolean;
}

const map = {
  info:     'badge-info',
  warning:  'badge-warning',
  critical: 'badge-danger',
};

const labels = {
  info:     'INFO',
  warning:  'WARN',
  critical: 'CRIT',
};

export default function AlertBadge({ severity, pulse }: AlertBadgeProps) {
  return (
    <span className={`${map[severity]} ${pulse ? 'animate-pulse' : ''}`}>
      {labels[severity]}
    </span>
  );
}
