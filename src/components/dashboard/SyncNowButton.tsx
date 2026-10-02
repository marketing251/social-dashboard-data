'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status =
  | { kind: 'idle' }
  | { kind: 'running'; text: string }
  | { kind: 'done'; text: string }
  | { kind: 'error'; text: string };

async function post(url: string): Promise<{ ok: boolean; body: Record<string, unknown> }> {
  const res = await fetch(url, { method: 'POST' });
  const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  return { ok: res.ok, body };
}

export function SyncNowButton() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  const run = async () => {
    try {
      // Step 1: data
      setStatus({ kind: 'running', text: 'Syncing sheet…' });
      const sheet = await post('/api/sync/sheet');
      if (!sheet.ok) {
        setStatus({ kind: 'error', text: `Sheet sync failed: ${String(sheet.body.error ?? 'unknown error')}` });
        return;
      }
      refresh();
      const rows = `Synced ${sheet.body.synced} rows`;
      if (!sheet.body.aiEnabled) {
        setStatus({ kind: 'done', text: rows });
        return;
      }

      // Step 2: AI insights
      setStatus({ kind: 'running', text: `${rows} · writing AI insights…` });
      const ai = await post('/api/sync/insights');
      refresh();
      setStatus(ai.ok
        ? { kind: 'done', text: `${rows} · AI insights updated` }
        : { kind: 'error', text: `${rows}, but AI insights failed: ${String(ai.body.error ?? 'unknown error')}` });
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
        title="Pull the latest data from the Google Sheet and refresh AI insights"
      >
        <RefreshCw size={14} className={cn(running && 'animate-spin')} />
        <span>{running ? 'Syncing…' : 'Sync now'}</span>
      </button>
      {status.kind !== 'idle' && (
        <span
          className={cn('text-xs max-w-[340px] truncate', status.kind === 'error' ? 'text-red' : status.kind === 'done' ? 'text-green' : 'text-text-muted')}
          title={status.text}
        >
          {status.text}
        </span>
      )}
    </div>
  );
}
