'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-bg text-text-muted text-xs font-medium hover:border-accent hover:text-text transition"
      title="Toggle theme"
    >
      {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
      <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
}
