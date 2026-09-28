import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchSheetKpis } from '@/lib/sheet-sync';
import { generateAiInsights } from '@/lib/ai-insights';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Daily sync of the PropAccount Google Sheet into kpi_snapshots.
// Upserts on (account_id, period, period_start), so re-runs are safe and
// corrections made in the sheet propagate to the dashboard.
// Sync outcomes are recorded in sync_logs (account_id null = sheet sync);
// after a successful sync, AI insights are regenerated (best-effort).
export async function GET(request: Request) {
  const started = Date.now();
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const logSync = async (status: 'success' | 'failed', rowsInserted: number, errorMessage?: string) => {
    await supabase.from('sync_logs').insert({
      platform: null,
      account_id: null,
      status,
      rows_inserted: rowsInserted,
      error_message: errorMessage ?? null,
      duration_ms: Date.now() - started,
      finished_at: new Date().toISOString(),
    });
  };

  let rows;
  try {
    rows = await fetchSheetKpis();
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    await logSync('failed', 0, `Sheet fetch/parse failed: ${msg}`);
    return NextResponse.json({ error: `Sheet fetch/parse failed: ${msg}` }, { status: 502 });
  }
  const { data: accounts, error: accErr } = await supabase
    .from('platform_accounts')
    .select('id, platform')
    .eq('active', true);
  if (accErr || !accounts) {
    return NextResponse.json({ error: accErr?.message ?? 'No accounts' }, { status: 500 });
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

  const { error: upsertErr } = await supabase
    .from('kpi_snapshots')
    .upsert(payload, { onConflict: 'account_id,period,period_start' });
  if (upsertErr) {
    await logSync('failed', 0, upsertErr.message);
    return NextResponse.json({ error: upsertErr.message, attempted: payload.length }, { status: 500 });
  }
  await logSync('success', payload.length);

  // Regenerate AI insights from the fresh data; never fails the sync
  const ai = await generateAiInsights(supabase);

  const counts: Record<string, number> = {};
  for (const p of payload) counts[p.period] = (counts[p.period] ?? 0) + 1;
  return NextResponse.json({ synced: payload.length, byPeriod: counts, aiInsights: ai });
}
