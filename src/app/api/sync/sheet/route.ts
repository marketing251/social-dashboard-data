import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncSheetToDb } from '@/lib/run-sheet-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// "Sync now" step 1: pull the Google Sheet into kpi_snapshots (same sync as
// the daily cron), authorized by the signed-in user's session. The header
// button then calls /api/sync/insights to regenerate AI insights.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const result = await syncSheetToDb(createAdminClient());
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ synced: result.synced, byPeriod: result.byPeriod, aiEnabled: !!process.env.ANTHROPIC_API_KEY });
}
