'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const MODES = [
  { value: 'weekly', label: 'Week / Week' },
  { value: 'monthly', label: 'Month / Month' },
  { value: 'quarterly', label: 'Quarter / Quarter' },
] as const;

export function GrowthToggle() {
  const router = useRouter();
  const params = useSearchParams();
  const current = (params.get('period') || 'weekly') as (typeof MODES)[number]['value'];

  const setMode = (mode: (typeof MODES)[number]['value']) => {
    const sp = new URLSearchParams(params.toString());
    sp.set('period', mode);
    router.push(`?${sp.toString()}`);
  };

  return (
    <div className="flex bg-bg rounded-sm overflow-hidden border border-border">
      {MODES.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          className={cn(
            'px-4 py-2 text-xs font-medium transition',
            current === m.value
              ? 'bg-accent text-white'
              : 'text-text-muted hover:text-text'
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
