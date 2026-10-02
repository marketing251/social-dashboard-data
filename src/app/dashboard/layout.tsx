import { DashboardNav, type AsOfByPeriod } from '@/components/dashboard/DashboardNav';
import { loadKpiSnapshots, loadLatestSheetSync } from '@/lib/kpi/load';
import type { MergedPeriodRow } from '@/lib/kpi/types';
export const dynamic = 'force-dynamic';

// '2026-07-04' -> '07/04/2026' (string-only to avoid timezone shifts)
const fmtDate = (d: string) => { const [y, m, day] = d.split('-'); return `${m}/${day}/${y}`; };

// Same latest period the pages show (sparse trailing periods already trimmed)
function latestOf(rows: MergedPeriodRow[]) {
  const row = rows[rows.length - 1];
  const snap = row && Object.values(row.byPlatform)[0];
  return row && snap ? { label: row.period_label, start: row.period_start, end: snap.period_end } : null;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [weekly, monthly, quarterly, sync] = await Promise.all([
    loadKpiSnapshots('weekly').then((r) => latestOf(r.rows)),
    loadKpiSnapshots('monthly').then((r) => latestOf(r.rows)),
    loadKpiSnapshots('quarterly').then((r) => latestOf(r.rows)),
    loadLatestSheetSync(),
  ]);
  const asOf: AsOfByPeriod = {
    weekly: weekly ? fmtDate(weekly.end) : undefined,
    monthly: monthly ? `${monthly.label} ${monthly.end.slice(0, 4)}` : undefined,
    quarterly: quarterly ? `${quarterly.label} (${fmtDate(quarterly.start)} – ${fmtDate(quarterly.end)})` : undefined,
  };
  return (<div className="min-h-screen"><DashboardNav asOf={asOf} sync={sync} /><main className="px-4 sm:px-8 py-6 max-w-[1440px] mx-auto print:p-0 print:max-w-none">{children}</main></div>);
}
