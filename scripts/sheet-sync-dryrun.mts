// Dry-run the Google Sheet parser without touching the database:
//   npx tsx scripts/sheet-sync-dryrun.mts
import { fetchSheetKpis } from '../src/lib/sheet-sync';

const rows = await fetchSheetKpis();
const by: Record<string, number> = {};
for (const r of rows) by[`${r.period}:${r.platform}`] = (by[`${r.period}:${r.platform}`] ?? 0) + 1;
console.log('total rows:', rows.length);
console.log(by);

const latestWeek = rows.filter((r) => r.period === 'weekly').sort((a, b) => a.period_start.localeCompare(b.period_start)).slice(-6);
for (const r of latestWeek)
  console.log('W', r.platform, r.period_start, r.period_label, 'fol=', r.followers, 'imp=', r.impressions, 'views=', r.views, 'likes=', r.likes, 'eng=', r.engagement_rate, 'watch_s=', r.watch_time_seconds);

for (const r of rows.filter((r) => r.period === 'quarterly'))
  console.log('Q', r.platform, r.period_label, r.period_start, '->', r.period_end, 'fol=', r.followers, 'views=', r.views, 'imp=', r.impressions, 'watch_s=', r.watch_time_seconds);

const m = rows.filter((r) => r.period === 'monthly' && r.platform === 'twitter').map((r) => `${r.period_label}(${r.period_start}) imp=${r.impressions} fol=${r.followers}`);
console.log('twitter monthly:', m.join(' | '));
