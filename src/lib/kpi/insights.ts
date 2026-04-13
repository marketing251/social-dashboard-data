import type { MergedPeriodRow, Period } from './types';
import { PLATFORMS, PLATFORM_META } from './types';
import { formatNum, formatPct, pctChange, periodLabels } from './format';
import { platformLatest, sumField } from './aggregate';

export type InsightTag = 'win' | 'alert' | 'action' | 'watch';
export type InsightClass = 'positive' | 'negative' | 'warning' | 'info';

export interface Insight {
  icon: string;
  cls: InsightClass;
  tag: InsightTag;
  tagLabel: string;
  title: string;
  body: string;
}

export function generateInsights(
  rows: MergedPeriodRow[],
  period: Period
): Insight[] {
  if (rows.length < 2) return [];

  const { vs, thisPeriod, thisLower, noun } = periodLabels(period);
  const latest = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const first = rows[0];
  const out: Insight[] = [];

  // Per-platform follower WoW
  const platformGrowth = PLATFORMS.map((p) => {
    const curr = latest.byPlatform[p]?.followers ?? 0;
    const prv = prev.byPlatform[p]?.followers ?? 0;
    return { platform: p, curr, prev: prv, change: pctChange(curr, prv) };
  });

  // 1. Top performer
  const top = [...platformGrowth].sort((a, b) => b.change - a.change)[0];
  if (top && top.change > 0) {
    out.push({
      icon: '📈',
      cls: 'positive',
      tag: 'win',
      tagLabel: `Top Performer ${thisPeriod}`,
      title: `${PLATFORM_META[top.platform].label}: Audience ${formatPct(top.change)} ${vs}`,
      body: `Grew from ${formatNum(top.prev)} to ${formatNum(top.curr)} ${thisLower}. Investigate what drove this and repeat.`,
    });
  }

  // 2. Biggest reach mover
  const reachData = PLATFORMS.map((p) => {
    const curr =
      latest.byPlatform[p]?.impressions ?? latest.byPlatform[p]?.views ?? 0;
    const prv =
      prev.byPlatform[p]?.impressions ?? prev.byPlatform[p]?.views ?? 0;
    return { platform: p, curr, prev: prv, change: pctChange(curr, prv) };
  });
  const biggestReach = [...reachData].sort(
    (a, b) => Math.abs(b.change) - Math.abs(a.change)
  )[0];
  if (biggestReach && Math.abs(biggestReach.change) > 10) {
    const up = biggestReach.change > 0;
    out.push({
      icon: up ? '🚀' : '📉',
      cls: up ? 'positive' : 'negative',
      tag: up ? 'win' : 'alert',
      tagLabel: up ? 'Reach Surge' : 'Reach Drop',
      title: `${PLATFORM_META[biggestReach.platform].label} Reach ${formatPct(biggestReach.change)} ${thisPeriod}`,
      body: up
        ? `${PLATFORM_META[biggestReach.platform].label} jumped from ${formatNum(biggestReach.prev)} to ${formatNum(biggestReach.curr)}. Identify the content and amplify it.`
        : `${PLATFORM_META[biggestReach.platform].label} fell from ${formatNum(biggestReach.prev)} to ${formatNum(biggestReach.curr)}. Check algorithm changes or reduced posting.`,
    });
  }

  // 3. Twitter engagement rate
  const twCurr = latest.byPlatform.twitter?.engagement_rate ?? 0;
  const twPrev = prev.byPlatform.twitter?.engagement_rate ?? 0;
  if (twCurr > 0 && twPrev > 0) {
    const engChange = pctChange(twCurr, twPrev);
    if (Math.abs(engChange) > 10) {
      const up = engChange > 0;
      out.push({
        icon: up ? '🔥' : '❗',
        cls: up ? 'positive' : 'negative',
        tag: up ? 'win' : 'watch',
        tagLabel: up ? 'Engagement Up' : 'Engagement Down',
        title: `Twitter Engagement: ${twPrev.toFixed(1)}% → ${twCurr.toFixed(1)}% (${formatPct(engChange)})`,
        body: up
          ? `Engagement rate climbed ${thisLower}. Your audience is connecting. Sustain with polls, threads, replies.`
          : `Engagement rate dipped ${thisLower}. Review content quality, posting times, topic relevance.`,
      });
    }
  }

  // 4. Cross-platform audience
  const totalCurr = sumField(latest, 'followers');
  const totalPrev = sumField(prev, 'followers');
  const totalFirst = sumField(first, 'followers');
  const totalChange = pctChange(totalCurr, totalPrev);
  const allTime = pctChange(totalCurr, totalFirst);
  const topContrib = platformGrowth
    .filter((p) => p.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 3)
    .map(
      (p) => `${PLATFORM_META[p.platform].label} (${formatPct(p.change)})`
    )
    .join(', ') || `none grew ${thisLower}`;

  out.push({
    icon: '🏆',
    cls: 'info',
    tag: 'win',
    tagLabel: 'Audience Snapshot',
    title: `Total Audience: ${formatNum(totalCurr)} (${formatPct(totalChange)} ${vs})`,
    body: `Combined across all platforms. All-time growth: ${formatPct(allTime)} since ${first.period_label}. Top contributors: ${topContrib}.`,
  });

  // 5. Platform needing attention
  const declining = platformGrowth
    .filter((p) => p.change < 0)
    .sort((a, b) => a.change - b.change);
  if (declining.length > 0) {
    const d = declining[0];
    out.push({
      icon: '⚠️',
      cls: 'negative',
      tag: 'alert',
      tagLabel: 'Needs Attention',
      title: `${PLATFORM_META[d.platform].label} Lost Followers ${thisPeriod} (${formatPct(d.change)})`,
      body: `Dropped from ${formatNum(d.prev)} to ${formatNum(d.curr)}. Audit recent content, check posting cadence.`,
    });
  }

  // 6. Consistency score
  const growing = platformGrowth.filter((p) => p.change > 0).length;
  if (growing === PLATFORMS.length) {
    out.push({
      icon: '✅',
      cls: 'positive',
      tag: 'win',
      tagLabel: 'All Green',
      title: `All ${PLATFORMS.length} Platforms Grew ${thisPeriod}`,
      body: 'Every platform added followers. Healthy cross-platform momentum. Maintain cadence and strategy.',
    });
  } else if (growing === 0) {
    out.push({
      icon: '🚨',
      cls: 'negative',
      tag: 'alert',
      tagLabel: 'Red Flag',
      title: `No Platforms Grew ${thisPeriod}`,
      body: 'All platforms flat or declining. Review content output, posting schedule, audience sentiment.',
    });
  }

  return out;
}
