import { createClient } from '@/lib/supabase/server';
import type { KpiSnapshot, MergedPeriodRow, Period, PlatformAccount, Competitor, CompetitorSnapshot, ContentBenchmark, ContentTopic } from './types';
import { mergeSnapshotsByPeriod, trimSparseTail } from './aggregate';

export async function loadPlatformAccounts(): Promise<PlatformAccount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('platform_accounts').select('*').eq('active', true);
  if (error) { console.error('[load]', error); return []; }
  return (data ?? []) as PlatformAccount[];
}
export async function loadKpiSnapshots(period: Period): Promise<{ accounts: PlatformAccount[]; rows: MergedPeriodRow[] }> {
  const accounts = await loadPlatformAccounts();
  if (accounts.length === 0) return { accounts, rows: [] };
  const supabase = await createClient();
  const { data, error } = await supabase.from('kpi_snapshots').select('*').eq('period', period).in('account_id', accounts.map(a => a.id)).order('period_start', { ascending: true });
  if (error) { console.error('[load]', error); return { accounts, rows: [] }; }
  const merged = mergeSnapshotsByPeriod(accounts, (data ?? []) as KpiSnapshot[]);
  return { accounts, rows: trimSparseTail(merged, (r) => Object.keys(r.byPlatform).length) };
}
export async function loadCompetitors(): Promise<Competitor[]> {
  const { data } = await (await createClient()).from('competitors').select('*').order('display_order', { ascending: true });
  return (data ?? []) as Competitor[];
}
export async function loadLatestCompetitorSnapshots(): Promise<CompetitorSnapshot[]> {
  const { data } = await (await createClient()).from('competitor_snapshots').select('*').order('snapshot_date', { ascending: false });
  const map = new Map<string, CompetitorSnapshot>();
  for (const row of (data ?? []) as CompetitorSnapshot[]) { if (!map.has(row.competitor_id)) map.set(row.competitor_id, row); }
  return Array.from(map.values());
}
export async function loadContentBenchmarks(): Promise<ContentBenchmark[]> {
  const { data } = await (await createClient()).from('content_benchmarks').select('*');
  return (data ?? []) as ContentBenchmark[];
}
export async function loadContentTopics(): Promise<ContentTopic[]> {
  const { data } = await (await createClient()).from('content_topics').select('*').order('display_order', { ascending: true });
  return (data ?? []) as ContentTopic[];
}
export interface SheetSyncStatus { status: 'success' | 'partial' | 'failed'; finished_at: string | null; rows_inserted: number | null; error_message: string | null }
/** Latest Google Sheet sync run (sync_logs rows with account_id null). */
export async function loadLatestSheetSync(): Promise<SheetSyncStatus | null> {
  const { data } = await (await createClient())
    .from('sync_logs')
    .select('status, finished_at, rows_inserted, error_message')
    .is('account_id', null)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SheetSyncStatus) ?? null;
}
export async function loadAiInsights(period: Period): Promise<{ insights: unknown[]; generated_at: string; data_through: string | null } | null> {
  // select * so this keeps working before the data_through column exists
  const { data } = await (await createClient())
    .from('ai_insights')
    .select('*')
    .eq('period', period)
    .maybeSingle();
  if (!data) return null;
  return { insights: data.insights, generated_at: data.generated_at, data_through: data.data_through ?? null };
}
