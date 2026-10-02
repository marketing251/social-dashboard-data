// Regression check for syncSheetToDb's pruning, using an in-memory fake of
// the Supabase query builder:  npx tsx scripts/test-prune.mts
import { syncSheetToDb } from '../src/lib/run-sheet-sync';
import { fetchSheetKpis } from '../src/lib/sheet-sync';
import { PLATFORMS } from '../src/lib/kpi/types';

type Row = Record<string, unknown>;
const tables: Record<string, Row[]> = { platform_accounts: [], kpi_snapshots: [], sync_logs: [] };
for (const p of PLATFORMS) tables.platform_accounts.push({ id: `acc-${p}`, platform: p, active: true });

// Current DB state: everything the sheet has, plus the stray row and the
// 2025 baseline rows from the original backfill (must be kept).
const sheet = await fetchSheetKpis();
let nextId = 1;
for (const r of sheet) tables.kpi_snapshots.push({ id: nextId++, account_id: `acc-${r.platform}`, period: r.period, period_start: r.period_start, source: 'google_sheets_sync' });
tables.kpi_snapshots.push({ id: 'STRAY', account_id: 'acc-youtube', period: 'weekly', period_start: '2026-09-28', source: 'google_sheets_sync' });
for (const p of PLATFORMS) tables.kpi_snapshots.push({ id: `BASE-${p}`, account_id: `acc-${p}`, period: 'quarterly', period_start: '2025-01-01', source: 'google_sheets_backfill' });

function query(table: string) {
  const filters: Array<(r: Row) => boolean> = [];
  let op: 'select' | 'delete' = 'select';
  const run = () => {
    const rows = tables[table].filter((r) => filters.every((f) => f(r)));
    if (op === 'delete') { tables[table] = tables[table].filter((r) => !rows.includes(r)); return { data: null, error: null }; }
    return { data: rows, error: null };
  };
  const b = {
    select: () => b,
    delete: () => { op = 'delete'; return b; },
    eq: (k: string, v: unknown) => { filters.push((r) => r[k] === v); return b; },
    in: (k: string, vs: unknown[]) => { filters.push((r) => vs.includes(r[k])); return b; },
    upsert: async (rows: Row[]) => {
      for (const row of rows) {
        const hit = tables[table].find((r) => r.account_id === row.account_id && r.period === row.period && r.period_start === row.period_start);
        if (hit) Object.assign(hit, row); else tables[table].push({ id: nextId++, ...row });
      }
      return { error: null };
    },
    insert: async (row: Row) => { tables[table].push(row); return { error: null }; },
    then: (res: (v: unknown) => void, rej: (e: unknown) => void) => Promise.resolve(run()).then(res, rej),
  };
  return b;
}

const before = tables.kpi_snapshots.length;
const result = await syncSheetToDb({ from: query } as never);
const ids = new Set(tables.kpi_snapshots.map((r) => r.id));
const checks = {
  syncOk: result.ok,
  strayRemoved: !ids.has('STRAY'),
  baselineKept: PLATFORMS.every((p) => ids.has(`BASE-${p}`)),
  sheetRowsKept: tables.kpi_snapshots.length === before - 1,
  loggedSuccess: tables.sync_logs.at(-1)?.status === 'success',
};
console.log(checks, `rows ${before} -> ${tables.kpi_snapshots.length}`);
console.log(Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL');
process.exitCode = Object.values(checks).every(Boolean) ? 0 : 1;
