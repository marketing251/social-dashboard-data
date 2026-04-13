import { formatNum, formatPct, pctChangeClass } from '@/lib/kpi/format';
import { cn } from '@/lib/utils';

interface Props {
  label: string;
  value: number | null;
  change: number | null;
  variant?: 'reach' | 'audience' | 'engagement' | 'interactions' | 'default';
}

const VARIANT_BG = {
  reach: 'bg-gradient-to-br from-indigo-500 to-purple-500',
  audience: 'bg-gradient-to-br from-green-500 to-green-600',
  engagement: 'bg-gradient-to-br from-amber-500 to-amber-600',
  interactions: 'bg-gradient-to-br from-pink-500 to-pink-600',
  default: 'bg-card border border-border',
};

export function KPICard({ label, value, change, variant = 'default' }: Props) {
  const isHero = variant !== 'default';
  return (
    <div
      className={cn(
        'rounded-lg p-6 transition',
        VARIANT_BG[variant],
        isHero ? 'text-white text-center' : ''
      )}
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
        {formatNum(value)}
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
