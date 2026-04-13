import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const entrySchema = z.object({
  account_id: z.string().uuid(),
  period: z.enum(['weekly', 'monthly', 'quarterly']),
  period_start: z.string(),
  period_end: z.string(),
  period_label: z.string().min(1),
  followers: z.number().int().nullable().optional(),
  impressions: z.number().int().nullable().optional(),
  views: z.number().int().nullable().optional(),
  likes: z.number().int().nullable().optional(),
  comments: z.number().int().nullable().optional(),
  shares: z.number().int().nullable().optional(),
  saves: z.number().int().nullable().optional(),
  engagement_rate: z.number().nullable().optional(),
});

export async function POST(request: Request) {
  // Require authenticated user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = entrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('kpi_snapshots')
    .upsert(
      { ...parsed.data, source: 'manual' },
      { onConflict: 'account_id,period,period_start' }
    );

  if (error) {
    console.error('[manual-entry]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
