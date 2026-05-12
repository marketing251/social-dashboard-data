import { createAdminClient } from '@/lib/supabase/admin';
import type { SocialConnector, SyncResult } from './base';
import { startOfWeek, endOfWeek, formatISO } from 'date-fns';

const API = 'https://api.x.com/2';

async function xFetch(path: string, token: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`X API ${res.status}: ${text.substring(0, 200)}`);
  }
  return res.json();
}

export const twitterConnector: SocialConnector = {
  platform: 'twitter',

  async fetchFollowers(accountId, handle): Promise<SyncResult> {
    const token = process.env.X_BEARER_TOKEN;
    if (!token) return { rowsInserted: 0, rowsUpdated: 0, error: 'X_BEARER_TOKEN not set' };

    // Get user by username with public metrics
    const userData = await xFetch(
      `/users/by/username/${handle}?user.fields=public_metrics,created_at`,
      token
    );
    const user = userData.data;
    if (!user) return { rowsInserted: 0, rowsUpdated: 0, error: 'User not found' };

    const metrics = user.public_metrics;
    const now = new Date();
    const periodStart = startOfWeek(now, { weekStartsOn: 1 });
    const periodEnd = endOfWeek(now, { weekStartsOn: 1 });

    const supabase = createAdminClient();
    const { error } = await supabase
      .from('kpi_snapshots')
      .upsert(
        {
          account_id: accountId,
          period: 'weekly',
          period_start: formatISO(periodStart, { representation: 'date' }),
          period_end: formatISO(periodEnd, { representation: 'date' }),
          period_label: `${(periodStart.getMonth()+1).toString().padStart(2,'0')}/${periodStart.getDate().toString().padStart(2,'0')}-${(periodEnd.getMonth()+1).toString().padStart(2,'0')}/${periodEnd.getDate().toString().padStart(2,'0')}`,
          followers: metrics.followers_count,
          impressions: metrics.listed_count,
          source: 'x_api',
          raw_data: { user: user },
        },
        { onConflict: 'account_id,period,period_start' }
      );

    if (error) return { rowsInserted: 0, rowsUpdated: 0, error: error.message };
    return { rowsInserted: 1, rowsUpdated: 0 };
  },

  async fetchRecentPosts(accountId, handle): Promise<SyncResult> {
    const token = process.env.X_BEARER_TOKEN;
    if (!token) return { rowsInserted: 0, rowsUpdated: 0, error: 'X_BEARER_TOKEN not set' };

    // Get user ID first
    const userData = await xFetch(`/users/by/username/${handle}`, token);
    const userId = userData.data?.id;
    if (!userId) return { rowsInserted: 0, rowsUpdated: 0, error: 'User not found' };

    // Get recent tweets with metrics
    const tweetsData = await xFetch(
      `/users/${userId}/tweets?max_results=10&tweet.fields=public_metrics,created_at,entities&exclude=retweets,replies`,
      token
    );

    const tweets = tweetsData.data || [];
    if (tweets.length === 0) return { rowsInserted: 0, rowsUpdated: 0 };

    const supabase = createAdminClient();
    const rows = tweets.map((t: {
      id: string;
      text: string;
      created_at: string;
      public_metrics: {
        like_count: number;
        reply_count: number;
        retweet_count: number;
        impression_count: number;
        quote_count: number;
      };
    }) => ({
      account_id: accountId,
      external_post_id: t.id,
      content_type: 'text_thread' as const,
      posted_at: t.created_at,
      caption: t.text.substring(0, 500),
      permalink: `https://x.com/${handle}/status/${t.id}`,
      likes: t.public_metrics.like_count,
      comments: t.public_metrics.reply_count,
      shares: t.public_metrics.retweet_count + (t.public_metrics.quote_count || 0),
      impressions: t.public_metrics.impression_count,
      views: t.public_metrics.impression_count,
      metadata: t,
      last_synced_at: new Date().toISOString(),
    }));

    const { error, count } = await supabase
      .from('post_metrics')
      .upsert(rows, { onConflict: 'account_id,external_post_id', count: 'exact' });

    if (error) return { rowsInserted: 0, rowsUpdated: 0, error: error.message };
    return { rowsInserted: count ?? rows.length, rowsUpdated: 0 };
  },
};
