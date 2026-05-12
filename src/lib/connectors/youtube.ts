import { createAdminClient } from '@/lib/supabase/admin';
import type { SocialConnector, SyncResult } from './base';
import { startOfWeek, endOfWeek, formatISO } from 'date-fns';

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

async function getRecentVideos(channelId: string, apiKey: string, maxResults = 15) {
  // Step 1: Get the uploads playlist ID
  const chUrl = `${API}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
  const chRes = await fetch(chUrl, { cache: 'no-store' });
  if (!chRes.ok) throw new Error(`YouTube channels API ${chRes.status}`);
  const chJson = await chRes.json();
  const uploadsPlaylistId = chJson.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsPlaylistId) throw new Error('No uploads playlist found');

  // Step 2: Get recent video IDs from the uploads playlist (costs 1 unit)
  const plUrl = `${API}/playlistItems?part=contentDetails,snippet&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`;
  const plRes = await fetch(plUrl, { cache: 'no-store' });
  if (!plRes.ok) throw new Error(`YouTube playlistItems API ${plRes.status}`);
  const plJson = await plRes.json();
  const videoIds = (plJson.items || []).map((item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId);
  if (videoIds.length === 0) return [];

  // Step 3: Get video statistics (costs 1 unit per 50 videos)
  const vUrl = `${API}/videos?part=statistics,snippet,contentDetails&id=${videoIds.join(',')}&key=${apiKey}`;
  const vRes = await fetch(vUrl, { cache: 'no-store' });
  if (!vRes.ok) throw new Error(`YouTube videos API ${vRes.status}`);
  const vJson = await vRes.json();

  return (vJson.items || []).map((v: {
    id: string;
    snippet: { title: string; publishedAt: string; description: string };
    statistics: { viewCount: string; likeCount: string; commentCount: string };
    contentDetails: { duration: string };
  }) => ({
    videoId: v.id,
    title: v.snippet.title,
    publishedAt: v.snippet.publishedAt,
    description: v.snippet.description?.substring(0, 200),
    views: Number(v.statistics.viewCount) || 0,
    likes: Number(v.statistics.likeCount) || 0,
    comments: Number(v.statistics.commentCount) || 0,
    duration: v.contentDetails.duration,
    isShort: (v.contentDetails.duration || '').match(/PT(\d+)S/) !== null ||
             ((v.contentDetails.duration || '').match(/PT(\d+)M/) && Number((v.contentDetails.duration || '').match(/PT(\d+)M/)?.[1]) <= 1),
  }));
}

export const youtubeConnector: SocialConnector = {
  platform: 'youtube',

  async fetchFollowers(accountId, handle): Promise<SyncResult> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return { rowsInserted: 0, rowsUpdated: 0, error: 'YOUTUBE_API_KEY not set' };

    const stats = await getChannelStats(handle, apiKey);
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
          followers: stats.subscriberCount,
          views: stats.viewCount,
          source: 'youtube_api',
          raw_data: stats,
        },
        { onConflict: 'account_id,period,period_start' }
      );

    if (error) return { rowsInserted: 0, rowsUpdated: 0, error: error.message };
    return { rowsInserted: 1, rowsUpdated: 0 };
  },

  async fetchRecentPosts(accountId, handle): Promise<SyncResult> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return { rowsInserted: 0, rowsUpdated: 0, error: 'YOUTUBE_API_KEY not set' };

    const videos = await getRecentVideos(handle, apiKey, 15);
    if (videos.length === 0) return { rowsInserted: 0, rowsUpdated: 0 };

    const supabase = createAdminClient();
    const rows = videos.map((v: {
      videoId: string; title: string; publishedAt: string;
      views: number; likes: number; comments: number; isShort: boolean;
    }) => ({
      account_id: accountId,
      external_post_id: v.videoId,
      content_type: v.isShort ? 'reels' : 'long_video',
      posted_at: v.publishedAt,
      caption: v.title,
      permalink: `https://www.youtube.com/watch?v=${v.videoId}`,
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      impressions: v.views,
      metadata: v,
      last_synced_at: new Date().toISOString(),
    }));

    const { error, count } = await supabase
      .from('post_metrics')
      .upsert(rows, { onConflict: 'account_id,external_post_id', count: 'exact' });

    if (error) return { rowsInserted: 0, rowsUpdated: 0, error: error.message };
    return { rowsInserted: count ?? rows.length, rowsUpdated: 0 };
  },
};
