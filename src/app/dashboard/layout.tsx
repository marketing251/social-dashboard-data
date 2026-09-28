import { DashboardNav, type AsOfByPeriod } from '@/components/dashboard/DashboardNav';
import { createClient } from '@/lib/supabase/server';
import { loadLatestSheetSync } from '@/lib/kpi/load';
export const dynamic = 'force-dynamic';

// '2026-07-04' -> '07/04/2026' (string-only to avoid timezone shifts)
const fmtDate = (d: string) => { const [y, m, day] = d.split('-'); return `${m}/${day}/${y}`; };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const latestFor = (period: string) =>
    supabase.from('kpi_snapshots').select('period_label, period_start, period_end').eq('period', period).order('period_start', { ascending: false }).limit(1).maybeSingle();
  const [{ data: weekly }, { data: monthly }, { data: quarterly }, sync] = await Promise.all([
    latestFor('weekly'), latestFor('monthly'), latestFor('quarterly'), loadLatestSheetSync(),
  ]);
  const asOf: AsOfByPeriod = {
    weekly: weekly ? fmtDate(weekly.period_end) : undefined,
    monthly: monthly ? `${monthly.period_label} ${monthly.period_end.slice(0, 4)}` : undefined,
    quarterly: quarterly ? `${quarterly.period_label} (${fmtDate(quarterly.period_start)} – ${fmtDate(quarterly.period_end)})` : undefined,
  };
  return (<div className="min-h-screen"><DashboardNav asOf={asOf} sync={sync} /><main className="px-4 sm:px-8 py-6 max-w-[1440px] mx-auto">{children}</main></div>);
}
