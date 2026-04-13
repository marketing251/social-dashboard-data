import { loadKpiSnapshots } from '@/lib/kpi/load';
import { summaryMetrics, sumField } from '@/lib/kpi/aggregate';
import { generateInsights } from '@/lib/kpi/insights';
import { PLATFORM_META, type Period } from '@/lib/kpi/types';
import { KPICard } from '@/components/dashboard/KPICard';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { StackedBarChart } from '@/components/dashboard/StackedBarChart';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { formatNum, formatPct, pctChangeClass } from '@/lib/kpi/format';

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const period = (searchParams.period || 'weekly') as Period;
  const { rows } = await loadKpiSnapshots(period);

  if (rows.length === 0) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-xl font-bold mb-2">No data yet</h2>
        <p className="text-text-muted text-sm">
          Import KPI data via <code>/api/admin/import-csv</code> or run the seed script to get started.
        </p>
      </div>
    );
  }

  const metrics = summaryMetrics(rows);
  const insights = generateInsights(rows, period);

  // Per-platform summary data
  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const twEngLatest = latest.byPlatform.twitter?.engagement_rate ?? 0;
  const twEngPrev = prev?.byPlatform.twitter?.engagement_rate ?? twEngLatest;
  const engChange = twEngPrev
    ? ((twEngLatest - twEngPrev) / twEngPrev) * 100
    : null;

  // Trend series: audience per platform
  const audienceSeries = Object.entries(PLATFORM_META).map(([p, meta]) => ({
    label: meta.label,
    color: meta.color,
    data: rows.map((r) => ({
      x: r.period_label,
      y: r.byPlatform[p as keyof typeof PLATFORM_META]?.followers ?? 0,
    })),
  }));

  // Stacked reach per platform
  const reachSeries = Object.entries(PLATFORM_META).map(([p, meta]) => ({
    label: meta.label,
    color: meta.color,
    data: rows.map((r) => ({
      x: r.period_label,
      y:
        r.byPlatform[p as keyof typeof PLATFORM_META]?.impressions ??
        r.byPlatform[p as keyof typeof PLATFORM_META]?.views ??
        0,
    })),
  }));

  return (
    <div className="space-y-8">
      {/* Hero KPIs */}
      <section>
        <h2 className="section-title">Aggregated KPIs (All Platforms)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total Reach"
            value={metrics.reach.value}
            change={metrics.reach.change}
            variant="reach"
          />
          <KPICard
            label="Total Audience"
            value={metrics.audience.value}
            change={metrics.audience.change}
            variant="audience"
          />
          <KPICard
            label="Total Interactions"
            value={metrics.interactions.value}
            change={metrics.interactions.change}
            variant="interactions"
          />
          <KPICard
            label="Avg Engagement Rate"
            value={Number(twEngLatest.toFixed(1))}
            change={engChange}
            variant="engagement"
          />
        </div>
      </section>

      {/* Platform overview */}
      <section>
        <h2 className="section-title">Platform Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {Object.entries(PLATFORM_META).map(([p, meta]) => {
            const key = p as keyof typeof PLATFORM_META;
            const snap = latest.byPlatform[key];
            const prevSnap = prev?.byPlatform[key];
            if (!snap) return null;
            return (
              <div key={p} className="card p-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ background: meta.color }}
                  />
                  <h3 className="font-bold">{meta.label}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(['followers', 'impressions', 'views', 'likes', 'comments'] as const).map(
                    (m) => {
                      const v = snap[m];
                      if (v == null) return null;
                      const pv = prevSnap?.[m];
                      const ch =
                        typeof pv === 'number' && pv !== 0
                          ? ((v - pv) / pv) * 100
                          : null;
                      return (
                        <div key={m} className="bg-bg rounded-sm p-3">
                          <div className="text-[10px] uppercase tracking-wide text-text-muted mb-1">
                            {m}
                          </div>
                          <div className="text-lg font-bold">{formatNum(v)}</div>
                          {ch != null && (
                            <div
                              className={
                                pctChangeClass(ch) === 'positive'
                                  ? 'text-green text-xs font-semibold'
                                  : pctChangeClass(ch) === 'negative'
                                    ? 'text-red text-xs font-semibold'
                                    : 'text-text-muted text-xs font-semibold'
                              }
                            >
                              {formatPct(ch)}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Trends */}
      <section>
        <h2 className="section-title">Cross-Platform Trends</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card p-6">
            <h3 className="font-semibold mb-3">Total Audience Over Time</h3>
            <TrendChart series={audienceSeries} />
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-3">Reach by Platform (Stacked)</h3>
            <StackedBarChart series={reachSeries} stacked />
          </div>
        </div>
      </section>

      {/* Insights */}
      {insights.length > 0 && (
        <section>
          <h2 className="section-title">Key Insights &amp; Recommendations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {insights.map((ins, i) => (
              <InsightCard key={i} insight={ins} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
