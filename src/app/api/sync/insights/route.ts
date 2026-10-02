import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { refreshAiInsights } from '@/lib/run-sheet-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// "Sync now" step 2: regenerate the AI insights from the synced data and
// report the outcome (including the error) back to the header button.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not set in Vercel' }, { status: 400 });

  const ai = await refreshAiInsights(createAdminClient());
  if (ai.errors.length > 0) return NextResponse.json({ error: ai.errors.join(' | '), generated: ai.generated }, { status: 502 });
  return NextResponse.json({ generated: ai.generated });
}
