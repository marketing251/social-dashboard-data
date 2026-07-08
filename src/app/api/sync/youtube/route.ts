import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { youtubeConnector } from '@/lib/connectors/youtube';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: accounts } = await admin
    .from('platform_accounts')
    .select('id, handle')
    .eq('platform', 'youtube')
    .eq('active', true);

  const results = [];
  for (const acc of accounts ?? []) {
    try {
      const followers = await youtubeConnector.fetchFollowers(acc.id, acc.handle);
      const posts = await youtubeConnector.fetchRecentPosts(acc.id, acc.handle);
      results.push({ account: acc.handle, followers, posts });
    } catch (err) {
      results.push({ account: acc.handle, error: err instanceof Error ? err.message : 'unknown' });
    }
  }

  return NextResponse.json({ platform: 'youtube', results });
}
