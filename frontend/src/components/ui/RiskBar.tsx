interface RiskBarProps {
  label: string;
  value: number;   // 0–1
  unit?: string;
}

export default function RiskBar({ label, value, unit = '%' }: RiskBarProps) {
  const pct   = Math.round(value * 100);
  const color = pct >= 75 ? 'bg-red-500' : pct >= 45 ? 'bg-amber-500' : 'bg-green-500';

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-secondary">{label}</span>
        <span className="font-mono text-primary font-medium">
          {pct}{unit}
        </span>
      </div>
      <div
        className="h-2 rounded-full overflow-hidden"
        style={{ backgroundColor: 'var(--color-border)' }}
      >
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        />
      </div>
    </div>
  );
}
