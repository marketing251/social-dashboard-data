import type { Insight } from '@/lib/kpi/insights';
import { PLATFORM_META, type MergedPeriodRow, type Platform } from '@/lib/kpi/types';
import { KPICard } from '@/components/dashboard/KPICard';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { TrendLineChart, type LineSeries } from '@/components/dashboard/TrendLineChart';
import { formatNum, formatPct, pctChangeClass } from '@/lib/kpi/format';

type Metric = { value: number | null; change: number | null };

export interface SummaryViewProps {
  metrics: { reach: Metric; audience: Metric; interactions: Metric };
  engagementRate: number;
  engagementChange: number | null;
  trendSeries: LineSeries[];
  latest: MergedPeriodRow;
  prev: MergedPeriodRow | null;
  rowCount: number;
  insights: Insight[];
  aiGeneratedAt: string | null;
  /** Platforms reported last period but not yet in the latest one */
  missingPlatforms: Platform[];
}

export function SummaryView({ metrics, engagementRate, engagementChange, trendSeries, latest, prev, rowCount, insights, aiGeneratedAt, missingPlatforms }: SummaryViewProps) {
  const missingLabels = missingPlatforms.map((p) => PLATFORM_META[p].label);
  return (
    <div className="space-y-8 print:space-y-5">
      <section>
        <h2 className="section-title">Aggregated KPIs (All Platforms)</h2>
        {missingLabels.length > 0 && (
          <p className="text-sm text-warning -mt-2 mb-4">
            {missingLabels.join(' and ')} {missingLabels.length > 1 ? "haven't" : "hasn't"} been reported for {latest.period_label} yet, so {missingLabels.length > 1 ? 'they are' : 'it is'} left out of the totals and the % changes compare only platforms reported in both periods.
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3">
          <KPICard label="Total Reach" value={metrics.reach.value} change={metrics.reach.change} variant="reach" />
          <KPICard label="Total Audience" value={metrics.audience.value} change={metrics.audience.change} variant="audience" />
          <KPICard label="Total Interactions" value={metrics.interactions.value} change={metrics.interactions.change} variant="interactions" />
          <KPICard label="Engagement Rate" value={Number(engagementRate.toFixed(1))} change={engagementChange} variant="engagement" suffix="%" />
        </div>
      </section>
      {rowCount >= 3 && (
        <section>
          <h2 className="section-title">Audience Growth</h2>
          <div className="card p-6 print:p-3">
            <TrendLineChart series={trendSeries} height={320} printHeight={230} />
          </div>
        </section>
      )}
      <section>
        <h2 className="section-title">Platform Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 print:grid-cols-3 print:gap-3">
          {(Object.entries(PLATFORM_META) as [Platform, (typeof PLATFORM_META)[Platform]][]).map(([p, meta]) => {
            const snap = latest.byPlatform[p]; const prevSnap = prev?.byPlatform[p];
            if (!snap && !prevSnap) return null;
            if (!snap) {
              return (
                <div key={p} className="card p-6 print:p-3">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border print:mb-2 print:pb-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: meta.color }} />
                    <h3 className="font-bold print:text-sm">{meta.label}</h3>
                  </div>
                  <p className="text-sm text-text-muted">Not yet reported for {latest.period_label}.</p>
                </div>
              );
            }
            return (
              <div key={p} className="card p-6 print:p-3">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border print:mb-2 print:pb-2">
                  <span className="w-3 h-3 rounded-full" style={{ background: meta.color }} />
                  <h3 className="font-bold print:text-sm">{meta.label}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 print:grid-cols-3 print:gap-1.5">
                  {(['followers','impressions','views','likes','comments'] as const).map(m => {
                    const v = snap[m]; if (v == null) return null;
                    const pv = prevSnap?.[m];
                    const ch = typeof pv === 'number' && pv !== 0 ? ((v - pv) / pv) * 100 : null;
                    return (<div key={m} className="bg-bg rounded-sm p-3 print:p-2">
                      <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1 print:text-[8px] print:mb-0.5">{m}</div>
                      <div className="text-lg font-bold print:text-sm">{formatNum(v)}</div>
                      {ch != null && <div className={`text-xs font-semibold print:text-[9px] ${pctChangeClass(ch) === 'positive' ? 'text-green' : pctChangeClass(ch) === 'negative' ? 'text-red' : 'text-text-muted'}`}>{formatPct(ch)}</div>}
                    </div>);
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {insights.length > 0 && (
        <section className="print:break-before-page">
          <h2 className="section-title">
            Key Insights
            {aiGeneratedAt && <span className="ml-2 text-xs font-normal text-text-muted">AI-generated {aiGeneratedAt}</span>}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
            {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
          </div>
        </section>
      )}
    </div>
  );
}
