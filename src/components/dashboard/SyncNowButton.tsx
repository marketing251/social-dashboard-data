'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = { kind: 'idle' } | { kind: 'running' } | { kind: 'done'; text: string } | { kind: 'error'; text: string };

export function SyncNowButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [, startTransition] = useTransition();

  const run = async () => {
    setStatus({ kind: 'running' });
    try {
      const res = await fetch('/api/sync/sheet', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: 'error', text: body.error ?? `Sync failed (HTTP ${res.status})` });
        return;
      }
      setStatus({
        kind: 'done',
        text: `Synced ${body.synced} rows${body.aiRefreshing ? '; AI insights updating in ~1 min' : ''}`,
      });
      startTransition(() => router.refresh());
    } catch (err) {
      setStatus({ kind: 'error', text: err instanceof Error ? err.message : 'Network error' });
    }
  };

  const running = status.kind === 'running';
  return (
    <div className="no-print flex items-center gap-2">
      <button
        onClick={run}
        disabled={running}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-bg text-text-muted text-xs font-medium hover:border-accent hover:text-text transition disabled:opacity-60"
        title="Pull the latest data from the Google Sheet now"
      >
        <RefreshCw size={14} className={cn(running && 'animate-spin')} />
        <span>{running ? 'Syncing…' : 'Sync now'}</span>
      </button>
      {(status.kind === 'done' || status.kind === 'error') && (
        <span className={cn('text-xs max-w-[260px] truncate', status.kind === 'error' ? 'text-red' : 'text-green')} title={status.text}>
          {status.text}
        </span>
      )}
    </div>
  );
}
