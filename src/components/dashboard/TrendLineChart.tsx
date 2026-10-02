'use client';

import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/components/providers/ThemeProvider';
import { formatNum } from '@/lib/kpi/format';

export interface LineSeries {
  label: string;
  color: string;
  data: Array<{ x: string; y: number | null }>;
}

/** True while the page is being printed; the print layout must be committed
 *  synchronously in beforeprint, before the browser lays out the print pages. */
function usePrinting() {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('print');
    const set = (v: boolean) => flushSync(() => setPrinting(v));
    const on = () => set(true);
    const off = () => set(false);
    const onChange = (e: MediaQueryListEvent) => set(e.matches);
    window.addEventListener('beforeprint', on);
    window.addEventListener('afterprint', off);
    mql.addEventListener('change', onChange);
    return () => {
      window.removeEventListener('beforeprint', on);
      window.removeEventListener('afterprint', off);
      mql.removeEventListener('change', onChange);
    };
  }, []);
  return printing;
}

export function TrendLineChart({ series, height = 300, printHeight }: { series: LineSeries[]; height?: number; printHeight?: number }) {
  const { theme } = useTheme();
  const printing = usePrinting();
  // Printed pages are always dark
  const dark = theme === 'dark' || printing;
  const grid = dark ? '#2a2d3a44' : '#0000001a';
  const axis = dark ? '#8b8fa3' : '#5f6577';
  const tipBg = dark ? '#1a1d27' : '#ffffff';
  const tipBorder = dark ? '#2a2d3a' : '#e0e2e7';
  const text = dark ? '#e4e6eb' : '#1a1d27';
  const h = printing && printHeight ? printHeight : height;

  const xValues = Array.from(new Set(series.flatMap((s) => s.data.map((d) => d.x))));
  const merged = xValues.map((x) => {
    const row: Record<string, string | number | null> = { x };
    for (const s of series) {
      row[s.label] = s.data.find((d) => d.x === x)?.y ?? null;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={h}>
      <LineChart data={merged} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
        <XAxis dataKey="x" stroke={axis} fontSize={10} interval="preserveStartEnd" />
        <YAxis stroke={axis} fontSize={11} tickFormatter={(v: number) => formatNum(v)} width={48} />
        <Tooltip
          contentStyle={{ background: tipBg, border: `1px solid ${tipBorder}`, borderRadius: 8, color: text }}
          formatter={(v: number) => formatNum(v)}
        />
        <Legend wrapperStyle={{ color: axis, fontSize: 12 }} />
        {series.map((s) => (
          <Line
            key={s.label}
            type="monotone"
            dataKey={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={false}
            connectNulls
            isAnimationActive={!printing}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
