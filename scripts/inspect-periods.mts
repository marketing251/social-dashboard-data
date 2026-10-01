// Dry-run the AI insight prompt against the live Google Sheet (no DB, no API call):
//   npx tsx scripts/inspect-periods.mts [weekly|monthly|quarterly]
import { fetchSheetKpis } from '../src/lib/sheet-sync';
import { buildInsightPrompt } from '../src/lib/ai-insights';

const rows = await fetchSheetKpis();
const periods = process.argv[2] ? [process.argv[2]] : ['weekly', 'monthly', 'quarterly'];
for (const period of periods as Array<'weekly' | 'monthly' | 'quarterly'>) {
  const snaps = rows
    .filter((r) => r.period === period)
    .sort((a, b) => a.period_start.localeCompare(b.period_start));
  const { user, latestStart } = buildInsightPrompt(period, snaps);
  console.log(`\n===== ${period} (data_through ${latestStart})`);
  console.log(user.slice(user.indexOf('The latest period'), user.indexOf('Every insight')).trim());
}
