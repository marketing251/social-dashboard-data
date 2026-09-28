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

  // Auto-capture competitor YouTube subscriber counts (public API, free quota).
  // Non-self competitors with a youtube_url get a weekly snapshot row.
  const ytKey = process.env.YOUTUBE_API_KEY;
  let competitorYt: unknown = { skipped: 'YOUTUBE_API_KEY not configured' };
  if (ytKey) {
    const outcomes: Array<{ name: string; subscribers?: number; error?: string }> = [];
    const { data: comps } = await supabase
      .from('competitors')
      .select('id, name, youtube_url')
      .eq('is_self', false)
      .not('youtube_url', 'is', null);
    const today = new Date().toISOString().slice(0, 10);
    for (const comp of comps ?? []) {
      try {
        const url = String(comp.youtube_url);
        const channelMatch = url.match(/\/channel\/([\w-]+)/);
        const handleMatch = url.match(/\/@([\w.-]+)/);
        const query = channelMatch
          ? `id=${channelMatch[1]}`
          : handleMatch
            ? `forHandle=@${handleMatch[1]}`
            : null;
        if (!query) { outcomes.push({ name: comp.name, error: 'unrecognized youtube_url' }); continue; }
        const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=statistics&${query}&key=${ytKey}`);
        const json = await res.json();
        const subs = Number(json?.items?.[0]?.statistics?.subscriberCount);
        if (!Number.isFinite(subs)) { outcomes.push({ name: comp.name, error: 'channel not found' }); continue; }
        // Carry the other platforms forward from the newest snapshot so this
        // row doesn't blank them out as the competitor's "latest" numbers
        const { data: prior } = await supabase
          .from('competitor_snapshots')
          .select('snapshot_date, instagram_followers, twitter_followers, facebook_followers, tiktok_followers, linkedin_followers')
          .eq('competitor_id', comp.id)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        await supabase.from('competitor_snapshots').upsert(
          {
            competitor_id: comp.id,
            snapshot_date: today,
            youtube_subscribers: subs,
            instagram_followers: prior?.instagram_followers ?? null,
            twitter_followers: prior?.twitter_followers ?? null,
            facebook_followers: prior?.facebook_followers ?? null,
            tiktok_followers: prior?.tiktok_followers ?? null,
            linkedin_followers: prior?.linkedin_followers ?? null,
            notes: `YouTube auto-captured; other platforms carried from ${prior?.snapshot_date ?? 'n/a'}`,
            source: 'youtube_api_auto',
          },
          { onConflict: 'competitor_id,snapshot_date' }
        );
        outcomes.push({ name: comp.name, subscribers: subs });
      } catch (err) {
        outcomes.push({ name: comp.name, error: err instanceof Error ? err.message : 'unknown' });
      }
    }
    competitorYt = outcomes;
  }

  return NextResponse.json({ ran: results.length, results, competitorYt });
}
