import type { SocialConnector, SyncResult } from './base';

/**
 * X API v2.
 *
 * Setup:
 *   1. Apply for X Developer account at https://developer.x.com
 *   2. Most endpoints require paid Basic tier ($100/mo as of 2024)
 *   3. Bearer token for app-only auth
 *
 * Endpoints:
 *   GET /users/by/username/{username}?user.fields=public_metrics
 *   GET /users/{id}/tweets?max_results=10&tweet.fields=public_metrics
 *
 * Limitations:
 *   - Free tier: only 1,500 writes/month, NO read access to others' data
 *   - Basic tier: 10K reads/month — adequate for weekly sync
 */

export const twitterConnector: SocialConnector = {
  platform: 'twitter',
  async fetchFollowers(_accountId, _handle): Promise<SyncResult> {
    const token = process.env.X_BEARER_TOKEN;
    if (!token) return { rowsInserted: 0, rowsUpdated: 0, error: 'X_BEARER_TOKEN not set' };
    return { rowsInserted: 0, rowsUpdated: 0 };
  },
  async fetchRecentPosts(_accountId, _handle): Promise<SyncResult> {
    return { rowsInserted: 0, rowsUpdated: 0 };
  },
};
