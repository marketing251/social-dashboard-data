import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchSheetKpis } from '@/lib/sheet-sync';
import { generateAiInsights } from '@/lib/ai-insights';

export type SheetSyncResult =
  | { ok: true; synced: number; byPeriod: Record<string, number> }
  | { ok: false; error: string };

type LogStatus = 'success' | 'partial' | 'failed';

async function logSync(admin: SupabaseClient, started: number, status: LogStatus, rowsInserted: number, errorMessage?: string) {
  await admin.from('sync_logs').insert({
    platform: null,
    account_id: null,
    status,
    rows_inserted: rowsInserted,
    error_message: errorMessage ?? null,
    duration_ms: Date.now() - started,
    finished_at: new Date().toISOString(),
  });
}

/**
 * Pull the Google Sheet and upsert it into kpi_snapshots. Upserts on
 * (account_id, period, period_start), so re-runs are safe and corrections
 * made in the sheet propagate. Every outcome is recorded in sync_logs
 * (account_id null = sheet sync), which drives the header sync chip.
 */
export async function syncSheetToDb(admin: SupabaseClient): Promise<SheetSyncResult> {
  const started = Date.now();
  let rows;
  try {
    rows = await fetchSheetKpis();
  } catch (err) {
    const error = `Sheet fetch/parse failed: ${err instanceof Error ? err.message : 'unknown'}`;
    await logSync(admin, started, 'failed', 0, error);
    return { ok: false, error };
  }

  const { data: accounts, error: accErr } = await admin.from('platform_accounts').select('id, platform').eq('active', true);
  if (accErr || !accounts) {
    const error = accErr?.message ?? 'No active platform accounts';
    await logSync(admin, started, 'failed', 0, error);
    return { ok: false, error };
  }
  const accountByPlatform = new Map(accounts.map((a) => [a.platform as string, a.id as string]));

  const payload = rows.flatMap((r) => {
    const account_id = accountByPlatform.get(r.platform);
    if (!account_id) return [];
    return [{
      account_id,
      period: r.period,
      period_start: r.period_start,
      period_end: r.period_end,
      period_label: r.period_label,
      followers: r.followers,
      impressions: r.impressions,
      views: r.views,
      likes: r.likes,
      shares: r.shares,
      engagement_rate: r.engagement_rate,
      watch_time_seconds: r.watch_time_seconds,
      source: 'google_sheets_sync',
    }];
  });

  const { error: upsertErr } = await admin.from('kpi_snapshots').upsert(payload, { onConflict: 'account_id,period,period_start' });
  if (upsertErr) {
    await logSync(admin, started, 'failed', 0, upsertErr.message);
    return { ok: false, error: upsertErr.message };
  }
  await logSync(admin, started, 'success', payload.length);

  const byPeriod: Record<string, number> = {};
  for (const p of payload) byPeriod[p.period] = (byPeriod[p.period] ?? 0) + 1;
  return { ok: true, synced: payload.length, byPeriod };
}

/**
 * Regenerate AI insights from the synced data. Never throws; a failure is
 * logged as a 'partial' sync so the header chip shows it.
 */
export async function refreshAiInsights(admin: SupabaseClient, syncedRows: number) {
  const ai = await generateAiInsights(admin);
  if (ai.errors.length > 0) {
    await logSync(admin, Date.now(), 'partial', syncedRows, `Data synced; AI insights failed: ${ai.errors.join(' | ')}`);
  }
  return ai;
}
