export const dynamic = "force-dynamic";
import {
  loadCompetitors,
  loadContentBenchmarks,
  loadContentTopics,
} from '@/lib/kpi/load';
import { formatNum } from '@/lib/kpi/format';
import { StackedBarChart } from '@/components/dashboard/StackedBarChart';
import type { ContentType } from '@/lib/kpi/types';

const CONTENT_LABELS: Record<ContentType, string> = {
  reels: 'Reels / Shorts',
  long_video: 'Long-form Video',
  carousel: 'Carousel',
  static_image: 'Static Image',
  stories: 'Stories',
  text_thread: 'Text / Thread',
};

const CT_ORDER: ContentType[] = [
  'reels',
  'long_video',
  'carousel',
  'static_image',
  'stories',
  'text_thread',
];

export default async function ContentPage() {
  const [competitors, benchmarks, topics] = await Promise.all([
    loadCompetitors(),
    loadContentBenchmarks(),
    loadContentTopics(),
  ]);

  const self = competitors.find((c) => c.is_self);
  const selfBenchmarks = benchmarks.filter(
    (b) => b.competitor_id === self?.id
  );

  // Content performance cards for self
  const cards = CT_ORDER.map((ct) => {
    const b = selfBenchmarks.find((x) => x.content_type === ct);
    return {
      type: ct,
      label: CONTENT_LABELS[ct],
      likes: b?.avg_likes ?? 0,
      comments: b?.avg_comments ?? 0,
      engagement: b?.avg_engagement ?? 0,
      impressions: b?.avg_impressions ?? 0,
    };
  });

  const efficiency = cards
    .filter((c) => c.impressions > 0)
    .map((c) => ({
      type: c.label,
      value: (c.engagement / c.impressions) * 1000,
    }))
    .sort((a, b) => b.value - a.value);

  // Topics chart
  const topicSeries = [
    {
      label: 'Avg Engagement',
      color: '#6366f1',
      data: topics.map((t) => ({ x: t.topic, y: t.avg_engagement })),
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="section-title">Content Performance by Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((c) => (
            <div key={c.type} className="card p-5">
              <h3 className="font-bold text-base mb-3 pb-2 border-b border-border">{c.label}</h3>
              <div className="grid grid-cols-2 gap-2">
                <Cell label="Avg Likes" value={c.likes} />
                <Cell label="Comments" value={c.comments} />
                <Cell label="Impressions" value={c.impressions} />
                <Cell label="Engagement" value={c.engagement} highlight />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="section-title">Content Efficiency (Engagement per 1K Impressions)</h2>
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-accent/10 text-text-muted text-[11px] uppercase tracking-wide">
                <th className="p-3 text-left">Content Type</th>
                <th className="p-3 text-left">Eng. / 1K</th>
                <th className="p-3 text-left">Relative</th>
              </tr>
            </thead>
            <tbody>
              {efficiency.map((e, i) => {
                const max = efficiency[0].value;
                const pct = (e.value / max) * 100;
                return (
                  <tr key={e.type} className="border-t border-border">
                    <td className="p-3">{e.type}</td>
                    <td className="p-3">
                      <span className={`pill ${i === 0 ? 'pill-positive' : 'pill-neutral'}`}>
                        {e.value.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="section-title">Top Content Topics by Engagement</h2>
        <div className="card p-6">
          <StackedBarChart horizontal stacked={false} series={topicSeries} height={340} />
        </div>
      </section>
    </div>
  );
}

function Cell({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-sm p-2 ${highlight ? 'bg-accent/15' : 'bg-bg'}`}>
      <div className="text-[10px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className={`text-base font-bold ${highlight ? 'text-accent' : ''}`}>
        {formatNum(value)}
      </div>
    </div>
  );
}
