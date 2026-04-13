export function formatNum(n: number | null | undefined): string {
  if (n == null) return '-';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatPct(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '-';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(decimals)}%`;
}

export function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr === 0 ? 0 : 100;
  return ((curr - prev) / Math.abs(prev)) * 100;
}

export function pctChangeClass(n: number | null): 'positive' | 'negative' | 'neutral' {
  if (n == null) return 'neutral';
  if (n > 0) return 'positive';
  if (n < 0) return 'negative';
  return 'neutral';
}

export function periodLabels(mode: 'weekly' | 'monthly' | 'quarterly') {
  if (mode === 'weekly') {
    return { noun: 'Week', vs: 'WoW', thisPeriod: 'This Week', thisLower: 'this week' };
  }
  if (mode === 'monthly') {
    return { noun: 'Month', vs: 'MoM', thisPeriod: 'This Month', thisLower: 'this month' };
  }
  return { noun: 'Quarter', vs: 'QoQ', thisPeriod: 'This Quarter', thisLower: 'this quarter' };
}
