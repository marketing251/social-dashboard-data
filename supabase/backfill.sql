-- =====================================================================
-- BACKFILL: 12 weeks of PropAccount KPIs from the v1 dashboard
-- Run AFTER schema.sql, policies.sql, seed.sql
-- Safe to re-run (uses ON CONFLICT DO UPDATE)
-- =====================================================================

with weeks(period_start, period_end, period_label) as (values
    ('2025-12-28'::date, '2026-01-03'::date, '12/28-01/03'),
    ('2026-01-04'::date, '2026-01-10'::date, '01/04-01/10'),
    ('2026-01-11'::date, '2026-01-17'::date, '01/11-01/17'),
    ('2026-01-18'::date, '2026-01-24'::date, '01/18-01/24'),
    ('2026-01-25'::date, '2026-01-31'::date, '01/25-01/31'),
    ('2026-02-01'::date, '2026-02-07'::date, '02/01-02/07'),
    ('2026-02-08'::date, '2026-02-14'::date, '02/08-02/14'),
    ('2026-02-15'::date, '2026-02-21'::date, '02/15-02/21'),
    ('2026-02-22'::date, '2026-02-28'::date, '02/22-02/28'),
    ('2026-03-01'::date, '2026-03-07'::date, '03/01-03/07'),
    ('2026-03-08'::date, '2026-03-14'::date, '03/08-03/14'),
    ('2026-03-15'::date, '2026-03-21'::date, '03/15-03/21')
),
-- Platform-by-week data. Each row is one (platform, week_idx) with metrics.
-- week_idx is 1-based; will join with weeks.row_number().
data(platform, week_idx, followers, impressions, views, likes, shares, engagement_rate, watch_time_h) as (values
    -- Twitter
    ('twitter', 1,  145, 1414, null, 4,  5,  1.9,  null::numeric),
    ('twitter', 2,  150, 1169, null, 5,  0,  1.5,  null::numeric),
    ('twitter', 3,  150,  952, null, 4,  5,  1.9,  null::numeric),
    ('twitter', 4,  150,  899, null, 3,  10, 4.5,  null::numeric),
    ('twitter', 5,  152, 1494, null, 5,  7,  3.3,  null::numeric),
    ('twitter', 6,  156, 1465, null, 8,  11, 5.8,  null::numeric),
    ('twitter', 7,  160, 1067, null, 36, 23, 7.4,  null::numeric),
    ('twitter', 8,  163,  632, null, 38, 15, 12.9, null::numeric),
    ('twitter', 9,  172,  911, null, 34, 17, 10.0, null::numeric),
    ('twitter', 10, 176,  833, null, 35, 19, 12.0, null::numeric),
    ('twitter', 11, 179,  544, null, 9,  11, 7.9,  null::numeric),
    ('twitter', 12, 181,  609, null, 24, 20, 11.3, null::numeric),
    -- Instagram (interactions mapped to likes as proxy)
    ('instagram', 1,  1711, null, 12124, 81,  null, null, null),
    ('instagram', 2,  1713, null, 19331, 131, null, null, null),
    ('instagram', 3,  1713, null, 43316, 218, null, null, null),
    ('instagram', 4,  1725, null, 40186, 259, null, null, null),
    ('instagram', 5,  1748, null, 42718, 250, null, null, null),
    ('instagram', 6,  1814, null, 53238, 257, null, null, null),
    ('instagram', 7,  1831, null, 42106, 179, null, null, null),
    ('instagram', 8,  1857, null, 28630, 152, null, null, null),
    ('instagram', 9,  1880, null, 22784, 129, null, null, null),
    ('instagram', 10, 1888, null, 13087, 80,  null, null, null),
    ('instagram', 11, 1889, null, 14724, 89,  null, null, null),
    ('instagram', 12, 1940, null, 32210, 179, null, null, null),
    -- Facebook
    ('facebook', 1,  490, null, 241481, 61,  null, null, null),
    ('facebook', 2,  490, null, 337513, 93,  null, null, null),
    ('facebook', 3,  493, null, 364332, 94,  null, null, null),
    ('facebook', 4,  495, null, 269523, 66,  null, null, null),
    ('facebook', 5,  505, null, 140099, 102, null, null, null),
    ('facebook', 6,  528, null, 116381, 117, null, null, null),
    ('facebook', 7,  537, null, 110083, 124, null, null, null),
    ('facebook', 8,  545, null, 112129, 123, null, null, null),
    ('facebook', 9,  553, null, 96071,  98,  null, null, null),
    ('facebook', 10, 561, null, 100036, 62,  null, null, null),
    ('facebook', 11, 564, null, 103828, 50,  null, null, null),
    ('facebook', 12, 582, null, 115265, 89,  null, null, null),
    -- YouTube (subscribers → followers, watchTime in hours → seconds via *3600)
    ('youtube', 1,  186, null, 4856,  null, null, null, 31.1),
    ('youtube', 2,  188, null, 8031,  null, null, null, 38.8),
    ('youtube', 3,  195, null, 2902,  null, null, null, 15.0),
    ('youtube', 4,  199, null, 2439,  null, null, null, 16.3),
    ('youtube', 5,  201, null, 2796,  null, null, null, 15.4),
    ('youtube', 6,  204, null, 1748,  null, null, null, 11.6),
    ('youtube', 7,  210, null, 17774, null, null, null, 55.4),
    ('youtube', 8,  217, null, 14467, null, null, null, 43.6),
    ('youtube', 9,  224, null, 7734,  null, null, null, 57.7),
    ('youtube', 10, 226, null, 5281,  null, null, null, 31.7),
    ('youtube', 11, 232, null, 3965,  null, null, null, 31.2),
    ('youtube', 12, 235, null, 14454, null, null, null, 43.5),
    -- TikTok
    ('tiktok', 1,  4, null, 0,   0, null, null, null),
    ('tiktok', 2,  4, null, 1,   0, null, null, null),
    ('tiktok', 3,  4, null, 13,  0, null, null, null),
    ('tiktok', 4,  4, null, 0,   0, null, null, null),
    ('tiktok', 5,  4, null, 3,   0, null, null, null),
    ('tiktok', 6,  5, null, 4,   2, null, null, null),
    ('tiktok', 7,  5, null, 19,  3, null, null, null),
    ('tiktok', 8,  7, null, 133, 3, null, null, null),
    ('tiktok', 9,  8, null, 9,   4, null, null, null),
    ('tiktok', 10, 8, null, 257, 2, null, null, null),
    ('tiktok', 11, 8, null, 113, 1, null, null, null),
    ('tiktok', 12, 8, null, 105, 0, null, null, null),
    -- LinkedIn (reactions → likes)
    ('linkedin', 1,  203, 983,  null, 29, null, null, null),
    ('linkedin', 2,  205, 775,  null, 23, null, null, null),
    ('linkedin', 3,  212, 943,  null, 28, null, null, null),
    ('linkedin', 4,  217, 1013, null, 18, null, null, null),
    ('linkedin', 5,  231, 1999, null, 35, null, null, null),
    ('linkedin', 6,  246, 2591, null, 15, null, null, null),
    ('linkedin', 7,  257, 1666, null, 20, null, null, null),
    ('linkedin', 8,  268, 1808, null, 26, null, null, null),
    ('linkedin', 9,  289, 1489, null, 30, null, null, null),
    ('linkedin', 10, 315, 1362, null, 21, null, null, null),
    ('linkedin', 11, 330, 1821, null, 33, null, null, null),
    ('linkedin', 12, 343, 826,  null, 18, null, null, null)
),
numbered_weeks as (
    select row_number() over (order by period_start) as idx, *
    from weeks
)
insert into kpi_snapshots (
    account_id, period, period_start, period_end, period_label,
    followers, impressions, views, likes, shares, engagement_rate, watch_time_seconds,
    source
)
select
    pa.id,
    'weekly'::period_type,
    nw.period_start, nw.period_end, nw.period_label,
    d.followers,
    d.impressions,
    d.views,
    d.likes,
    d.shares,
    d.engagement_rate,
    case when d.watch_time_h is not null then round(d.watch_time_h * 3600)::bigint else null end,
    'backfill'
from data d
join numbered_weeks nw on nw.idx = d.week_idx
join platform_accounts pa on pa.platform::text = d.platform
on conflict (account_id, period, period_start) do update set
    followers = excluded.followers,
    impressions = excluded.impressions,
    views = excluded.views,
    likes = excluded.likes,
    shares = excluded.shares,
    engagement_rate = excluded.engagement_rate,
    watch_time_seconds = excluded.watch_time_seconds,
    source = 'backfill';

-- Sanity check
select platform, count(*) as weeks_loaded
from kpi_snapshots s
join platform_accounts a on a.id = s.account_id
where period = 'weekly'
group by platform
order by platform;
-- Expected: all 6 platforms with 12 rows each
