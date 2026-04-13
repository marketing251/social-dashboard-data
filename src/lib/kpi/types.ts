export type Period = 'weekly' | 'monthly' | 'quarterly';

export type Platform =
  | 'twitter'
  | 'instagram'
  | 'facebook'
  | 'youtube'
  | 'tiktok'
  | 'linkedin';

export type ContentType =
  | 'reels'
  | 'long_video'
  | 'carousel'
  | 'static_image'
  | 'stories'
  | 'text_thread';

export interface KpiSnapshot {
  id: string;
  account_id: string;
  period: Period;
  period_start: string;
  period_end: string;
  period_label: string;
  followers: number | null;
  impressions: number | null;
  reach: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  watch_time_seconds: number | null;
  engagement_rate: number | null;
  source: string;
  created_at: string;
}

export interface PlatformAccount {
  id: string;
  platform: Platform;
  handle: string;
  display_name: string | null;
  profile_url: string | null;
  active: boolean;
}

export interface Competitor {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  is_self: boolean;
  instagram_url: string | null;
  twitter_url: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  linkedin_url: string | null;
  display_order: number;
}

export interface CompetitorSnapshot {
  competitor_id: string;
  snapshot_date: string;
  instagram_followers: number | null;
  twitter_followers: number | null;
  facebook_followers: number | null;
  youtube_subscribers: number | null;
  tiktok_followers: number | null;
  linkedin_followers: number | null;
}

export interface ContentBenchmark {
  competitor_id: string;
  content_type: ContentType;
  avg_engagement: number | null;
  avg_impressions: number | null;
  avg_likes: number | null;
  avg_comments: number | null;
  content_mix_pct: number | null;
}

export interface ContentTopic {
  topic: string;
  avg_engagement: number;
  color: string | null;
  display_order: number | null;
}

/**
 * A period-joined dataset: for a given Period, an array of rows where each row
 * has all 6 platforms merged under one period_start.
 */
export interface MergedPeriodRow {
  period_start: string;
  period_label: string;
  byPlatform: Partial<Record<Platform, KpiSnapshot>>;
}

export const PLATFORMS: Platform[] = [
  'twitter',
  'instagram',
  'facebook',
  'youtube',
  'tiktok',
  'linkedin',
];

export const PLATFORM_META: Record<
  Platform,
  { label: string; color: string; followerKey: 'followers' }
> = {
  twitter: { label: 'Twitter / X', color: '#1da1f2', followerKey: 'followers' },
  instagram: { label: 'Instagram', color: '#e1306c', followerKey: 'followers' },
  facebook: { label: 'Facebook', color: '#1877f2', followerKey: 'followers' },
  youtube: { label: 'YouTube', color: '#ff0000', followerKey: 'followers' },
  tiktok: { label: 'TikTok', color: '#00f2ea', followerKey: 'followers' },
  linkedin: { label: 'LinkedIn', color: '#0a66c2', followerKey: 'followers' },
};
