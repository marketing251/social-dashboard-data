// Dry-run the Summary tab's headline totals and rule-based insights against the
// live Google Sheet (no DB):  npx tsx scripts/verify-summary.mts
import { fetchSheetKpis } from '../src/lib/sheet-sync';
import { mergeSnapshotsByPeriod, summaryMetrics, missingInLatest } from '../src/lib/kpi/aggregate';
import { generateInsights } from '../src/lib/kpi/insights';
import { PLATFORMS, type KpiSnapshot, type PlatformAccount } from '../src/lib/kpi/types';

const all = await fetchSheetKpis();
const accounts: PlatformAccount[] = PLATFORMS.map((p) => ({ id: p, platform: p, handle: p, display_name: null, profile_url: null, active: true }));
for (const period of ['weekly', 'monthly', 'quarterly'] as const) {
  const snaps = all.filter((r) => r.period === period).map((r) => ({ ...r, id: '', account_id: r.platform, reach: null, comments: null, saves: null, source: '', created_at: '' })) as unknown as KpiSnapshot[];
  const rows = mergeSnapshotsByPeriod(accounts, snaps);
  const m = summaryMetrics(rows);
  const latest = rows[rows.length - 1];
  console.log(`\n===== ${period}: latest ${latest.period_label}; not reported: ${missingInLatest(rows).join(', ') || 'none'}`);
  console.log(`reach ${m.reach.value} (${m.reach.change?.toFixed(1)}%)  audience ${m.audience.value} (${m.audience.change?.toFixed(1)}%)  interactions ${m.interactions.value} (${m.interactions.change?.toFixed(1)}%)`);
  for (const i of generateInsights(rows, period)) console.log(`  [${i.cls}] ${i.title}`);
}
