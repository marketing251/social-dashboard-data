'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { GrowthToggle } from './GrowthToggle';
import { PrintButton } from './PrintButton';
import type { SheetSyncStatus } from '@/lib/kpi/load';

export type AsOfByPeriod = { weekly?: string; monthly?: string; quarterly?: string };

function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / (60 * 24))}d ago`;
}

function SyncChip({ sync }: { sync: SheetSyncStatus | null }) {
  if (!sync) return null;
  const ok = sync.status === 'success';
  return (
    <div
      className="no-print flex items-center gap-1.5 text-xs text-text-muted"
      title={ok
        ? `Last sheet sync: ${sync.rows_inserted ?? 0} rows`
        : `Sheet sync failed: ${sync.error_message ?? 'unknown error'}`}
    >
      <span className={cn('w-2 h-2 rounded-full', ok ? 'bg-green' : 'bg-red')} />
      <span suppressHydrationWarning>
        {ok ? 'Synced' : 'Sync failed'}{sync.finished_at ? ` ${relativeTime(sync.finished_at)}` : ''}
      </span>
    </div>
  );
}

const TABS = [
  { href: '/dashboard', label: 'Summary', match: /^\/dashboard\/?$/ },
  { href: '/dashboard/platforms', label: 'Platforms', match: /^\/dashboard\/platforms/ },
  { href: '/dashboard/competitors', label: 'Competitors', match: /^\/dashboard\/competitors/ },
  { href: '/dashboard/content', label: 'Content', match: /^\/dashboard\/content/ },
  { href: '/dashboard/links', label: 'Links', match: /^\/dashboard\/links/ },
];

export function DashboardNav({ asOf, sync = null }: { asOf?: AsOfByPeriod; sync?: SheetSyncStatus | null }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const hideGrowth = pathname.includes('/competitors') || pathname.includes('/content') || pathname.includes('/links');
  const period = (params.get('period') || 'weekly') as keyof AsOfByPeriod;
  const asOfLabel = asOf?.[period] ?? asOf?.weekly;

  return (
    <header className="bg-card border-b border-border px-4 sm:px-8 py-5 flex items-center justify-between flex-wrap gap-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <span className="text-accent">PropAccount</span> Social Dashboard
      </h1>

      {asOfLabel && (
        <div className="text-sm text-text-muted bg-bg border border-border rounded-sm px-4 py-1.5">
          as of <strong className="text-text">{asOfLabel}</strong>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <SyncChip sync={sync} />
        <PrintButton />
        <ThemeToggle />
        {!hideGrowth && <GrowthToggle />}
      </div>

      <nav className="w-full flex gap-0 border-b border-border -mb-5 mt-2 overflow-x-auto whitespace-nowrap">
        {TABS.map((tab) => {
          const active = tab.match.test(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'px-6 py-3 text-sm font-semibold border-b-2 transition -mb-px',
                active
                  ? 'text-accent border-accent'
                  : 'text-text-muted border-transparent hover:text-text'
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
