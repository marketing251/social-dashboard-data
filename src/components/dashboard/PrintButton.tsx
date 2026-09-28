'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-bg text-text-muted text-xs font-medium hover:border-accent hover:text-text transition"
      title="Print or save this page as a PDF"
    >
      <Printer size={14} />
      <span>Export</span>
    </button>
  );
}
