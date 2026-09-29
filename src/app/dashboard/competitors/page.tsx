export const dynamic = "force-dynamic";
import {
  loadCompetitors,
  loadLatestCompetitorSnapshots,
  loadKpiSnapshots,
} from '@/lib/kpi/load';
import { formatNum } from '@/lib/kpi/format';

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
    // null = account gone or never tracked; rendered as an em dash, not 0
    const ig = s?.instagram_followers ?? null;
    const tw = s?.twitter_followers ?? null;
    const yt = s?.youtube_subscribers ?? null;
    const fb = s?.facebook_followers ?? null;
    const tt = s?.tiktok_followers ?? null;
    const li = s?.linkedin_followers ?? null;
    const total = (ig ?? 0) + (tw ?? 0) + (yt ?? 0) + (fb ?? 0) + (tt ?? 0) + (li ?? 0);
    const igShutDown = ig == null && !!c.instagram_url && /shut down/i.test(s?.notes ?? '');
    return { ...c, ig, tw, yt, fb, tt, li, total, igShutDown };
  });

  const ranked = [...enriched].sort((a, b) => {
    if (a.is_self) return -1;
    if (b.is_self) return 1;
    return b.total - a.total;
  });
  // Cards only for competitors with at least one tracked public count
  const tracked = ranked.filter((c) => c.is_self || c.total > 0);
  const untrackedCount = ranked.length - tracked.length;
  const directory = competitors.filter((c) => !c.is_self);

  // Bar chart data
  const chartData = (key: 'ig' | 'tw' | 'yt') =>
    ranked
      .filter((c) => (c[key] ?? 0) > 0)
      .map((c) => ({ x: c.name, y: c[key] ?? 0 }));

  const latestSnapshotDate = snapshots.reduce((d, s) => (s.snapshot_date > d ? s.snapshot_date : d), '');
  const snapshotAsOf = latestSnapshotDate
    ? new Date(latestSnapshotDate + 'T00:00:00Z').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric', timeZone: 'UTC' })
    : null;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="section-title">Competitor Landscape</h2>
        <p className="text-sm text-text-muted mb-4">
          Direct white-label competitors, ranked by total public followers captured {snapshotAsOf ?? 'from latest snapshots'}. PropAccount values are live from analytics data. A dash means no account or no public count.
          {untrackedCount > 0 && ` ${untrackedCount} more competitors with no public follower counts are listed in the directory below.`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
          {tracked.map((c, i) => {
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
                  <MetricCell label="Instagram" value={c.ig} status={'igShutDown' in c && c.igShutDown ? 'Shut down' : undefined} />
                  <MetricCell label="X" value={c.tw} />
                  <MetricCell label="YouTube" value={c.yt} />
                  {(c.is_self || c.fb != null) && <MetricCell label="Facebook" value={c.fb} />}
                  {(c.is_self || c.tt != null) && <MetricCell label="TikTok" value={c.tt} />}
                  {(c.is_self || c.li != null) && <MetricCell label="LinkedIn" value={c.li} />}
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
          <BarListCard title="Instagram" color="#e1306c" data={chartData('ig')} />
          <BarListCard title="X / Twitter" color="#1da1f2" data={chartData('tw')} />
          <BarListCard title="YouTube" color="#ff0000" data={chartData('yt')} />
        </div>
      </section>

      <section>
        <h2 className="section-title">Competitor Directory ({directory.length})</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent/10 text-text-muted text-[11px] uppercase tracking-wide">
                <th className="p-3 text-left">Company</th>
                <th className="p-3 text-left">What they offer</th>
                <th className="p-3 text-left">Links</th>
              </tr>
            </thead>
            <tbody>
              {directory.map(c => (
                <tr key={c.id} className="border-t border-border align-top print:break-inside-avoid">
                  <td className="p-3 font-semibold whitespace-nowrap">
                    {c.website ? <a href={c.website} target="_blank" rel="noopener noreferrer" className="hover:text-accent">{c.name}</a> : c.name}
                  </td>
                  <td className="p-3">
                    <div className="text-text-muted">{c.description}</div>
                    {c.notes && <div className="mt-1 text-xs text-text-muted/80 italic">{c.notes}</div>}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                      {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Site</a>}
                      {c.linkedin_url && <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-linkedin hover:underline">LinkedIn</a>}
                      {c.twitter_url && <a href={c.twitter_url} target="_blank" rel="noopener noreferrer" className="text-twitter hover:underline">X</a>}
                      {c.instagram_url && <a href={c.instagram_url} target="_blank" rel="noopener noreferrer" className="text-instagram hover:underline">Instagram</a>}
                      {c.facebook_url && <a href={c.facebook_url} target="_blank" rel="noopener noreferrer" className="text-facebook hover:underline">Facebook</a>}
                      {c.youtube_url && <a href={c.youtube_url} target="_blank" rel="noopener noreferrer" className="text-youtube hover:underline">YouTube</a>}
                      {c.tiktok_url && <a href={c.tiktok_url} target="_blank" rel="noopener noreferrer" className="hover:underline">TikTok</a>}
                    </div>
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

function MetricCell({ label, value, status }: { label: string; value: number | null; status?: string }) {
  return (
    <div className="bg-bg rounded-sm p-2">
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      {status
        ? <div className="text-sm font-semibold text-red py-0.5">{status}</div>
        : <div className={`text-base font-bold ${value == null ? 'text-text-muted' : ''}`}>{value == null ? '—' : formatNum(value)}</div>}
    </div>
  );
}

function BarListCard({ title, color, data }: { title: string; color: string; data: Array<{ x: string; y: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.y));
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="text-sm text-text-muted">No data.</p>
      ) : (
        <div className="space-y-3">
          {data.map((d) => (
            <div key={d.x}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-text-muted truncate pr-2">{d.x}</span>
                <span className="font-bold shrink-0">{formatNum(d.y)}</span>
              </div>
              <div className="h-2.5 bg-bg rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(d.y / max) * 100}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
