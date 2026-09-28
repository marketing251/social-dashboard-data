-- =====================================================================
-- CONTENT TAB: replace seeded demo data with measured 30-day analytics
-- Window: 2026-08-29 .. 2026-09-28, from platform exports:
--   IG + FB (Meta Business Suite per-post), YouTube Studio (per-video),
--   LinkedIn (per-post), X (daily account overview / 29 posts).
-- 101 posts total. Engagement = likes+comments+shares(+saves).
-- Notes: no long-form video was published in the window; stories are not
-- included in platform exports; YouTube export has views only (no likes),
-- so YouTube contributes to impressions but not engagement averages.
-- Run in Supabase SQL Editor after the seed. Safe to re-run.
-- =====================================================================

-- Real measured topics (replace the 8 invented ones)
DELETE FROM content_topics;
INSERT INTO content_topics (topic, avg_engagement, color, display_order) VALUES
    ('Events & Expos',       6, '#f59e0b', 1),
    ('Platform & Tech',      4, '#ef4444', 2),
    ('Creator Economy',      4, '#ec4899', 3),
    ('Awards & Credibility', 3, '#6366f1', 4),
    ('PropGenie & Branding', 3, '#06b6d4', 5),
    ('Risk & Rules',         2, '#8b5cf6', 6);

-- Real measured per-type benchmarks (replace the 2026-04-01 seeded rows)
DELETE FROM content_benchmarks WHERE benchmark_date = '2026-04-01';
INSERT INTO content_benchmarks (competitor_id, content_type, avg_engagement, avg_impressions, avg_likes, avg_comments, content_mix_pct, benchmark_date)
SELECT id, ct.type::content_type, ct.eng, ct.imp, ct.likes, ct.comments, ct.mix, '2026-09-28'
FROM competitors c
CROSS JOIN (VALUES
    -- type, avg engagement, avg impressions/views, avg likes, avg comments, % of posts
    ('reels',        4, 102, 3, 0, 40.59),
    ('carousel',     2, 262, 0, 0,  0.99),
    ('static_image', 4, 208, 2, 0, 28.71),
    ('text_thread', 13, 119, 7, 0, 28.71)
) AS ct(type, eng, imp, likes, comments, mix)
WHERE c.is_self = true
ON CONFLICT (competitor_id, content_type, benchmark_date) DO UPDATE SET
    avg_engagement = EXCLUDED.avg_engagement, avg_impressions = EXCLUDED.avg_impressions,
    avg_likes = EXCLUDED.avg_likes, avg_comments = EXCLUDED.avg_comments,
    content_mix_pct = EXCLUDED.content_mix_pct;

-- Verify
SELECT content_type, avg_engagement, avg_impressions, avg_likes, avg_comments, content_mix_pct, benchmark_date
FROM content_benchmarks b JOIN competitors c ON c.id = b.competitor_id
WHERE c.is_self = true ORDER BY benchmark_date DESC, content_type;
