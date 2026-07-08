import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const schema = z.object({
  account_id: z.string().uuid(), period: z.enum(['weekly','monthly','quarterly']),
  period_start: z.string(), period_end: z.string(), period_label: z.string().min(1),
  followers: z.number().nullable().optional(), impressions: z.number().nullable().optional(),
  views: z.number().nullable().optional(), likes: z.number().nullable().optional(),
  comments: z.number().nullable().optional(), shares: z.number().nullable().optional(),
  engagement_rate: z.number().nullable().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { error } = await createAdminClient().from('kpi_snapshots').upsert({ ...parsed.data, source: 'manual' }, { onConflict: 'account_id,period,period_start' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
