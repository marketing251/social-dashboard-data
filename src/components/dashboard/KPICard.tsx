import { formatNum, formatPct, pctChangeClass } from '@/lib/kpi/format';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: number | null;
  change: number | null;
  variant?: 'reach' | 'audience' | 'engagement' | 'interactions' | 'default';
  suffix?: string;
}

export function KPICard({ label, value, change, variant = 'default', suffix }: Props) {
  const isHero = variant !== 'default';

  // Inline styles for hero cards (avoids Tailwind purge issues with dynamic gradient classes)
  const heroStyles: Record<string, React.CSSProperties> = {
    reach: { background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
    audience: { background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
    engagement: { background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
    interactions: { background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
  };

  return (
    <div
      className={cn(
        'rounded-lg p-6 transition',
        isHero ? 'text-white text-center' : 'bg-card border border-border'
      )}
      style={isHero ? heroStyles[variant] : undefined}
    >
      <div
        className={cn(
          'text-xs uppercase tracking-wider mb-2',
          isHero ? 'opacity-85' : 'text-text-muted'
        )}
      >
        {label}
      </div>
      <div className={cn('font-extrabold mb-1', isHero ? 'text-3xl' : 'text-2xl')}>
        {formatNum(value)}{suffix || ''}
      </div>
      {change != null && (
        <div
          className={cn(
            'text-sm font-semibold',
            isHero
              ? 'opacity-90'
              : pctChangeClass(change) === 'positive'
                ? 'text-green'
                : pctChangeClass(change) === 'negative'
                  ? 'text-red'
                  : 'text-text-muted'
          )}
        >
          {formatPct(change)}
        </div>
      )}
    </div>
  );
}
