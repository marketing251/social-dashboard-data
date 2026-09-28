export const dynamic = "force-dynamic";
import { loadKpiSnapshots } from '@/lib/kpi/load';
import { PLATFORM_META, type Period, type Platform } from '@/lib/kpi/types';
import { formatNum, formatPct, pctChange, pctChangeClass } from '@/lib/kpi/format';
import { TrendLineChart } from '@/components/dashboard/TrendLineChart';

const METRICS = ['followers', 'impressions', 'views', 'likes', 'comments', 'shares', 'engagement_rate'] as const;
type Metric = (typeof METRICS)[number];
const METRIC_LABELS: Record<Metric, string> = {
  followers: 'Followers',
  impressions: 'Impressions',
  views: 'Views',
  likes: 'Likes',
  comments: 'Comments',
  shares: 'Shares',
  engagement_rate: 'Engagement Rate',
};

export default async function PlatformsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const period = (typeof sp.period === 'string' ? sp.period : 'weekly') as Period;
  const selected = (typeof sp.platform === 'string' ? sp.platform : 'twitter') as Platform;
  const { rows } = await loadKpiSnapshots(period);
  if (rows.length === 0) return <div className="card p-10 text-center text-text-muted">No data.</div>;
  const platforms = Object.keys(PLATFORM_META) as Platform[];
  const latest = rows[rows.length - 1]; const prev = rows.length >= 2 ? rows[rows.length - 2] : null;
  const snap = latest.byPlatform[selected]; const prevSnap = prev?.byPlatform[selected]; const meta = PLATFORM_META[selected];

  // Metrics this platform actually reports (drives both the KPI boxes and the chart)
  const available = METRICS.filter((m) => snap?.[m] != null);
  const requested = typeof sp.metric === 'string' ? (sp.metric as Metric) : null;
  const metric: Metric = requested && available.includes(requested) ? requested : (available[0] ?? 'followers');

  const chartData = rows.map((r) => ({ x: r.period_label, y: r.byPlatform[selected]?.[metric] ?? null }));

  const href = (p: Platform, m?: Metric) => `?period=${period}&platform=${p}${m ? `&metric=${m}` : ''}`;

  return (
    <div className="space-y-6">
      <section>
        <h2 className="section-title">Select Platform</h2>
        <div className="flex gap-2 flex-wrap">
          {platforms.map(p => <a key={p} href={href(p, requested ?? undefined)} className={`px-4 py-2 rounded-full text-xs font-semibold border-2 transition ${selected === p ? 'text-white' : 'bg-transparent hover:opacity-80'}`} style={selected === p ? { background: PLATFORM_META[p].color, borderColor: PLATFORM_META[p].color } : { borderColor: PLATFORM_META[p].color, color: PLATFORM_META[p].color }}>{PLATFORM_META[p].label}</a>)}
        </div>
      </section>
      <section>
        <h2 className="section-title">KPI Summary — {meta.label}</h2>
        <p className="text-sm text-text-muted -mt-2 mb-4">Select a metric to chart it below.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {available.map(m => {
            const v = snap?.[m]; if (v == null) return null;
            const pv = prevSnap?.[m]; const ch = typeof pv === 'number' ? pctChange(typeof v === 'number' ? v : 0, pv) : null;
            const active = m === metric;
            return (
              <a key={m} href={href(selected, m)} className={`card p-5 block transition hover:border-accent ${active ? 'border-2' : ''}`} style={active ? { borderColor: meta.color } : undefined}>
                <div className="text-xs uppercase tracking-wide text-text-muted mb-1">{METRIC_LABELS[m]}</div>
                <div className="text-2xl font-bold">{m === 'engagement_rate' ? `${(v as number).toFixed(1)}%` : formatNum(v as number)}</div>
                {ch != null && <div className={pctChangeClass(ch) === 'positive' ? 'text-green text-sm font-semibold' : pctChangeClass(ch) === 'negative' ? 'text-red text-sm font-semibold' : 'text-text-muted text-sm font-semibold'}>{formatPct(ch)}</div>}
              </a>
            );
          })}
        </div>
      </section>
      <section>
        <h2 className="section-title">{METRIC_LABELS[metric]} Trend — {meta.label}</h2>
        <div className="card p-6">
          <TrendLineChart series={[{ label: METRIC_LABELS[metric], color: meta.color, data: chartData }]} height={340} />
        </div>
      </section>
    </div>
  );
}
