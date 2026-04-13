import type {
  KpiSnapshot,
  MergedPeriodRow,
  Platform,
  PlatformAccount,
} from './types';
import { pctChange } from './format';

/**
 * Merge per-account KPI snapshots into per-period rows keyed by period_start.
 * Returns rows sorted chronologically ascending.
 */
export function mergeSnapshotsByPeriod(
  accounts: PlatformAccount[],
  snapshots: KpiSnapshot[]
): MergedPeriodRow[] {
  const accountPlatform = new Map<string, Platform>(
    accounts.map((a) => [a.id, a.platform])
  );

  const map = new Map<string, MergedPeriodRow>();

  for (const s of snapshots) {
    const platform = accountPlatform.get(s.account_id);
    if (!platform) continue;

    const key = s.period_start;
    let row = map.get(key);
    if (!row) {
      row = {
        period_start: s.period_start,
        period_label: s.period_label,
        byPlatform: {},
      };
      map.set(key, row);
    }
    row.byPlatform[platform] = s;
  }

  return Array.from(map.values()).sort((a, b) =>
    a.period_start.localeCompare(b.period_start)
  );
}

/** Sum a numeric field across all platforms for a single row */
export function sumField(
  row: MergedPeriodRow,
  field: keyof KpiSnapshot
): number {
  return Object.values(row.byPlatform).reduce((total, snap) => {
    const v = snap?.[field];
    return total + (typeof v === 'number' ? v : 0);
  }, 0);
}

/** Compute latest vs previous for a derived metric */
export function comparePeriods(
  rows: MergedPeriodRow[],
  fn: (row: MergedPeriodRow) => number
): { value: number; previous: number | null; change: number | null } {
  if (rows.length === 0) return { value: 0, previous: null, change: null };
  const latest = fn(rows[rows.length - 1]);
  if (rows.length === 1) return { value: latest, previous: null, change: null };
  const previous = fn(rows[rows.length - 2]);
  return { value: latest, previous, change: pctChange(latest, previous) };
}

/** Aggregated metrics for the summary hero cards */
export function summaryMetrics(rows: MergedPeriodRow[]) {
  const totalReach = (row: MergedPeriodRow) =>
    Object.values(row.byPlatform).reduce((t, s) => {
      // Twitter/LinkedIn use impressions; others use views
      if (!s) return t;
      return t + (s.impressions ?? s.views ?? 0);
    }, 0);

  const totalAudience = (row: MergedPeriodRow) => sumField(row, 'followers');

  const totalInteractions = (row: MergedPeriodRow) =>
    Object.values(row.byPlatform).reduce(
      (t, s) =>
        t +
        (s?.likes ?? 0) +
        (s?.comments ?? 0) +
        (s?.shares ?? 0) +
        (s?.saves ?? 0),
      0
    );

  return {
    reach: comparePeriods(rows, totalReach),
    audience: comparePeriods(rows, totalAudience),
    interactions: comparePeriods(rows, totalInteractions),
  };
}

/** Per-platform latest + growth */
export function platformLatest(
  rows: MergedPeriodRow[],
  platform: Platform,
  field: keyof KpiSnapshot
): { value: number; change: number | null } {
  if (rows.length === 0) return { value: 0, change: null };
  const latest = rows[rows.length - 1].byPlatform[platform]?.[field];
  const prev = rows[rows.length - 2]?.byPlatform[platform]?.[field];
  const value = typeof latest === 'number' ? latest : 0;
  if (typeof prev !== 'number') return { value, change: null };
  return { value, change: pctChange(value, prev) };
}
