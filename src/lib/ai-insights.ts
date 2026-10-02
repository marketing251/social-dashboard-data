import Anthropic from '@anthropic-ai/sdk';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Insight, InsightClass, InsightTag } from '@/lib/kpi/insights';
import type { Period } from '@/lib/kpi/types';
import { trimSparseTail } from '@/lib/kpi/aggregate';

const PERIODS: Period[] = ['weekly', 'monthly', 'quarterly'];
const VALID_CLS: InsightClass[] = ['positive', 'negative', 'warning', 'info'];
const VALID_TAG: InsightTag[] = ['win', 'alert', 'action', 'watch'];

export interface AiInsightRow {
  period: Period;
  /** data_through = period_start of the latest period the insights were generated from */
  insights: { data_through: string; items: Insight[] };
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

      const { system, user, latestStart } = buildInsightPrompt(
        period,
        snaps.reverse().map((s) => ({ ...s, platform: platformById.get(s.account_id) ?? '?' })),
      );

      const response = await client.messages.create({
        model: 'claude-opus-5-5',
        max_tokens: 4000,
        system,
        messages: [{ role: 'user', content: user }],
      });

      const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
      const insights = parseInsights(text);
      if (!insights.length) throw new Error('model returned no parseable insights');

      const { error: upsertErr } = await admin
        .from('ai_insights')
        // data_through lives inside the jsonb so no schema migration is needed
        .upsert({ period, insights: { data_through: latestStart, items: insights }, model: response.model, generated_at: new Date().toISOString() }, { onConflict: 'period' });
      if (upsertErr) throw new Error(upsertErr.message);
      generated++;
    } catch (err) {
      errors.push(`${period}: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }
  return { generated, errors };
}

export interface PromptSnapshot {
  platform: string;
  period_label: string;
  period_start: string;
  followers: number | null;
  impressions: number | null;
  views: number | null;
  likes: number | null;
  shares: number | null;
  engagement_rate: number | null;
  watch_time_seconds: number | null;
}

function metricsOf(s: PromptSnapshot): Record<string, number> {
  const m: Record<string, number> = {};
  if (s.followers != null) m.followers = Number(s.followers);
  if (s.impressions != null) m.impressions = Number(s.impressions);
  if (s.views != null) m.views = Number(s.views);
  if (s.likes != null) m.likes = Number(s.likes);
  if (s.shares != null) m.shares = Number(s.shares);
  if (s.engagement_rate != null) m.eng_rate_pct = Number(s.engagement_rate);
  if (s.watch_time_seconds != null) m.watch_hours = Math.round(Number(s.watch_time_seconds) / 3600);
  return m;
}

/** Build the insight prompt from snapshots ordered oldest-first. Exported for dry-runs. */
export function buildInsightPrompt(period: Period, allRows: PromptSnapshot[]) {
  // Same latest period the dashboard shows: drop sparse trailing periods
  const counts = new Map<string, number>();
  for (const s of allRows) counts.set(s.period_start, (counts.get(s.period_start) ?? 0) + 1);
  const keptStarts = new Set(trimSparseTail(Array.from(counts.keys()).sort(), (start) => counts.get(start) ?? 0));
  const ordered = allRows.filter((s) => keptStarts.has(s.period_start));

  const table = ordered
    .map((s) => `${s.period_label} ${s.platform}: ${Object.entries(metricsOf(s)).map(([k, v]) => `${k}=${v}`).join(' ')}`)
    .join('\n');

  // Exact latest-vs-previous deltas, computed here so the model never has to
  const starts = Array.from(new Set(ordered.map((s) => s.period_start))).sort();
  const latestStart = starts[starts.length - 1];
  const prevStart = starts[starts.length - 2];
  const labelOf = (start: string | undefined) => ordered.find((s) => s.period_start === start)?.period_label ?? start ?? 'n/a';
  const changeLines: string[] = [];
  if (prevStart) {
    for (const latest of ordered.filter((s) => s.period_start === latestStart)) {
      const prev = ordered.find((s) => s.period_start === prevStart && s.platform === latest.platform);
      const lm = metricsOf(latest); const pm = prev ? metricsOf(prev) : {};
      const parts = Object.entries(lm).map(([k, v]) => {
        const p = pm[k];
        if (p == null) return `${k} ${v} (no prior value)`;
        if (p === 0) return `${k} ${p} → ${v}`;
        const pct = ((v - p) / p) * 100;
        return `${k} ${p} → ${v} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%, ${v > p ? 'UP' : v < p ? 'DOWN' : 'FLAT'})`;
      });
      changeLines.push(`${latest.platform}: ${parts.join('; ')}`);
    }
  }
  const latestPlatforms = new Set(ordered.filter((s) => s.period_start === latestStart).map((s) => s.platform));
  const notReported = Array.from(new Set(ordered.filter((s) => s.period_start === prevStart).map((s) => s.platform)))
    .filter((p) => !latestPlatforms.has(p));

  const system =
    'You are a social media analyst for PropAccount, a white-label prop-firm technology provider. ' +
    'You analyze cross-platform KPI history (Twitter/X, Instagram, Facebook, YouTube, TikTok, LinkedIn) and produce sharp, specific, non-generic insights a marketing lead can act on. ' +
    'Look for multi-period trends, inflection points, cross-platform patterns, and momentum shifts — not just latest-vs-previous deltas. Reference concrete numbers and period labels. ' +
    'Editorial rules: at least 3 insights must be positive (cls "positive" — wins, growth, momentum); at most 3 may be negative or cautionary (cls "negative" or "warning"). ' +
    'Never question or speculate about the authenticity, source, or legitimacy of engagement — no commentary about suspect, inflated, internal, bot, or inauthentic engagement of any kind. Treat all metrics as genuine and focus on trends and actions.';

  const user =
    `Here is PropAccount's ${period} KPI history, one line per platform per period (oldest first):\n\n${table}\n\n` +
    `The latest period is ${labelOf(latestStart)}; the previous period is ${labelOf(prevStart)}. ` +
    `Exact changes from ${labelOf(prevStart)} to ${labelOf(latestStart)}, computed for you:\n${changeLines.join('\n')}\n\n` +
    (notReported.length
      ? `Not yet reported for ${labelOf(latestStart)}: ${notReported.join(', ')}. Their data has not been entered, which is not a decline — do not write insights about these platforms' latest period, and do not count them in cross-platform totals.\n\n`
      : '') +
    `Every insight must be anchored in the latest period (${labelOf(latestStart)}). Older periods may be cited only as context for a trend that continues into the latest one — never describe an earlier period's change as the current state. ` +
    'Any claim that a metric is up or down must agree with the UP/DOWN in the change table above; use those exact numbers rather than recomputing. ' +
    'Return the 6 most valuable insights as a JSON array, no other text — at least 3 positive, at most 3 negative/cautionary. Each item: ' +
    '{"icon": "<one emoji>", "cls": "positive"|"negative"|"warning"|"info", "tag": "win"|"alert"|"action"|"watch", ' +
    '"tagLabel": "<2-3 word label>", "title": "<one-line headline with numbers>", "body": "<2-3 sentences: what happened, why it likely happened, what to do>"}';

  return { system, user, latestStart };
}

