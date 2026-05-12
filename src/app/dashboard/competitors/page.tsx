export const dynamic = "force-dynamic";
import {
  loadCompetitors,
  loadLatestCompetitorSnapshots,
  loadKpiSnapshots,
} from '@/lib/kpi/load';
import { formatNum } from '@/lib/kpi/format';
import { StackedBarChart } from '@/components/dashboard/StackedBarChart';

export default async function CompetitorsPage() {
  const [competitors, snapshots, { rows }] = await Promise.all([
    loadCompetitors(),
    loadLatestCompetitorSnapshots(),
    loadKpiSnapshots('weekly'),
  ]);

  // Build competitor totals — PropAccount pulls live from KPI snapshots
  const paLatest = rows[rows.length - 1];

  const enriched = competitors.map((c) => {
    if (c.is_self && paLatest) {
      const by = paLatest.byPlatform;
      const ig = by.instagram?.followers ?? 0;
      const tw = by.twitter?.followers ?? 0;
      const yt = by.youtube?.followers ?? 0;
      const fb = by.facebook?.followers ?? 0;
      const tt = by.tiktok?.followers ?? 0;
      const li = by.linkedin?.followers ?? 0;
      return { ...c, ig, tw, yt, fb, tt, li, total: ig + tw + yt + fb + tt + li };
    }
    const s = snapshots.find((x) => x.competitor_id === c.id);
    const ig = s?.instagram_followers ?? 0;
    const tw = s?.twitter_followers ?? 0;
    const yt = s?.youtube_subscribers ?? 0;
    const fb = s?.facebook_followers ?? 0;
    const tt = s?.tiktok_followers ?? 0;
    const li = s?.linkedin_followers ?? 0;
    return { ...c, ig, tw, yt, fb, tt, li, total: ig + tw + yt + fb + tt + li };
  });

  const ranked = [...enriched].sort((a, b) => {
    if (a.is_self) return -1;
    if (b.is_self) return 1;
    return b.total - a.total;
  });

  // Bar chart data
  const chartData = (key: 'ig' | 'tw' | 'yt') =>
    ranked
      .filter((c) => c[key] > 0)
      .map((c) => ({ x: c.name, y: c[key] }));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="section-title">Competitor Landscape</h2>
        <p className="text-sm text-text-muted mb-4">
          Follower counts from latest snapshots. PropAccount values are live from analytics data.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ranked.map((c, i) => {
            const rank = i + 1;
            const badge =
              rank === 1 ? 'bg-amber-500/20 text-amber-500' :
              rank === 2 ? 'bg-text-muted/20 text-text-muted' :
              rank === 3 ? 'bg-orange-700/20 text-orange-500' :
              'bg-accent/15 text-accent';

            return (
              <div
                key={c.id}
                className={`card p-5 relative ${c.is_self ? 'border-2 border-accent' : ''}`}
              >
                <span className={`absolute top-3 right-3 text-[11px] font-bold px-2 py-0.5 rounded-full ${badge}`}>
                  #{rank}
                </span>
                <div className="font-bold text-base mb-3">{c.name}</div>
                <div className="grid grid-cols-2 gap-2">
                  <MetricCell label="Instagram" value={c.ig} />
                  <MetricCell label="X" value={c.tw} />
                  <MetricCell label="YouTube" value={c.yt} />
                  {c.is_self && <MetricCell label="Facebook" value={c.fb} />}
                  {c.is_self && <MetricCell label="TikTok" value={c.tt} />}
                  {c.is_self && <MetricCell label="LinkedIn" value={c.li} />}
                  <div className="col-span-2 bg-accent/15 rounded-sm p-2">
                    <div className="text-[10px] uppercase tracking-wide text-text-muted">Total</div>
                    <div className="text-lg font-bold text-accent">{formatNum(c.total)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="section-title">Follower Comparison</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ChartCard title="Instagram">
            <StackedBarChart
              horizontal
              stacked={false}
              series={[{ label: 'Instagram', color: '#e1306c', data: chartData('ig') }]}
            />
          </ChartCard>
          <ChartCard title="X / Twitter">
            <StackedBarChart
              horizontal
              stacked={false}
              series={[{ label: 'X', color: '#1da1f2', data: chartData('tw') }]}
            />
          </ChartCard>
          <ChartCard title="YouTube">
            <StackedBarChart
              horizontal
              stacked={false}
              series={[{ label: 'YouTube', color: '#ff0000', data: chartData('yt') }]}
            />
          </ChartCard>
        </div>
      </section>

      <section>
        <h2 className="section-title">All Competitors &amp; Social Links</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent/10 text-text-muted text-[11px] uppercase tracking-wide">
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Links</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map(c => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3 text-text-muted">{c.description}</td>
                  <td className="p-3 flex gap-3 text-xs">
                    {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">site</a>}
                    {c.instagram_url && <a href={c.instagram_url} target="_blank" rel="noopener noreferrer" className="text-instagram hover:underline">IG</a>}
                    {c.twitter_url && <a href={c.twitter_url} target="_blank" rel="noopener noreferrer" className="text-twitter hover:underline">X</a>}
                    {c.youtube_url && <a href={c.youtube_url} target="_blank" rel="noopener noreferrer" className="text-youtube hover:underline">YT</a>}
                    {c.tiktok_url && <a href={c.tiktok_url} target="_blank" rel="noopener noreferrer" className="hover:underline">TT</a>}
                    {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-linkedin hover:underline">LI</a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg rounded-sm p-2">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className="text-base font-bold">{formatNum(value)}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}
