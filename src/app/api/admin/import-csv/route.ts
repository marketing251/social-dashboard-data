import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Period, Platform } from '@/lib/kpi/types';

/**
 * Accepts a CSV in the shape:
 *   period,period_start,period_end,period_label,platform,handle,
 *   followers,impressions,views,likes,comments,shares,saves,engagement_rate
 *
 * Example row:
 *   weekly,2026-03-15,2026-03-21,03/15-03/21,twitter,PropAccountWL,181,609,,24,20,,,11.3
 */

type CsvRow = {
  period: Period;
  period_start: string;
  period_end: string;
  period_label: string;
  platform: Platform;
  handle: string;
  followers: number | null;
  impressions: number | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
  engagement_rate: number | null;
};

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const len = text.length;
  let i = 0;
  while (i < len) {
    const row: string[] = [];
    while (i < len) {
      let value = '';
      if (text[i] === '"') {
        i++;
        while (i < len) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') {
              value += '"';
              i += 2;
            } else {
              i++;
              break;
            }
          } else {
            value += text[i++];
          }
        }
      } else {
        while (i < len && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
          value += text[i++];
        }
      }
      row.push(value.trim());
      if (text[i] === ',') i++;
      else break;
    }
    if (text[i] === '\r') i++;
    if (text[i] === '\n') i++;
    if (row.length > 1 || row[0]) rows.push(row);
  }
  return rows;
}

const num = (s: string): number | null => {
  if (!s) return null;
  const n = Number(s.replace(/[,%]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.text();
  const rows = parseCSV(body);
  if (rows.length < 2) return NextResponse.json({ error: 'Empty CSV' }, { status: 400 });

  const header = rows[0].map((h) => h.toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const required = ['period', 'period_start', 'period_end', 'period_label', 'platform', 'handle'];
  for (const r of required) {
    if (col(r) === -1)
      return NextResponse.json({ error: `Missing column: ${r}` }, { status: 400 });
  }

  // Get account IDs by (platform, handle)
  const admin = createAdminClient();
  const { data: accounts } = await admin
    .from('platform_accounts')
    .select('id, platform, handle');
  const accountMap = new Map<string, string>();
  for (const a of accounts ?? []) {
    accountMap.set(`${a.platform}::${a.handle}`, a.id);
  }

  const inserts: Record<string, unknown>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < header.length) continue;
    const platform = r[col('platform')];
    const handle = r[col('handle')];
    const account_id = accountMap.get(`${platform}::${handle}`);
    if (!account_id) {
      errors.push(`Row ${i + 1}: unknown account ${platform}/${handle}`);
      continue;
    }
    inserts.push({
      account_id,
      period: r[col('period')],
      period_start: r[col('period_start')],
      period_end: r[col('period_end')],
      period_label: r[col('period_label')],
      followers: col('followers') >= 0 ? num(r[col('followers')]) : null,
      impressions: col('impressions') >= 0 ? num(r[col('impressions')]) : null,
      views: col('views') >= 0 ? num(r[col('views')]) : null,
      likes: col('likes') >= 0 ? num(r[col('likes')]) : null,
      comments: col('comments') >= 0 ? num(r[col('comments')]) : null,
      shares: col('shares') >= 0 ? num(r[col('shares')]) : null,
      saves: col('saves') >= 0 ? num(r[col('saves')]) : null,
      engagement_rate: col('engagement_rate') >= 0 ? num(r[col('engagement_rate')]) : null,
      source: 'csv_import',
    });
  }

  if (inserts.length === 0) {
    return NextResponse.json({ error: 'No valid rows', details: errors }, { status: 400 });
  }

  const { error } = await admin
    .from('kpi_snapshots')
    .upsert(inserts, { onConflict: 'account_id,period,period_start' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: inserts.length, warnings: errors });
}
