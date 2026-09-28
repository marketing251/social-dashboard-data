// Pulls KPI data from the public PropAccount Google Sheet and normalizes it
// into kpi_snapshots rows. The sheet has three tabs (weekly/monthly/quarterly),
// each laid out as horizontal per-platform blocks:
//   [label][metric][%diff][metric][%diff]... — every other column is a % diff.
// Block positions are located by the platform name in the header row, so
// column insertions before a block are tolerated; offsets within a block are fixed.

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? '1gzr0i4Y0_J-DHVo6G6HW61V7tv5RqJMe';

const TABS: Record<SheetPeriod, string> = {
  weekly: 'Social Media Weekly',
  monthly: 'Social Media Monthly',
  quarterly: 'Social Media Quarterly',
};

export type SheetPeriod = 'weekly' | 'monthly' | 'quarterly';

export interface SheetKpiRow {
  platform: string;
  period: SheetPeriod;
  period_start: string; // YYYY-MM-DD
  period_end: string;   // YYYY-MM-DD
  period_label: string;
  followers: number | null;
  impressions: number | null;
  views: number | null;
  likes: number | null;
  shares: number | null;
  engagement_rate: number | null;
  watch_time_seconds: number | null;
}

// Metric column offsets from each block's label column.
// Field names are kpi_snapshots columns; watch_h is converted to seconds.
const BLOCKS: { platform: string; header: RegExp; fields: Record<number, string> }[] = [
  { platform: 'twitter',   header: /twitter/i,   fields: { 1: 'impressions', 3: 'followers', 5: 'shares', 7: 'likes', 9: 'engagement_rate' } },
  { platform: 'instagram', header: /instagram/i, fields: { 1: 'views', 3: 'followers', 5: 'likes' } },
  { platform: 'facebook',  header: /facebook/i,  fields: { 1: 'views', 3: 'followers', 5: 'likes' } },
  { platform: 'youtube',   header: /youtube/i,   fields: { 1: 'views', 3: 'watch_h', 5: 'followers' } },
  { platform: 'tiktok',    header: /tiktok/i,    fields: { 1: 'views', 3: 'likes', 5: 'followers' } },
  { platform: 'linkedin',  header: /linkedin/i,  fields: { 1: 'impressions', 3: 'likes', 5: 'followers' } },
];

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length > 0) { row.push(cell); rows.push(row); }
  return rows;
}

function num(cell: string | undefined): number | null {
  if (!cell) return null;
  const cleaned = cell.replace(/[,%\s]/g, '');
  if (cleaned === '' || /[#a-df-z!]/i.test(cleaned)) return null; // #REF!, #DIV/0!, text
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

interface ParsedLabel { period_start: string; period_end: string; period_label: string }

// "9/20/2026-9/26/2026" → start date; end = start + 6 days (labels contain typos, so the end is computed)
function parseWeekLabel(label: string): ParsedLabel | null {
  const m = label.match(/^\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const start = new Date(Date.UTC(Number(m[3]), Number(m[1]) - 1, Number(m[2])));
  if (isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 6 * 86400_000);
  return {
    period_start: iso(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate()),
    period_end: iso(end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate()),
    period_label: `${pad(start.getUTCMonth() + 1)}/${pad(start.getUTCDate())}-${pad(end.getUTCMonth() + 1)}/${pad(end.getUTCDate())}`,
  };
}

// "Febuary " → February of the given year (sheet month rows carry no year)
function parseMonthLabel(label: string, year: number): ParsedLabel | null {
  const clean = label.trim().toLowerCase();
  if (!clean) return null;
  const idx = MONTHS.findIndex((mo) => mo.startsWith(clean.slice(0, 3)) && clean.length >= 3);
  if (idx === -1) return null;
  const lastDay = new Date(Date.UTC(year, idx + 1, 0)).getUTCDate();
  return { period_start: iso(year, idx + 1, 1), period_end: iso(year, idx + 1, lastDay), period_label: MONTH_LABELS[idx] };
}

// "2026 Q2 (4/26-6/26)" → quarter range. Pre-2026 baseline rows are skipped:
// they're already in the DB from the manual backfill and their sheet labels
// are inconsistent across platforms.
function parseQuarterLabel(label: string): ParsedLabel | null {
  const m = label.match(/(\d{4})\s*Q([1-4])/);
  if (!m) return null;
  const year = Number(m[1]), q = Number(m[2]);
  if (year < 2026) return null;
  const startMonth = (q - 1) * 3 + 1;
  const lastDay = new Date(Date.UTC(year, startMonth + 2, 0)).getUTCDate();
  return { period_start: iso(year, startMonth, 1), period_end: iso(year, startMonth + 2, lastDay), period_label: `${year} Q${q}` };
}

function parseTab(csv: string, period: SheetPeriod, monthYear: number): SheetKpiRow[] {
  const rows = parseCsv(csv);
  // Find the header row + each platform block's label column
  let headerRowIdx = -1;
  const blockCols: { platform: string; col: number; fields: Record<number, string> }[] = [];
  for (let r = 0; r < Math.min(rows.length, 5) && headerRowIdx === -1; r++) {
    for (const block of BLOCKS) {
      const col = rows[r].findIndex((cell) => block.header.test(cell));
      if (col !== -1) headerRowIdx = r;
      if (col !== -1) blockCols.push({ platform: block.platform, col, fields: block.fields });
    }
  }
  if (headerRowIdx === -1) throw new Error(`No platform headers found in ${period} tab`);

  const out: SheetKpiRow[] = [];
  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    for (const block of blockCols) {
      const label = rows[r][block.col] ?? '';
      const parsed =
        period === 'weekly' ? parseWeekLabel(label) :
        period === 'monthly' ? parseMonthLabel(label, monthYear) :
        parseQuarterLabel(label);
      if (!parsed) continue;

      const values: Record<string, number | null> = {};
      let hasData = false;
      for (const [offset, field] of Object.entries(block.fields)) {
        const v = num(rows[r][block.col + Number(offset)]);
        values[field] = v;
        if (v !== null) hasData = true;
      }
      if (!hasData) continue; // future/empty period

      out.push({
        platform: block.platform,
        period,
        ...parsed,
        followers: values.followers ?? null,
        impressions: values.impressions ?? null,
        views: values.views ?? null,
        likes: values.likes ?? null,
        shares: values.shares ?? null,
        engagement_rate: values.engagement_rate ?? null,
        watch_time_seconds: values.watch_h != null ? Math.round(values.watch_h * 3600) : null,
      });
    }
  }
  return out;
}

async function fetchTab(tabName: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Sheet fetch failed for "${tabName}": HTTP ${res.status}`);
  return res.text();
}

/** Fetch all three tabs and return normalized KPI rows. */
export async function fetchSheetKpis(): Promise<SheetKpiRow[]> {
  const weeklyCsv = await fetchTab(TABS.weekly);
  const weekly = parseTab(weeklyCsv, 'weekly', 0);
  // Month rows carry no year — use the latest year present in the weekly data
  const monthYear = weekly.reduce((y, r) => Math.max(y, Number(r.period_start.slice(0, 4))), new Date().getUTCFullYear());
  const [monthlyCsv, quarterlyCsv] = await Promise.all([fetchTab(TABS.monthly), fetchTab(TABS.quarterly)]);
  return [
    ...weekly,
    ...parseTab(monthlyCsv, 'monthly', monthYear),
    ...parseTab(quarterlyCsv, 'quarterly', 0),
  ];
}
