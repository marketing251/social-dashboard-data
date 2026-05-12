import { createClient } from '@/lib/supabase/server';
import type { KpiSnapshot, MergedPeriodRow, Period, PlatformAccount, Competitor, CompetitorSnapshot, ContentBenchmark, ContentTopic } from './types';
import { mergeSnapshotsByPeriod } from './aggregate';

export async function loadPlatformAccounts(): Promise<PlatformAccount[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('platform_accounts').select('*').eq('active', true);
  if (error) { console.error('[load]', error); return []; }
  return (data ?? []) as PlatformAccount[];
}
export async function loadKpiSnapshots(period: Period): Promise<{ accounts: PlatformAccount[]; rows: MergedPeriodRow[] }> {
  const accounts = await loadPlatformAccounts();
  if (accounts.length === 0) return { accounts, rows: [] };
  const supabase = createClient();
  const { data, error } = await supabase.from('kpi_snapshots').select('*').eq('period', period).in('account_id', accounts.map(a => a.id)).order('period_start', { ascending: true });
  if (error) { console.error('[load]', error); return { accounts, rows: [] }; }
  return { accounts, rows: mergeSnapshotsByPeriod(accounts, (data ?? []) as KpiSnapshot[]) };
}
export async function loadCompetitors(): Promise<Competitor[]> {
  const { data } = await createClient().from('competitors').select('*').order('display_order', { ascending: true });
  return (data ?? []) as Competitor[];
}
export async function loadLatestCompetitorSnapshots(): Promise<CompetitorSnapshot[]> {
  const { data } = await createClient().from('competitor_snapshots').select('*').order('snapshot_date', { ascending: false });
  const map = new Map<string, CompetitorSnapshot>();
  for (const row of (data ?? []) as CompetitorSnapshot[]) { if (!map.has(row.competitor_id)) map.set(row.competitor_id, row); }
  return Array.from(map.values());
}
export async function loadContentBenchmarks(): Promise<ContentBenchmark[]> {
  const { data } = await createClient().from('content_benchmarks').select('*');
  return (data ?? []) as ContentBenchmark[];
}
export async function loadContentTopics(): Promise<ContentTopic[]> {
  const { data } = await createClient().from('content_topics').select('*').order('display_order', { ascending: true });
  return (data ?? []) as ContentTopic[];
}
