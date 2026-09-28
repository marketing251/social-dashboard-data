import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { youtubeConnector } from '@/lib/connectors/youtube';
import { instagramConnector } from '@/lib/connectors/instagram';
import { twitterConnector } from '@/lib/connectors/twitter';
import { linkedinConnector } from '@/lib/connectors/linkedin';
import type { SocialConnector } from '@/lib/connectors/base';
import type { Platform } from '@/lib/kpi/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CONNECTORS: Record<Platform, SocialConnector | null> = {
  youtube: youtubeConnector,
  instagram: instagramConnector,
  twitter: twitterConnector,
  linkedin: linkedinConnector,
  facebook: null,
  tiktok: null,
};

// Skip platforms whose API credentials aren't configured instead of
// logging a failed sync for them every week.
const REQUIRED_ENV: Partial<Record<Platform, string>> = {
  youtube: 'YOUTUBE_API_KEY',
  instagram: 'INSTAGRAM_ACCESS_TOKEN',
  twitter: 'X_BEARER_TOKEN',
  linkedin: 'LINKEDIN_ACCESS_TOKEN',
};

export async function GET(request: Request) {
  // Vercel Cron authenticates with Authorization: Bearer <CRON_SECRET>
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: accounts } = await supabase
    .from('platform_accounts')
    .select('id, platform, handle, display_name')
    .eq('active', true);

  if (!accounts) {
    return NextResponse.json({ error: 'No accounts' }, { status: 500 });
  }

  const results: Array<{ platform: string; handle: string; result: unknown }> = [];

  for (const acc of accounts) {
    const connector = CONNECTORS[acc.platform as Platform];
    if (!connector) {
      results.push({
        platform: acc.platform,
        handle: acc.handle,
        result: { skipped: 'no connector' },
      });
      continue;
    }
    const envKey = REQUIRED_ENV[acc.platform as Platform];
    if (envKey && !process.env[envKey]) {
      results.push({
        platform: acc.platform,
        handle: acc.handle,
        result: { skipped: `${envKey} not configured` },
      });
      continue;
    }

    const started = Date.now();
    try {
      const r = await connector.fetchFollowers(acc.id, acc.handle);
      await supabase.from('sync_logs').insert({
        platform: acc.platform,
        account_id: acc.id,
        status: r.error ? 'failed' : 'success',
        rows_inserted: r.rowsInserted,
        rows_updated: r.rowsUpdated,
        error_message: r.error,
        duration_ms: Date.now() - started,
        finished_at: new Date().toISOString(),
      });
      results.push({ platform: acc.platform, handle: acc.handle, result: r });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      await supabase.from('sync_logs').insert({
        platform: acc.platform,
        account_id: acc.id,
        status: 'failed',
        error_message: msg,
        duration_ms: Date.now() - started,
        finished_at: new Date().toISOString(),
      });
      results.push({ platform: acc.platform, handle: acc.handle, result: { error: msg } });
    }
  }

  return NextResponse.json({ ran: results.length, results });
}
