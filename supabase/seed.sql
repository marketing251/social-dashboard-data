-- Seed initial PropAccount data

insert into platform_accounts (platform, handle, display_name, profile_url, active) values
    ('twitter',   'PropAccountWL',            'PropAccount',           'https://x.com/PropAccountWL', true),
    ('instagram', 'propaccountsolutions',     'PropAccount Solutions', 'https://www.instagram.com/propaccountsolutions/', true),
    ('facebook',  '61572005043364',           'PropAccount',           'https://www.facebook.com/profile.php?id=61572005043364', true),
    ('youtube',   'UCUmea-rprFpgeuADi5MWXzw', 'PropAccount',           'https://www.youtube.com/channel/UCUmea-rprFpgeuADi5MWXzw', true),
    ('tiktok',    'propaccount',              'PropAccount',           'https://www.tiktok.com/@propaccount', true),
    ('linkedin',  'propaccount',              'PropAccount',           'https://www.linkedin.com/company/propaccount/', true);

insert into competitors (name, description, website, is_self, instagram_url, twitter_url, facebook_url, youtube_url, tiktok_url, linkedin_url, display_order) values
    ('PropAccount', 'Turnkey white-label prop firm + capital + tech', 'https://propaccount.com', true,
     'https://www.instagram.com/propaccountsolutions/', 'https://x.com/PropAccountWL',
     'https://www.facebook.com/profile.php?id=61572005043364',
     'https://www.youtube.com/channel/UCUmea-rprFpgeuADi5MWXzw',
     'https://www.tiktok.com/@propaccount',
     'https://www.linkedin.com/company/propaccount/', 0),
    ('Tradelocker', 'Trading platform used by prop firms', 'https://tradelocker.com/', false,
     'https://www.instagram.com/tradelockerofficial/', 'https://x.com/tradelockermain', null,
     'https://www.youtube.com/@tradelockerofficial', null,
     'https://www.linkedin.com/company/tradelockerofficial/', 10),
    ('Tickblaze', 'Full prop firm infrastructure incl. back office', 'https://tickblaze.com/prop-firms/', false,
     'https://www.instagram.com/tickblaze', 'https://x.com/Tickblaze', null,
     'https://www.youtube.com/@tickblaze', null,
     'https://www.linkedin.com/company/tickblaze/', 20),
    ('Devexperts', 'Institutional-grade prop & broker tech', 'https://devexperts.com/prop-firm-technology/', false,
     'https://www.instagram.com/devexperts_global/', 'https://x.com/devexperts', null,
     'https://www.youtube.com/channel/UCF3FRmes2KrcVsTXQ1aAB5w', null,
     'https://www.linkedin.com/company/devexperts/', 30),
    ('Trade Tech Solutions', 'Prop Tech provider', 'https://www.tradetechsolutions.io/', false,
     'https://www.instagram.com/trade.techsolutions/', 'https://x.com/XLTradeTech', null, null, null, null, 40),
    ('YourPropFirm', 'Turnkey prop firm launch solution', 'https://yourpropfirm.com/', false,
     'https://www.instagram.com/yourpropfirm/', 'https://x.com/yourpropfirm', null,
     'https://www.youtube.com/@YourPropFirm', 'https://www.tiktok.com/@yourpropfirm',
     'https://www.linkedin.com/company/youpropfirm/', 50);

insert into competitor_snapshots (competitor_id, snapshot_date, instagram_followers, twitter_followers, youtube_subscribers)
select id, '2026-04-01'::date,
    case name when 'Tradelocker' then 24000 when 'Tickblaze' then 1351 when 'Devexperts' then 2297 when 'Trade Tech Solutions' then 3489 when 'YourPropFirm' then 908 end,
    case name when 'Tradelocker' then 8352 when 'Tickblaze' then 716 when 'Devexperts' then 1064 when 'Trade Tech Solutions' then 1545 when 'YourPropFirm' then 102 end,
    case name when 'Tradelocker' then 13400 when 'Tickblaze' then 4510 when 'Devexperts' then 1860 when 'YourPropFirm' then 207 end
from competitors where is_self = false;

insert into content_topics (topic, avg_engagement, color, display_order) values
    ('Trader Payouts',  4200, '#f59e0b', 1),
    ('Platform Demos',  3560, '#ef4444', 2),
    ('Trading Tips',    3240, '#ec4899', 3),
    ('Industry News',   2650, '#6366f1', 4),
    ('Behind Scenes',   2050, '#06b6d4', 5),
    ('Testimonials',    1870, '#8b5cf6', 6),
    ('Educational',     1640, '#22d3ee', 7),
    ('Announcements',   1010, '#6b7280', 8);

insert into content_benchmarks (competitor_id, content_type, avg_engagement, avg_impressions, avg_likes, avg_comments, content_mix_pct, benchmark_date)
select id, ct.type::content_type, ct.eng, ct.imp, ct.likes, ct.comments, ct.mix, '2026-04-01'::date
from competitors c
cross join (values
    ('reels',         520, 8420, 390,  48, 25),
    ('long_video',    680, 5680, 480,  65, 30),
    ('carousel',      290, 4150, 210,  28, 10),
    ('static_image',  140, 1890,  98,  14, 15),
    ('stories',       200, 3100,   0,   0, 10),
    ('text_thread',   310,  820, 215,  43, 10)
) as ct(type, eng, imp, likes, comments, mix)
where c.is_self = true;

-- Sample KPI snapshots matching the v1 dashboard's weekly data
-- (only a few rows here — paste more from the old fallback data as needed)
insert into kpi_snapshots (account_id, period, period_start, period_end, period_label, followers, impressions, likes, comments, engagement_rate, source)
select a.id, 'weekly', '2026-03-15', '2026-03-21', '03/15-03/21',
    case a.platform
        when 'twitter'   then 181
        when 'instagram' then 1940
        when 'facebook'  then 582
        when 'youtube'   then 235
        when 'tiktok'    then 8
        when 'linkedin'  then 343
    end,
    case a.platform
        when 'twitter'   then 609
        when 'linkedin'  then 826
        else null
    end,
    case a.platform
        when 'twitter' then 24
        else null
    end,
    case a.platform
        when 'twitter' then 20
        else null
    end,
    case a.platform when 'twitter' then 11.3 else null end,
    'seed'
from platform_accounts a;
