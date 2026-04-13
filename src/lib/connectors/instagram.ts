import type { SocialConnector, SyncResult } from './base';

/**
 * Instagram Graph API (Business accounts only).
 *
 * Setup:
 *   1. Link Instagram Business account to Facebook Page
 *   2. Create Meta app at https://developers.facebook.com
 *   3. Request instagram_basic + instagram_manage_insights permissions
 *   4. Generate long-lived page access token
 *   5. Set INSTAGRAM_ACCESS_TOKEN in Vercel env vars
 *
 * Endpoints:
 *   GET /{ig-user-id}?fields=followers_count,media_count,biography
 *   GET /{ig-user-id}/media?fields=id,caption,media_type,like_count,comments_count,timestamp
 */

export const instagramConnector: SocialConnector = {
  platform: 'instagram',
  async fetchFollowers(_accountId, _handle): Promise<SyncResult> {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) return { rowsInserted: 0, rowsUpdated: 0, error: 'INSTAGRAM_ACCESS_TOKEN not set' };
    // TODO: call Graph API
    return { rowsInserted: 0, rowsUpdated: 0 };
  },
  async fetchRecentPosts(_accountId, _handle): Promise<SyncResult> {
    return { rowsInserted: 0, rowsUpdated: 0 };
  },
};
