import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncSheetToDb, refreshAiInsights } from '@/lib/run-sheet-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Daily sync of the PropAccount Google Sheet into kpi_snapshots, followed by
// AI insight regeneration. Signed-in users can trigger the same sync from the
// dashboard header via POST /api/sync/sheet.
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const result = await syncSheetToDb(supabase);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  const ai = await refreshAiInsights(supabase, result.synced);
  return NextResponse.json({ synced: result.synced, byPeriod: result.byPeriod, aiInsights: ai });
}
