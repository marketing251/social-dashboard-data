-- =====================================================================
-- COMPETITOR SNAPSHOT: 2026-07-08
-- Captured from public profile pages (browser + direct fetch).
-- Fresh: Instagram (Tickblaze, Devexperts, YourPropFirm), all YouTube,
--        TikTok (YourPropFirm).
-- Carried forward from 2026-04-01 (X blocked in browser): twitter_followers.
-- NULL: Tradelocker IG (@tradelockerofficial unavailable, was 24,000),
--       Trade Tech Solutions IG (page removed, was 3,489).
-- Run in Supabase SQL Editor. Safe to re-run (upsert per competitor+date).
-- =====================================================================
INSERT INTO competitor_snapshots (competitor_id, snapshot_date, instagram_followers, twitter_followers, youtube_subscribers, tiktok_followers, notes, source)
SELECT id, '2026-07-08'::date,
    CASE name
        WHEN 'Tickblaze' THEN 1350
        WHEN 'Devexperts' THEN 2383
        WHEN 'YourPropFirm' THEN 1180
    END,
    CASE name -- carried forward from 2026-04-01 snapshot; X was unreachable
        WHEN 'Tradelocker' THEN 8352
        WHEN 'Tickblaze' THEN 716
        WHEN 'Devexperts' THEN 1064
        WHEN 'Trade Tech Solutions' THEN 1545
        WHEN 'YourPropFirm' THEN 102
    END,
    CASE name
        WHEN 'Tradelocker' THEN 14200
        WHEN 'Tickblaze' THEN 5330
        WHEN 'Devexperts' THEN 1900
        WHEN 'YourPropFirm' THEN 224
    END,
    CASE name
        WHEN 'YourPropFirm' THEN 72
    END,
    CASE name
        WHEN 'Tradelocker' THEN 'IG @tradelockerofficial unavailable (was 24,000); X carried from 04/01'
        WHEN 'Trade Tech Solutions' THEN 'IG page removed (was 3,489); X carried from 04/01'
        ELSE 'X carried from 04/01; IG/YT/TikTok fresh'
    END,
    'public_page_capture'
FROM competitors WHERE is_self = false
ON CONFLICT (competitor_id, snapshot_date) DO UPDATE SET
    instagram_followers = EXCLUDED.instagram_followers,
    twitter_followers = EXCLUDED.twitter_followers,
    youtube_subscribers = EXCLUDED.youtube_subscribers,
    tiktok_followers = EXCLUDED.tiktok_followers,
    notes = EXCLUDED.notes,
    source = EXCLUDED.source;

-- Verify
SELECT c.name, s.snapshot_date, s.instagram_followers, s.twitter_followers, s.youtube_subscribers, s.tiktok_followers, s.notes
FROM competitor_snapshots s JOIN competitors c ON c.id = s.competitor_id
ORDER BY s.snapshot_date DESC, c.name;
