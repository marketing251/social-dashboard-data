import { createAdminClient } from '@/lib/supabase/admin';
import type { SocialConnector, SyncResult } from './base';
import { startOfWeek, endOfWeek, formatISO } from 'date-fns';

/**
 * YouTube Data API v3 — uses a simple API key (no OAuth needed for public data).
 *
 * Setup:
 *   1. Go to https://console.cloud.google.com/apis/library/youtube.googleapis.com
 *   2. Enable the API
 *   3. Create an API key under Credentials
 *   4. Set YOUTUBE_API_KEY in Vercel env vars
 *
 * Quotas: 10,000 units/day. statistics.list costs 1 unit per call.
 */

const API = 'https://www.googleapis.com/youtube/v3';

async function getChannelStats(channelId: string, apiKey: string) {
  const url = `${API}/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`YouTube API ${res.status}`);
  const json = await res.json();
  const channel = json.items?.[0];
  if (!channel) throw new Error('Channel not found');
  return {
    subscriberCount: Number(channel.statistics.subscriberCount) || 0,
    viewCount: Number(channel.statistics.viewCount) || 0,
    videoCount: Number(channel.statistics.videoCount) || 0,
    title: channel.snippet?.title ?? null,
  };
}

export const youtubeConnector: SocialConnector = {
  platform: 'youtube',

  async fetchFollowers(accountId, handle): Promise<SyncResult> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return { rowsInserted: 0, rowsUpdated: 0, error: 'YOUTUBE_API_KEY not set' };

    // `handle` is stored as the channel ID (UCUmea-rprFpgeuADi5MWXzw)
    const stats = await getChannelStats(handle, apiKey);

    const now = new Date();
    const periodStart = startOfWeek(now, { weekStartsOn: 1 });
    const periodEnd = endOfWeek(now, { weekStartsOn: 1 });

    const supabase = createAdminClient();
    const { error, count } = await supabase
      .from('kpi_snapshots')
      .upsert(
        {
          account_id: accountId,
          period: 'weekly',
          period_start: formatISO(periodStart, { representation: 'date' }),
          period_end: formatISO(periodEnd, { representation: 'date' }),
          period_label: `${periodStart.toLocaleDateString()}-${periodEnd.toLocaleDateString()}`,
          followers: stats.subscriberCount,
          views: stats.viewCount,
          source: 'youtube_api',
          raw_data: stats,
        },
        { onConflict: 'account_id,period,period_start', count: 'exact' }
      );

    if (error) return { rowsInserted: 0, rowsUpdated: 0, error: error.message };
    return { rowsInserted: count ?? 1, rowsUpdated: 0 };
  },

  async fetchRecentPosts(_accountId, _handle): Promise<SyncResult> {
    // TODO: use /search + /videos to pull last N uploads with statistics
    // search.list costs 100 units — be frugal
    return { rowsInserted: 0, rowsUpdated: 0 };
  },
};
