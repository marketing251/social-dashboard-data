import { loadKpiSnapshots } from '@/lib/kpi/load';
import { summaryMetrics } from '@/lib/kpi/aggregate';
import { generateInsights } from '@/lib/kpi/insights';
import { PLATFORM_META, type Period, type Platform } from '@/lib/kpi/types';
import { KPICard } from '@/components/dashboard/KPICard';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { formatNum, formatPct, pctChangeClass, pctChange } from '@/lib/kpi/format';

export default async function SummaryPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const period = (typeof searchParams.period === 'string' ? searchParams.period : 'weekly') as Period;
  const { rows } = await loadKpiSnapshots(period);
  if (rows.length === 0) {
    return <div className="card p-10 text-center"><h2 className="text-xl font-bold mb-2">No data yet</h2><p className="text-text-muted text-sm">Run the backfill SQL in Supabase to load historical data.</p></div>;
  }
  const metrics = summaryMetrics(rows);
  const insights = generateInsights(rows, period);
  const latest = rows[rows.length - 1];
  const prev = rows.length >= 2 ? rows[rows.length - 2] : null;
  const twEng = latest.byPlatform.twitter?.engagement_rate ?? 0;
  const twEngPrev = prev?.byPlatform.twitter?.engagement_rate ?? twEng;
  const engCh = twEngPrev ? pctChange(twEng, twEngPrev) : null;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="section-title">Aggregated KPIs (All Platforms)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label="Total Reach" value={metrics.reach.value} change={metrics.reach.change} variant="reach" />
          <KPICard label="Total Audience" value={metrics.audience.value} change={metrics.audience.change} variant="audience" />
          <KPICard label="Total Interactions" value={metrics.interactions.value} change={metrics.interactions.change} variant="interactions" />
          <KPICard label="Avg Engagement" value={Number(twEng.toFixed(1))} change={engCh} variant="engagement" />
        </div>
      </section>
      <section>
        <h2 className="section-title">Platform Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {(Object.entries(PLATFORM_META) as [Platform, (typeof PLATFORM_META)[Platform]][]).map(([p, meta]) => {
            const snap = latest.byPlatform[p]; const prevSnap = prev?.byPlatform[p];
            if (!snap) return null;
            return (
              <div key={p} className="card p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <span className="w-3 h-3 rounded-full" style={{ background: meta.color }} />
                  <h3 className="font-bold">{meta.label}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['followers','impressions','views','likes','comments'] as const).map(m => {
                    const v = snap[m]; if (v == null) return null;
                    const pv = prevSnap?.[m];
                    const ch = typeof pv === 'number' && pv !== 0 ? ((v - pv) / pv) * 100 : null;
                    return (<div key={m} className="bg-bg rounded-sm p-3">
                      <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1">{m}</div>
                      <div className="text-lg font-bold">{formatNum(v)}</div>
                      {ch != null && <div className={pctChangeClass(ch) === 'positive' ? 'text-green text-xs font-semibold' : pctChangeClass(ch) === 'negative' ? 'text-red text-xs font-semibold' : 'text-text-muted text-xs font-semibold'}>{formatPct(ch)}</div>}
                    </div>);
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {insights.length > 0 && (
        <section>
          <h2 className="section-title">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {insights.map((ins, i) => <InsightCard key={i} insight={ins} />)}
          </div>
        </section>
      )}
    </div>
  );
}
