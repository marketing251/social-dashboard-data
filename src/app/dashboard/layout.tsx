import { DashboardNav } from '@/components/dashboard/DashboardNav';
import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: latest } = await supabase.from('kpi_snapshots').select('period_label, period_end').eq('period', 'weekly').order('period_start', { ascending: false }).limit(1).maybeSingle();
  const asOf = latest ? new Date(latest.period_end).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : undefined;
  return (<div className="min-h-screen"><DashboardNav asOf={asOf} /><main className="px-8 py-6 max-w-[1440px] mx-auto">{children}</main></div>);
}
