export const dynamic = "force-dynamic";
import { loadKpiSnapshots, loadAiInsights } from '@/lib/kpi/load';
import { summaryMetrics } from '@/lib/kpi/aggregate';
import { generateInsights, type Insight } from '@/lib/kpi/insights';
import { sanitizeInsights } from '@/lib/ai-insights';
import { PLATFORM_META, PLATFORMS, type Period } from '@/lib/kpi/types';
import { SummaryView } from '@/components/dashboard/SummaryView';
import { pctChange } from '@/lib/kpi/format';

export default async function SummaryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const period = (typeof sp.period === 'string' ? sp.period : 'weekly') as Period;
  const [{ rows }, ai] = await Promise.all([loadKpiSnapshots(period), loadAiInsights(period)]);
  if (rows.length === 0) {
    return <div className="card p-10 text-center"><h2 className="text-xl font-bold mb-2">No data yet</h2><p className="text-text-muted text-sm">Data syncs daily from the Google Sheet at 7:00 UTC. To load it now, run the sheet-sync cron from Vercel (Settings → Cron Jobs) or <code>supabase/full-backfill.sql</code> in the Supabase SQL Editor.</p></div>;
  }
  const metrics = summaryMetrics(rows);
  const ruleInsights = generateInsights(rows, period);
  const aiInsights = sanitizeInsights((ai?.insights ?? []) as Insight[]);
  const insights = aiInsights.length > 0 ? aiInsights : ruleInsights;
  const aiGeneratedAt = aiInsights.length > 0 && ai?.generated_at
    ? new Date(ai.generated_at).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : null;
  const trendSeries = PLATFORMS.map((p) => ({
    label: PLATFORM_META[p].label,
    color: PLATFORM_META[p].color,
    data: rows.map((r) => ({ x: r.period_label, y: r.byPlatform[p]?.followers ?? null })),
  })).filter((s) => s.data.some((d) => d.y != null));
  const latest = rows[rows.length - 1];
  const prev = rows.length >= 2 ? rows[rows.length - 2] : null;
  const twEng = latest.byPlatform.twitter?.engagement_rate ?? 0;
  const twEngPrev = prev?.byPlatform.twitter?.engagement_rate ?? twEng;
  const engCh = twEngPrev ? pctChange(twEng, twEngPrev) : null;

  return (
    <SummaryView
      metrics={metrics}
      engagementRate={twEng}
      engagementChange={engCh}
      trendSeries={trendSeries}
      latest={latest}
      prev={prev}
      rowCount={rows.length}
      insights={insights}
      aiGeneratedAt={aiGeneratedAt}
    />
  );
}
