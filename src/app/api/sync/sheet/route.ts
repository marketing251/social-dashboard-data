import { NextResponse, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncSheetToDb, refreshAiInsights } from '@/lib/run-sheet-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// "Sync now" from the dashboard header. Same sync as the daily cron, but
// authorized by the signed-in user's session. The data sync completes before
// responding; AI insights regenerate in the background afterwards.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const result = await syncSheetToDb(admin);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 });

  const aiEnabled = !!process.env.ANTHROPIC_API_KEY;
  if (aiEnabled) after(() => refreshAiInsights(admin, result.synced));
  return NextResponse.json({ synced: result.synced, byPeriod: result.byPeriod, aiRefreshing: aiEnabled });
}
