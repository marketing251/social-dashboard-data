-- =====================================================================
-- COMPETITOR SNAPSHOT: 2026-09-28
-- Captured from public profile pages (browser + direct fetch).
-- Fresh: Instagram (Tickblaze 1,336 / Devexperts 2,365 / YourPropFirm 1,299),
--        YouTube (Tradelocker 14.8K / Tickblaze 5.55K / Devexperts 1.92K /
--        YourPropFirm 232), TikTok (YourPropFirm 74).
-- Carried forward from 2026-04-01 (x.com blocked in browser): twitter_followers.
-- Still NULL: Tradelocker IG + Trade Tech Solutions IG (accounts gone since July).
-- Run in Supabase SQL Editor. Safe to re-run (upsert per competitor+date).
-- =====================================================================
INSERT INTO competitor_snapshots (competitor_id, snapshot_date, instagram_followers, twitter_followers, youtube_subscribers, tiktok_followers, notes, source)
SELECT id, '2026-09-28'::date,
    CASE name
        WHEN 'Tickblaze' THEN 1336
        WHEN 'Devexperts' THEN 2365
        WHEN 'YourPropFirm' THEN 1299
    END,
    CASE name -- carried forward from 2026-04-01 snapshot; X was unreachable
        WHEN 'Tradelocker' THEN 8352
        WHEN 'Tickblaze' THEN 716
        WHEN 'Devexperts' THEN 1064
        WHEN 'Trade Tech Solutions' THEN 1545
        WHEN 'YourPropFirm' THEN 102
    END,
    CASE name
        WHEN 'Tradelocker' THEN 14800
        WHEN 'Tickblaze' THEN 5550
        WHEN 'Devexperts' THEN 1920
        WHEN 'YourPropFirm' THEN 232
    END,
    CASE name
        WHEN 'YourPropFirm' THEN 74
    END,
    CASE name
        WHEN 'Tradelocker' THEN 'IG account gone since Jul (was 24,000 in Apr); X carried from 04/01'
        WHEN 'Trade Tech Solutions' THEN 'IG page removed since Jul (was 3,489 in Apr); X carried from 04/01'
        ELSE 'X carried from 04/01; IG/YT/TikTok fresh 09/28'
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
SELECT c.name, s.snapshot_date, s.instagram_followers, s.twitter_followers, s.youtube_subscribers, s.tiktok_followers
FROM competitor_snapshots s JOIN competitors c ON c.id = s.competitor_id
ORDER BY s.snapshot_date DESC, c.name;
