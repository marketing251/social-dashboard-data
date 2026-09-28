import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Insight, InsightClass, InsightTag } from '@/lib/kpi/insights';
import type { Period } from '@/lib/kpi/types';

const PERIODS: Period[] = ['weekly', 'monthly', 'quarterly'];
const VALID_CLS: InsightClass[] = ['positive', 'negative', 'warning', 'info'];
const VALID_TAG: InsightTag[] = ['win', 'alert', 'action', 'watch'];

export interface AiInsightRow {
  period: Period;
  insights: Insight[];
  model: string | null;
  generated_at: string;
}

/**
 * Generate AI insights for all periods from recent KPI data and upsert them
 * into ai_insights. No-ops when ANTHROPIC_API_KEY isn't configured. Errors
 * are returned, not thrown, so callers (the daily cron) never fail on this.
 */
export async function generateAiInsights(admin: SupabaseClient): Promise<{ generated: number; skipped?: string; errors: string[] }> {
  if (!process.env.ANTHROPIC_API_KEY) return { generated: 0, skipped: 'ANTHROPIC_API_KEY not configured', errors: [] };

  const { data: accounts } = await admin.from('platform_accounts').select('id, platform').eq('active', true);
  if (!accounts?.length) return { generated: 0, errors: ['no accounts'] };
  const platformById = new Map(accounts.map((a) => [a.id as string, a.platform as string]));

  const client = new Anthropic();
  const errors: string[] = [];
  let generated = 0;

  for (const period of PERIODS) {
    try {
      // Most recent snapshots for this period (all platforms), oldest-first for the prompt
      const { data: snaps, error } = await admin
        .from('kpi_snapshots')
        .select('account_id, period_label, period_start, followers, impressions, views, likes, comments, shares, engagement_rate, watch_time_seconds')
        .eq('period', period)
        .order('period_start', { ascending: false })
        .limit(period === 'weekly' ? 84 : 72); // ~14 weeks / 12 months / all quarters x 6 platforms
      if (error) throw new Error(error.message);
      if (!snaps?.length) continue;

      const table = snaps
        .reverse()
        .map((s) => {
          const p = platformById.get(s.account_id) ?? '?';
          const fields = [
            s.followers != null && `followers=${s.followers}`,
            s.impressions != null && `impressions=${s.impressions}`,
            s.views != null && `views=${s.views}`,
            s.likes != null && `likes=${s.likes}`,
            s.shares != null && `shares=${s.shares}`,
            s.engagement_rate != null && `eng_rate=${s.engagement_rate}%`,
            s.watch_time_seconds != null && `watch_h=${Math.round(Number(s.watch_time_seconds) / 3600)}`,
          ].filter(Boolean).join(' ');
          return `${s.period_label} ${p}: ${fields}`;
        })
        .join('\n');

      const response = await client.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 4000,
        system:
          'You are a social media analyst for PropAccount, a white-label prop-firm technology provider. ' +
          'You analyze cross-platform KPI history (Twitter/X, Instagram, Facebook, YouTube, TikTok, LinkedIn) and produce sharp, specific, non-generic insights a marketing lead can act on. ' +
          'Look for multi-period trends, inflection points, anomalies, cross-platform patterns, and momentum shifts — not just latest-vs-previous deltas. Reference concrete numbers and period labels.',
        messages: [
          {
            role: 'user',
            content:
              `Here is PropAccount's ${period} KPI history, one line per platform per period (oldest first):\n\n${table}\n\n` +
              'Return the 4 to 6 most valuable insights as a JSON array, no other text. Each item: ' +
              '{"icon": "<one emoji>", "cls": "positive"|"negative"|"warning"|"info", "tag": "win"|"alert"|"action"|"watch", ' +
              '"tagLabel": "<2-3 word label>", "title": "<one-line headline with numbers>", "body": "<2-3 sentences: what happened, why it likely happened, what to do>"}',
          },
        ],
      });

      const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      const insights = parseInsights(text);
      if (!insights.length) throw new Error('model returned no parseable insights');

      const { error: upsertErr } = await admin
        .from('ai_insights')
        .upsert({ period, insights, model: response.model, generated_at: new Date().toISOString() }, { onConflict: 'period' });
      if (upsertErr) throw new Error(upsertErr.message);
      generated++;
    } catch (err) {
      errors.push(`${period}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }
  return { generated, errors };
}

function parseInsights(text: string): Insight[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  let raw: unknown;
  try { raw = JSON.parse(match[0]); } catch { return []; }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i): i is Record<string, string> => !!i && typeof i === 'object')
    .map((i) => ({
      icon: typeof i.icon === 'string' ? i.icon.slice(0, 8) : '💡',
      cls: VALID_CLS.includes(i.cls as InsightClass) ? (i.cls as InsightClass) : 'info',
      tag: VALID_TAG.includes(i.tag as InsightTag) ? (i.tag as InsightTag) : 'watch',
      tagLabel: typeof i.tagLabel === 'string' ? i.tagLabel.slice(0, 40) : 'Insight',
      title: typeof i.title === 'string' ? i.title.slice(0, 200) : '',
      body: typeof i.body === 'string' ? i.body.slice(0, 600) : '',
    }))
    .filter((i) => i.title && i.body)
    .slice(0, 6);
}
