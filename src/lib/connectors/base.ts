import type { Platform } from '@/lib/kpi/types';

export interface SyncResult {
  rowsInserted: number;
  rowsUpdated: number;
  error?: string;
}

/**
 * Every social platform connector implements this interface.
 *
 * Data flow:
 *   1. fetchFollowers()       → upserts a kpi_snapshot for the account
 *   2. fetchRecentPosts()     → upserts post_metrics
 *   3. Called from /api/cron/sync weekly
 */
export interface SocialConnector {
  platform: Platform;
  fetchFollowers(accountId: string, handle: string): Promise<SyncResult>;
  fetchRecentPosts(accountId: string, handle: string): Promise<SyncResult>;
}
