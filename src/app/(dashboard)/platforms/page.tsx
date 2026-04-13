import { loadKpiSnapshots } from '@/lib/kpi/load';
import { PLATFORM_META, type Period, type Platform } from '@/lib/kpi/types';
import { TrendChart } from '@/components/dashboard/TrendChart';
import { formatNum, formatPct, pctChange, pctChangeClass } from '@/lib/kpi/format';

export default async function PlatformsPage({
  searchParams,
}: {
  searchParams: { period?: string; platform?: string };
}) {
  const period = (searchParams.period || 'weekly') as Period;
  const selected = (searchParams.platform || 'twitter') as Platform;
  const { rows } = await loadKpiSnapshots(period);

  if (rows.length === 0) {
    return <div className="card p-10 text-center text-text-muted">No data available.</div>;
  }

  const platforms = Object.keys(PLATFORM_META) as Platform[];
  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const snap = latest.byPlatform[selected];
  const prevSnap = prev?.byPlatform[selected];
  const meta = PLATFORM_META[selected];

  const seriesFollowers = [{
    label: `${meta.label} Followers`,
    color: meta.color,
    data: rows.map(r => ({
      x: r.period_label,
      y: r.byPlatform[selected]?.followers ?? 0,
    })),
  }];

  return (
    <div className="space-y-6">
      <section>
        <h2 className="section-title">Select Platform</h2>
        <div className="flex gap-2 flex-wrap">
          {platforms.map(p => (
            <a
              key={p}
              href={`?period=${period}&platform=${p}`}
              className={`px-4 py-2 rounded-full text-xs font-semibold border-2 transition ${
                selected === p
                  ? 'text-white'
                  : 'bg-transparent hover:opacity-80'
              }`}
              style={
                selected === p
                  ? { background: PLATFORM_META[p].color, borderColor: PLATFORM_META[p].color }
                  : { borderColor: PLATFORM_META[p].color, color: PLATFORM_META[p].color }
              }
            >
              {PLATFORM_META[p].label}
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">KPI Summary &mdash; {meta.label}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['followers', 'impressions', 'views', 'likes', 'comments', 'shares', 'engagement_rate'] as const).map(m => {
            const v = snap?.[m];
            if (v == null) return null;
            const pv = prevSnap?.[m];
            const ch = typeof pv === 'number' ? pctChange(typeof v === 'number' ? v : 0, pv) : null;
            const isRate = m === 'engagement_rate';
            return (
              <div key={m} className="card p-5">
                <div className="text-xs uppercase tracking-wide text-text-muted mb-1">{m.replace('_', ' ')}</div>
                <div className="text-2xl font-bold">
                  {isRate ? `${(v as number).toFixed(1)}%` : formatNum(v as number)}
                </div>
                {ch != null && (
                  <div className={
                    pctChangeClass(ch) === 'positive' ? 'text-green text-sm font-semibold' :
                    pctChangeClass(ch) === 'negative' ? 'text-red text-sm font-semibold' :
                    'text-text-muted text-sm font-semibold'
                  }>{formatPct(ch)}</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="section-title">Follower Trend</h2>
        <div className="card p-6">
          <TrendChart series={seriesFollowers} />
        </div>
      </section>

      <section>
        <h2 className="section-title">Weekly Breakdown</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent/10 text-text-muted text-[11px] uppercase tracking-wide">
                <th className="p-3 text-left">Period</th>
                <th className="p-3 text-right">Followers</th>
                <th className="p-3 text-right">Impressions / Views</th>
                <th className="p-3 text-right">Likes</th>
                <th className="p-3 text-right">Comments</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const s = r.byPlatform[selected];
                return (
                  <tr key={r.period_start} className="border-t border-border hover:bg-accent/5">
                    <td className="p-3">{r.period_label}</td>
                    <td className="p-3 text-right">{formatNum(s?.followers ?? 0)}</td>
                    <td className="p-3 text-right">{formatNum(s?.impressions ?? s?.views ?? 0)}</td>
                    <td className="p-3 text-right">{formatNum(s?.likes ?? 0)}</td>
                    <td className="p-3 text-right">{formatNum(s?.comments ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
