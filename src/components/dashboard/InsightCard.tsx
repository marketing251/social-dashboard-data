import type { Insight } from '@/lib/kpi/insights';
import { cn } from '@/lib/utils';

const CLS_BG = {
  positive: 'bg-green/15',
  negative: 'bg-red/15',
  warning: 'bg-warning/15',
  info: 'bg-accent/15',
};

const TAG_STYLE = {
  win: 'bg-green/15 text-green',
  alert: 'bg-red/15 text-red',
  action: 'bg-accent/15 text-accent',
  watch: 'bg-warning/15 text-warning',
};

export function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className="card p-5 flex gap-4 items-start">
      <div
        className={cn(
          'w-10 h-10 rounded-md flex items-center justify-center text-xl flex-shrink-0',
          CLS_BG[insight.cls]
        )}
      >
        {insight.icon}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-text mb-1">{insight.title}</h4>
        <p className="text-xs text-text-muted leading-relaxed">{insight.body}</p>
        <span
          className={cn(
            'inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold',
            TAG_STYLE[insight.tag]
          )}
        >
          {insight.tagLabel}
        </span>
      </div>
    </div>
  );
}
