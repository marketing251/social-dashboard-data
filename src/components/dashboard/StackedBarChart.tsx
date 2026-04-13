'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/components/providers/ThemeProvider';
import { formatNum } from '@/lib/kpi/format';

export interface BarSeries {
  label: string;
  color: string;
  data: Array<{ x: string; y: number }>;
}

export function StackedBarChart({
  series,
  stacked = true,
  height = 280,
  horizontal = false,
}: {
  series: BarSeries[];
  stacked?: boolean;
  height?: number;
  horizontal?: boolean;
}) {
  const { theme } = useTheme();
  const grid = theme === 'dark' ? '#2a2d3a44' : '#0000000f';
  const axis = theme === 'dark' ? '#8b8fa3' : '#5f6577';
  const tipBg = theme === 'dark' ? '#1a1d27' : '#ffffff';
  const tipBorder = theme === 'dark' ? '#2a2d3a' : '#e0e2e7';
  const text = theme === 'dark' ? '#e4e6eb' : '#1a1d27';

  const xValues = Array.from(new Set(series.flatMap((s) => s.data.map((d) => d.x))));
  const merged = xValues.map((x) => {
    const row: Record<string, string | number> = { x };
    for (const s of series) {
      const point = s.data.find((d) => d.x === x);
      row[s.label] = point ? point.y : 0;
    }
    return row;
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={merged}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
        {horizontal ? (
          <>
            <XAxis type="number" stroke={axis} fontSize={11} tickFormatter={(v: number) => formatNum(v)} />
            <YAxis type="category" dataKey="x" stroke={axis} fontSize={11} width={120} />
          </>
        ) : (
          <>
            <XAxis dataKey="x" stroke={axis} fontSize={10} />
            <YAxis stroke={axis} fontSize={11} tickFormatter={(v: number) => formatNum(v)} />
          </>
        )}
        <Tooltip
          contentStyle={{
            background: tipBg,
            border: `1px solid ${tipBorder}`,
            borderRadius: 8,
            color: text,
          }}
          formatter={(v: number) => formatNum(v)}
          cursor={{ fill: 'transparent' }}
        />
        <Legend wrapperStyle={{ color: axis, fontSize: 12 }} />
        {series.map((s) => (
          <Bar
            key={s.label}
            dataKey={s.label}
            fill={s.color}
            stackId={stacked ? 'stack' : undefined}
            radius={[3, 3, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
