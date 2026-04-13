'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { GrowthToggle } from './GrowthToggle';

const TABS = [
  { href: '/dashboard', label: 'Summary', match: /^\/dashboard\/?$/ },
  { href: '/dashboard/platforms', label: 'Platforms', match: /^\/dashboard\/platforms/ },
  { href: '/dashboard/competitors', label: 'Competitors', match: /^\/dashboard\/competitors/ },
  { href: '/dashboard/content', label: 'Content', match: /^\/dashboard\/content/ },
  { href: '/dashboard/links', label: 'Links', match: /^\/dashboard\/links/ },
];

export function DashboardNav({ asOf }: { asOf?: string }) {
  const pathname = usePathname();
  const hideGrowth = pathname.includes('/competitors') || pathname.includes('/content') || pathname.includes('/links');

  return (
    <header className="bg-card border-b border-border px-8 py-5 flex items-center justify-between flex-wrap gap-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <span className="text-accent">PropAccount</span> Social Dashboard
      </h1>

      {asOf && (
        <div className="text-sm text-text-muted bg-bg border border-border rounded-sm px-4 py-1.5">
          as of <strong className="text-text">{asOf}</strong>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <ThemeToggle />
        {!hideGrowth && <GrowthToggle />}
      </div>

      <nav className="w-full flex gap-0 border-b border-border -mb-5 mt-2">
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
