// Regression check: a stray single-platform row must not become the latest period.
//   npx tsx scripts/test-sparse-tail.mts
import { fetchSheetKpis } from '../src/lib/sheet-sync';
import { mergeSnapshotsByPeriod, trimSparseTail, missingInLatest } from '../src/lib/kpi/aggregate';
import { buildInsightPrompt } from '../src/lib/ai-insights';
import { PLATFORMS, type KpiSnapshot, type PlatformAccount } from '../src/lib/kpi/types';

const weekly = (await fetchSheetKpis()).filter((r) => r.period === 'weekly');
const stray = { ...weekly.find((r) => r.platform === 'youtube')!, period_start: '2026-09-28', period_end: '2026-10-04', period_label: '09/28-10/04', views: 960500, followers: 393 };
const withStray = [...weekly, stray].sort((a, b) => a.period_start.localeCompare(b.period_start));

const accounts: PlatformAccount[] = PLATFORMS.map((p) => ({ id: p, platform: p, handle: p, display_name: null, profile_url: null, active: true }));
const snaps = withStray.map((r) => ({ ...r, id: '', account_id: r.platform, reach: null, comments: null, saves: null, source: '', created_at: '' })) as unknown as KpiSnapshot[];
const rows = trimSparseTail(mergeSnapshotsByPeriod(accounts, snaps), (r) => Object.keys(r.byPlatform).length);
const latest = rows[rows.length - 1];
const { latestStart } = buildInsightPrompt('weekly', withStray);

const ok = latest.period_label === '09/20-09/26' && latestStart === '2026-09-20' && missingInLatest(rows).length === 0;
console.log(`dashboard latest: ${latest.period_label} (${Object.keys(latest.byPlatform).length} platforms)`);
console.log(`AI prompt latest: ${latestStart}`);
console.log(`not reported: ${missingInLatest(rows).join(', ') || 'none'}`);
console.log(ok ? 'PASS' : 'FAIL');
process.exitCode = ok ? 0 : 1;