// Hard editorial filter: never surface engagement-authenticity commentary,
// regardless of what the model returns or what is stored in the database.
const BANNED = /suspect|inauthentic|fake|bot[s\s]|inflated|internal team|internal sharing|who is doing the shar|engagement.pod|engagement.group|artificial|not.{0,8}organic/i;

/**
 * Editorial rules applied to any insight list (fresh from the model or read
 * back from ai_insights): drop engagement-authenticity commentary, cap
 * negative/cautionary items at 3, max 6 total.
 */
export function sanitizeInsights(list: Insight[]): Insight[] {
  const out: Insight[] = [];
  let negatives = 0;
  for (const i of list) {
    if (!i?.title || !i?.body) continue;
    if (BANNED.test(`${i.tagLabel} ${i.title} ${i.body}`)) continue;
    const isNegative = i.cls === 'negative' || i.cls === 'warning';
    if (isNegative && negatives >= 3) continue;
    if (isNegative) negatives++;
    out.push(i);
    if (out.length >= 6) break;
  }
  return out;
}

function parseInsights(text: string): Insight[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  let raw: unknown;
  try { raw = JSON.parse(match[0]); } catch { return []; }
  if (!Array.isArray(raw)) return [];
  const all = raw
    .filter((i): i is Record<string, string> => !!i && typeof i === 'object')
    .map((i) => ({
      icon: typeof i.icon === 'string' ? i.icon.slice(0, 8) : '💡',
      cls: VALID_CLS.includes(i.cls as InsightClass) ? (i.cls as InsightClass) : 'info',
      tag: VALID_TAG.includes(i.tag as InsightTag) ? (i.tag as InsightTag) : 'watch',
      tagLabel: typeof i.tagLabel === 'string' ? i.tagLabel.slice(0, 40) : 'Insight',
      title: typeof i.title === 'string' ? i.title.slice(0, 200) : '',
      body: typeof i.body === 'string' ? i.body.slice(0, 600) : '',
    }));
  return sanitizeInsights(all);
}
