import type { SocialConnector, SyncResult } from './base';

/**
 * LinkedIn Marketing API.
 *
 * Setup:
 *   1. Create LinkedIn app at https://www.linkedin.com/developers
 *   2. Request Marketing Developer Platform access (requires approval)
 *   3. OAuth flow for 3-legged token
 *   4. Set LINKEDIN_ACCESS_TOKEN in Vercel env vars
 *
 * Endpoints:
 *   GET /rest/organizations/{id}   → followerCount, name
 *   GET /rest/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity={urn}
 *
 * Limitations:
 *   - Marketing API approval is slow and selective
 *   - Organic posts API is very restricted
 */

export const linkedinConnector: SocialConnector = {
  platform: 'linkedin',
  async fetchFollowers(_accountId, _handle): Promise<SyncResult> {
    const token = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!token) return { rowsInserted: 0, rowsUpdated: 0, error: 'LINKEDIN_ACCESS_TOKEN not set' };
    return { rowsInserted: 0, rowsUpdated: 0 };
  },
  async fetchRecentPosts(_accountId, _handle): Promise<SyncResult> {
    return { rowsInserted: 0, rowsUpdated: 0 };
  },
};
