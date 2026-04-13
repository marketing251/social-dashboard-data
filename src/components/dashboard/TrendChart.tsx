'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useTheme } from '@/components/providers/ThemeProvider';
import { formatNum } from '@/lib/kpi/format';

export interface TrendSeries {
  label: string;
  color: string;
  data: Array<{ x: string; y: number }>;
}

export function TrendChart({
  series,
  height = 280,
}: {
  series: TrendSeries[];
  height?: number;
}) {
  const { theme } = useTheme();
  const grid = theme === 'dark' ? '#2a2d3a44' : '#0000000f';
  const axis = theme === 'dark' ? '#8b8fa3' : '#5f6577';
  const tipBg = theme === 'dark' ? '#1a1d27' : '#ffffff';
  const tipBorder = theme === 'dark' ? '#2a2d3a' : '#e0e2e7';
  const text = theme === 'dark' ? '#e4e6eb' : '#1a1d27';

  // Merge all series onto one x axis
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
      <LineChart data={merged} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={grid} strokeDasharray="3 3" />
        <XAxis dataKey="x" stroke={axis} fontSize={11} />
        <YAxis stroke={axis} fontSize={11} tickFormatter={(v: number) => formatNum(v)} />
        <Tooltip
          contentStyle={{
            background: tipBg,
            border: `1px solid ${tipBorder}`,
            borderRadius: 8,
            color: text,
          }}
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
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
