-- =====================================================================
-- FULL BACKFILL: All data from Google Sheets
-- Weekly (27 weeks), Monthly (6 months), Quarterly (3 quarters + baseline)
-- Synced from sheet through week 06/28-07/04 (pulled 2026-07-08)
-- Run in Supabase SQL Editor
-- Safe to re-run (uses ON CONFLICT DO UPDATE)
-- =====================================================================

-- First, ensure we have the platform accounts
-- (skip if already seeded)
INSERT INTO platform_accounts (platform, handle, display_name, profile_url, active) VALUES
    ('twitter',   'PropAccountWL',            'PropAccount',           'https://x.com/PropAccountWL', true),
    ('instagram', 'propaccountsolutions',     'PropAccount Solutions', 'https://www.instagram.com/propaccountsolutions/', true),
    ('facebook',  '61572005043364',           'PropAccount',           'https://www.facebook.com/profile.php?id=61572005043364', true),
    ('youtube',   'UCUmea-rprFpgeuADi5MWXzw', 'PropAccount',           'https://www.youtube.com/channel/UCUmea-rprFpgeuADi5MWXzw', true),
    ('tiktok',    'propaccount',              'PropAccount',           'https://www.tiktok.com/@propaccount', true),
    ('linkedin',  'propaccount',              'PropAccount',           'https://www.linkedin.com/company/propaccount/', true)
ON CONFLICT (platform, handle) DO NOTHING;

-- =====================================================================
-- WEEKLY DATA (27 weeks)
-- =====================================================================
WITH weekly_data(platform, period_start, period_end, period_label, followers, impressions, views, likes, shares, engagement_rate, watch_time_h) AS (VALUES
    -- Twitter (impressions, followers, retweets->shares, likes, engagement_rate)
    ('twitter'::text, '2025-12-28'::date, '2026-01-03'::date, '12/28-01/03', 145::bigint, 1414::bigint, NULL::bigint, 4::bigint, 5::bigint, 1.9::numeric, NULL::numeric),
    ('twitter', '2026-01-04', '2026-01-10', '01/04-01/10', 150, 1169, NULL, 5, 0, 1.5, NULL),
    ('twitter', '2026-01-11', '2026-01-17', '01/11-01/17', 150, 952, NULL, 4, 5, 1.9, NULL),
    ('twitter', '2026-01-18', '2026-01-24', '01/18-01/24', 150, 899, NULL, 3, 10, 4.5, NULL),
    ('twitter', '2026-01-25', '2026-01-31', '01/25-01/31', 152, 1494, NULL, 5, 7, 3.3, NULL),
    ('twitter', '2026-02-01', '2026-02-07', '02/01-02/07', 156, 1465, NULL, 8, 11, 5.8, NULL),
    ('twitter', '2026-02-08', '2026-02-14', '02/08-02/14', 160, 1067, NULL, 36, 23, 7.4, NULL),
    ('twitter', '2026-02-15', '2026-02-21', '02/15-02/21', 163, 632, NULL, 38, 15, 12.9, NULL),
    ('twitter', '2026-02-22', '2026-02-28', '02/22-02/28', 172, 911, NULL, 34, 17, 10.0, NULL),
    ('twitter', '2026-03-01', '2026-03-07', '03/01-03/07', 176, 833, NULL, 35, 19, 12.0, NULL),
    ('twitter', '2026-03-08', '2026-03-14', '03/08-03/14', 179, 544, NULL, 9, 11, 7.9, NULL),
    ('twitter', '2026-03-15', '2026-03-21', '03/15-03/21', 181, 609, NULL, 24, 20, 11.3, NULL),
    ('twitter', '2026-03-22', '2026-03-28', '03/22-03/28', 181, 610, NULL, 8, 8, 4.2, NULL),
    ('twitter', '2026-03-29', '2026-04-04', '03/29-04/04', 182, 481, NULL, 63, 55, 28.6, NULL),
    ('twitter', '2026-04-05', '2026-04-11', '04/05-04/11', 182, 342, NULL, 18, 25, 16.3, NULL),
    ('twitter', '2026-04-12', '2026-04-18', '04/12-04/18', 187, 26049, NULL, 88, 37, 0.9, NULL),
    ('twitter', '2026-04-19', '2026-04-25', '04/19-04/25', 189, 37864, NULL, 86, 41, 0.7, NULL),
    ('twitter', '2026-04-26', '2026-05-02', '04/26-05/02', 191, 17684, NULL, 122, 52, 1.4, NULL),
    ('twitter', '2026-05-03', '2026-05-09', '05/03-05/09', 198, 6696, NULL, 12, 5, 1.0, NULL),
    ('twitter', '2026-05-10', '2026-05-16', '05/10-05/16', 199, 651, NULL, 65, 48, 17.8, NULL),
    ('twitter', '2026-05-17', '2026-05-23', '05/17-05/23', 203, 467, NULL, 38, 31, 14.9, NULL),
    ('twitter', '2026-05-24', '2026-05-30', '05/24-05/30', 204, 337, NULL, 22, 10, 10.6, NULL),
    ('twitter', '2026-05-31', '2026-06-06', '05/31-06/06', 207, 739, NULL, 3, 10, 2.8, NULL),
    ('twitter', '2026-06-07', '2026-06-13', '06/07-06/13', 212, 861, NULL, 108, 78, 23.5, NULL),
    ('twitter', '2026-06-14', '2026-06-20', '06/14-06/20', 213, 557, NULL, 1, 8, 2.8, NULL),
    ('twitter', '2026-06-21', '2026-06-27', '06/21-06/27', 214, 289, NULL, 1, 1, 1.7, NULL),
    ('twitter', '2026-06-28', '2026-07-04', '06/28-07/04', 215, 899, NULL, 45, 43, 10.5, NULL),
    -- Instagram (views, followers, interactions->likes)
    ('instagram', '2025-12-28', '2026-01-03', '12/28-01/03', 1711, NULL, 12124, 81, NULL, NULL, NULL),
    ('instagram', '2026-01-04', '2026-01-10', '01/04-01/10', 1713, NULL, 19331, 131, NULL, NULL, NULL),
    ('instagram', '2026-01-11', '2026-01-17', '01/11-01/17', 1713, NULL, 43316, 218, NULL, NULL, NULL),
    ('instagram', '2026-01-18', '2026-01-24', '01/18-01/24', 1725, NULL, 40186, 259, NULL, NULL, NULL),
    ('instagram', '2026-01-25', '2026-01-31', '01/25-01/31', 1748, NULL, 42718, 250, NULL, NULL, NULL),
    ('instagram', '2026-02-01', '2026-02-07', '02/01-02/07', 1814, NULL, 53238, 257, NULL, NULL, NULL),
    ('instagram', '2026-02-08', '2026-02-14', '02/08-02/14', 1831, NULL, 42106, 179, NULL, NULL, NULL),
    ('instagram', '2026-02-15', '2026-02-21', '02/15-02/21', 1857, NULL, 28630, 152, NULL, NULL, NULL),
    ('instagram', '2026-02-22', '2026-02-28', '02/22-02/28', 1880, NULL, 22784, 129, NULL, NULL, NULL),
    ('instagram', '2026-03-01', '2026-03-07', '03/01-03/07', 1888, NULL, 13087, 80, NULL, NULL, NULL),
    ('instagram', '2026-03-08', '2026-03-14', '03/08-03/14', 1889, NULL, 14724, 89, NULL, NULL, NULL),
    ('instagram', '2026-03-15', '2026-03-21', '03/15-03/21', 1940, NULL, 32210, 179, NULL, NULL, NULL),
    ('instagram', '2026-03-22', '2026-03-28', '03/22-03/28', 1950, NULL, 25409, 152, NULL, NULL, NULL),
    ('instagram', '2026-03-29', '2026-04-04', '03/29-04/04', 1977, NULL, 21629, 104, NULL, NULL, NULL),
    ('instagram', '2026-04-05', '2026-04-11', '04/05-04/11', 2022, NULL, 43402, 164, NULL, NULL, NULL),
    ('instagram', '2026-04-12', '2026-04-18', '04/12-04/18', 2058, NULL, 32354, 180, NULL, NULL, NULL),
    ('instagram', '2026-04-19', '2026-04-25', '04/19-04/25', 2086, NULL, 38210, 157, NULL, NULL, NULL),
    ('instagram', '2026-04-26', '2026-05-02', '04/26-05/02', 2150, NULL, 57028, 263, NULL, NULL, NULL),
    ('instagram', '2026-05-03', '2026-05-09', '05/03-05/09', 2196, NULL, 45012, 216, NULL, NULL, NULL),
    ('instagram', '2026-05-10', '2026-05-16', '05/10-05/16', 2240, NULL, 36775, 178, NULL, NULL, NULL),
    ('instagram', '2026-05-17', '2026-05-23', '05/17-05/23', 2318, NULL, 63784, 309, NULL, NULL, NULL),
    ('instagram', '2026-05-24', '2026-05-30', '05/24-05/30', 2354, NULL, 68069, 331, NULL, NULL, NULL),
    ('instagram', '2026-05-31', '2026-06-06', '05/31-06/06', 2386, NULL, 55681, 255, NULL, NULL, NULL),
    ('instagram', '2026-06-07', '2026-06-13', '06/07-06/13', 2440, NULL, 75624, 300, NULL, NULL, NULL),
    ('instagram', '2026-06-14', '2026-06-20', '06/14-06/20', 2499, NULL, 95882, 322, NULL, NULL, NULL),
    ('instagram', '2026-06-21', '2026-06-27', '06/21-06/27', 2517, NULL, 84836, 338, NULL, NULL, NULL),
    ('instagram', '2026-06-28', '2026-07-04', '06/28-07/04', 2534, NULL, 20129, 71, NULL, NULL, NULL),
    -- Facebook (views, followers, interactions->likes)
    ('facebook', '2025-12-28', '2026-01-03', '12/28-01/03', 490, NULL, 241481, 61, NULL, NULL, NULL),
    ('facebook', '2026-01-04', '2026-01-10', '01/04-01/10', 490, NULL, 337513, 93, NULL, NULL, NULL),
    ('facebook', '2026-01-11', '2026-01-17', '01/11-01/17', 493, NULL, 364332, 94, NULL, NULL, NULL),
    ('facebook', '2026-01-18', '2026-01-24', '01/18-01/24', 495, NULL, 269523, 66, NULL, NULL, NULL),
    ('facebook', '2026-01-25', '2026-01-31', '01/25-01/31', 505, NULL, 140099, 102, NULL, NULL, NULL),
    ('facebook', '2026-02-01', '2026-02-07', '02/01-02/07', 528, NULL, 116381, 117, NULL, NULL, NULL),
    ('facebook', '2026-02-08', '2026-02-14', '02/08-02/14', 537, NULL, 110083, 124, NULL, NULL, NULL),
    ('facebook', '2026-02-15', '2026-02-21', '02/15-02/21', 545, NULL, 112129, 123, NULL, NULL, NULL),
    ('facebook', '2026-02-22', '2026-02-28', '02/22-02/28', 553, NULL, 96071, 98, NULL, NULL, NULL),
    ('facebook', '2026-03-01', '2026-03-07', '03/01-03/07', 561, NULL, 100036, 62, NULL, NULL, NULL),
    ('facebook', '2026-03-08', '2026-03-14', '03/08-03/14', 564, NULL, 103828, 50, NULL, NULL, NULL),
    ('facebook', '2026-03-15', '2026-03-21', '03/15-03/21', 582, NULL, 115265, 89, NULL, NULL, NULL),
    ('facebook', '2026-03-22', '2026-03-28', '03/22-03/28', 593, NULL, 92747, 114, NULL, NULL, NULL),
    ('facebook', '2026-03-29', '2026-04-04', '03/29-04/04', 600, NULL, 92701, 86, NULL, NULL, NULL),
    ('facebook', '2026-04-05', '2026-04-11', '04/05-04/11', 609, NULL, 228908, 308, NULL, NULL, NULL),
    ('facebook', '2026-04-12', '2026-04-18', '04/12-04/18', 633, NULL, 120023, 141, NULL, NULL, NULL),
    ('facebook', '2026-04-19', '2026-04-25', '04/19-04/25', 649, NULL, 183645, 275, NULL, NULL, NULL),
    ('facebook', '2026-04-26', '2026-05-02', '04/26-05/02', 666, NULL, 206664, 140, NULL, NULL, NULL),
    ('facebook', '2026-05-03', '2026-05-09', '05/03-05/09', 681, NULL, 167006, 193, NULL, NULL, NULL),
    ('facebook', '2026-05-10', '2026-05-16', '05/10-05/16', 699, NULL, 233070, 166, NULL, NULL, NULL),
    ('facebook', '2026-05-17', '2026-05-23', '05/17-05/23', 720, NULL, 279402, 185, NULL, NULL, NULL),
    ('facebook', '2026-05-24', '2026-05-30', '05/24-05/30', 734, NULL, 265248, 158, NULL, NULL, NULL),
    ('facebook', '2026-05-31', '2026-06-06', '05/31-06/06', 746, NULL, 177536, 172, NULL, NULL, NULL),
    ('facebook', '2026-06-07', '2026-06-13', '06/07-06/13', 751, NULL, 209246, 137, NULL, NULL, NULL),
    ('facebook', '2026-06-14', '2026-06-20', '06/14-06/20', 772, NULL, 255075, 311, NULL, NULL, NULL),
    ('facebook', '2026-06-21', '2026-06-27', '06/21-06/27', 787, NULL, 178374, 220, NULL, NULL, NULL),
    ('facebook', '2026-06-28', '2026-07-04', '06/28-07/04', 790, NULL, 49067, 23, NULL, NULL, NULL),
    -- YouTube (views, subscribers->followers, watchTime hours)
    ('youtube', '2025-12-28', '2026-01-03', '12/28-01/03', 186, NULL, 4856, NULL, NULL, NULL, 31.1),
    ('youtube', '2026-01-04', '2026-01-10', '01/04-01/10', 188, NULL, 8031, NULL, NULL, NULL, 38.8),
    ('youtube', '2026-01-11', '2026-01-17', '01/11-01/17', 195, NULL, 2902, NULL, NULL, NULL, 15.0),
    ('youtube', '2026-01-18', '2026-01-24', '01/18-01/24', 199, NULL, 2439, NULL, NULL, NULL, 16.3),
    ('youtube', '2026-01-25', '2026-01-31', '01/25-01/31', 201, NULL, 2796, NULL, NULL, NULL, 15.4),
    ('youtube', '2026-02-01', '2026-02-07', '02/01-02/07', 204, NULL, 1748, NULL, NULL, NULL, 11.6),
    ('youtube', '2026-02-08', '2026-02-14', '02/08-02/14', 210, NULL, 17774, NULL, NULL, NULL, 55.4),
    ('youtube', '2026-02-15', '2026-02-21', '02/15-02/21', 217, NULL, 14467, NULL, NULL, NULL, 43.6),
    ('youtube', '2026-02-22', '2026-02-28', '02/22-02/28', 224, NULL, 7734, NULL, NULL, NULL, 57.7),
    ('youtube', '2026-03-01', '2026-03-07', '03/01-03/07', 226, NULL, 5281, NULL, NULL, NULL, 31.7),
    ('youtube', '2026-03-08', '2026-03-14', '03/08-03/14', 232, NULL, 3965, NULL, NULL, NULL, 31.2),
    ('youtube', '2026-03-15', '2026-03-21', '03/15-03/21', 235, NULL, 14454, NULL, NULL, NULL, 43.5),
    ('youtube', '2026-03-22', '2026-03-28', '03/22-03/28', 251, NULL, 6622, NULL, NULL, NULL, 38.6),
    ('youtube', '2026-03-29', '2026-04-04', '03/29-04/04', 269, NULL, 15430, NULL, NULL, NULL, 59.0),
    ('youtube', '2026-04-05', '2026-04-11', '04/05-04/11', 275, NULL, 37902, NULL, NULL, NULL, 146.7),
    ('youtube', '2026-04-12', '2026-04-18', '04/12-04/18', 286, NULL, 49759, NULL, NULL, NULL, 146.2),
    ('youtube', '2026-04-19', '2026-04-25', '04/19-04/25', 291, NULL, 87285, NULL, NULL, NULL, 206.3),
    ('youtube', '2026-04-26', '2026-05-02', '04/26-05/02', 301, NULL, 80618, NULL, NULL, NULL, 264.4),
    ('youtube', '2026-05-03', '2026-05-09', '05/03-05/09', 307, NULL, 101518, NULL, NULL, NULL, 236.3),
    ('youtube', '2026-05-10', '2026-05-16', '05/10-05/16', 311, NULL, 90003, NULL, NULL, NULL, 184.9),
    ('youtube', '2026-05-17', '2026-05-23', '05/17-05/23', 318, NULL, 318, NULL, NULL, NULL, 8.8),
    ('youtube', '2026-05-24', '2026-05-30', '05/24-05/30', 321, NULL, 355, NULL, NULL, NULL, 9.9),
    ('youtube', '2026-05-31', '2026-06-06', '05/31-06/06', 326, NULL, 16745, NULL, NULL, NULL, 115.5),
    ('youtube', '2026-06-07', '2026-06-13', '06/07-06/13', 333, NULL, 180777, NULL, NULL, NULL, 1532.7),
    ('youtube', '2026-06-14', '2026-06-20', '06/14-06/20', 336, NULL, 12167, NULL, NULL, NULL, 100.8),
    ('youtube', '2026-06-21', '2026-06-27', '06/21-06/27', 340, NULL, 1593, NULL, NULL, NULL, 13.5),
    ('youtube', '2026-06-28', '2026-07-04', '06/28-07/04', 340, NULL, 1847, NULL, NULL, NULL, 13.1),
    -- TikTok (views, likes, followers)
    ('tiktok', '2025-12-28', '2026-01-03', '12/28-01/03', 4, NULL, 0, 0, NULL, NULL, NULL),
    ('tiktok', '2026-01-04', '2026-01-10', '01/04-01/10', 4, NULL, 1, 0, NULL, NULL, NULL),
    ('tiktok', '2026-01-11', '2026-01-17', '01/11-01/17', 4, NULL, 13, 0, NULL, NULL, NULL),
    ('tiktok', '2026-01-18', '2026-01-24', '01/18-01/24', 4, NULL, 0, 0, NULL, NULL, NULL),
    ('tiktok', '2026-01-25', '2026-01-31', '01/25-01/31', 4, NULL, 3, 0, NULL, NULL, NULL),
    ('tiktok', '2026-02-01', '2026-02-07', '02/01-02/07', 5, NULL, 4, 2, NULL, NULL, NULL),
    ('tiktok', '2026-02-08', '2026-02-14', '02/08-02/14', 5, NULL, 19, 3, NULL, NULL, NULL),
    ('tiktok', '2026-02-15', '2026-02-21', '02/15-02/21', 7, NULL, 133, 3, NULL, NULL, NULL),
    ('tiktok', '2026-02-22', '2026-02-28', '02/22-02/28', 8, NULL, 9, 4, NULL, NULL, NULL),
    ('tiktok', '2026-03-01', '2026-03-07', '03/01-03/07', 8, NULL, 257, 2, NULL, NULL, NULL),
    ('tiktok', '2026-03-08', '2026-03-14', '03/08-03/14', 8, NULL, 113, 1, NULL, NULL, NULL),
    ('tiktok', '2026-03-15', '2026-03-21', '03/15-03/21', 8, NULL, 105, 0, NULL, NULL, NULL),
    ('tiktok', '2026-03-22', '2026-03-28', '03/22-03/28', 8, NULL, 336, 9, NULL, NULL, NULL),
    ('tiktok', '2026-03-29', '2026-04-04', '03/29-04/04', 8, NULL, 117, 0, NULL, NULL, NULL),
    ('tiktok', '2026-04-05', '2026-04-11', '04/05-04/11', 8, NULL, 102, 1, NULL, NULL, NULL),
    ('tiktok', '2026-04-12', '2026-04-18', '04/12-04/18', 9, NULL, 116, 1, NULL, NULL, NULL),
    ('tiktok', '2026-04-19', '2026-04-25', '04/19-04/25', 10, NULL, 474, 5, NULL, NULL, NULL),
    ('tiktok', '2026-04-26', '2026-05-02', '04/26-05/02', 14, NULL, 744, 13, NULL, NULL, NULL),
    ('tiktok', '2026-05-03', '2026-05-09', '05/03-05/09', 18, NULL, 774, 16, NULL, NULL, NULL),
    ('tiktok', '2026-05-10', '2026-05-16', '05/10-05/16', 20, NULL, 686, 3, NULL, NULL, NULL),
    ('tiktok', '2026-05-17', '2026-05-23', '05/17-05/23', 21, NULL, 371, 4, NULL, NULL, NULL),
    ('tiktok', '2026-05-24', '2026-05-30', '05/24-05/30', 22, NULL, 252, 4, NULL, NULL, NULL),
    ('tiktok', '2026-05-31', '2026-06-06', '05/31-06/06', 22, NULL, 219, 4, NULL, NULL, NULL),
    ('tiktok', '2026-06-07', '2026-06-13', '06/07-06/13', 22, NULL, 252, 0, NULL, NULL, NULL),
    ('tiktok', '2026-06-14', '2026-06-20', '06/14-06/20', 22, NULL, 77, 0, NULL, NULL, NULL),
    ('tiktok', '2026-06-21', '2026-06-27', '06/21-06/27', 22, NULL, 7, 1, NULL, NULL, NULL),
    ('tiktok', '2026-06-28', '2026-07-04', '06/28-07/04', 23, NULL, 1, 0, NULL, NULL, NULL),
    -- LinkedIn (impressions, reactions->likes, followers)
    ('linkedin', '2025-12-28', '2026-01-03', '12/28-01/03', 203, 983, NULL, 29, NULL, NULL, NULL),
    ('linkedin', '2026-01-04', '2026-01-10', '01/04-01/10', 205, 775, NULL, 23, NULL, NULL, NULL),
    ('linkedin', '2026-01-11', '2026-01-17', '01/11-01/17', 212, 943, NULL, 28, NULL, NULL, NULL),
    ('linkedin', '2026-01-18', '2026-01-24', '01/18-01/24', 217, 1013, NULL, 18, NULL, NULL, NULL),
    ('linkedin', '2026-01-25', '2026-01-31', '01/25-01/31', 231, 1999, NULL, 35, NULL, NULL, NULL),
    ('linkedin', '2026-02-01', '2026-02-07', '02/01-02/07', 246, 2591, NULL, 15, NULL, NULL, NULL),
    ('linkedin', '2026-02-08', '2026-02-14', '02/08-02/14', 257, 1666, NULL, 20, NULL, NULL, NULL),
    ('linkedin', '2026-02-15', '2026-02-21', '02/15-02/21', 268, 1808, NULL, 26, NULL, NULL, NULL),
    ('linkedin', '2026-02-22', '2026-02-28', '02/22-02/28', 289, 1489, NULL, 30, NULL, NULL, NULL),
    ('linkedin', '2026-03-01', '2026-03-07', '03/01-03/07', 315, 1362, NULL, 21, NULL, NULL, NULL),
    ('linkedin', '2026-03-08', '2026-03-14', '03/08-03/14', 330, 1821, NULL, 33, NULL, NULL, NULL),
    ('linkedin', '2026-03-15', '2026-03-21', '03/15-03/21', 343, 826, NULL, 18, NULL, NULL, NULL),
    ('linkedin', '2026-03-22', '2026-03-28', '03/22-03/28', 350, 830, NULL, 12, NULL, NULL, NULL),
    ('linkedin', '2026-03-29', '2026-04-04', '03/29-04/04', 357, 1095, NULL, 25, NULL, NULL, NULL),
    ('linkedin', '2026-04-05', '2026-04-11', '04/05-04/11', 365, 1470, NULL, 24, NULL, NULL, NULL),
    ('linkedin', '2026-04-12', '2026-04-18', '04/12-04/18', 372, 1082, NULL, 21, NULL, NULL, NULL),
    ('linkedin', '2026-04-19', '2026-04-25', '04/19-04/25', 386, 1895, NULL, 20, NULL, NULL, NULL),
    ('linkedin', '2026-04-26', '2026-05-02', '04/26-05/02', 389, 1226, NULL, 19, NULL, NULL, NULL),
    ('linkedin', '2026-05-03', '2026-05-09', '05/03-05/09', 396, 1156, NULL, 17, NULL, NULL, NULL),
    ('linkedin', '2026-05-10', '2026-05-16', '05/10-05/16', 406, 714, NULL, 12, NULL, NULL, NULL),
    ('linkedin', '2026-05-17', '2026-05-23', '05/17-05/23', 409, 707, NULL, 13, NULL, NULL, NULL),
    ('linkedin', '2026-05-24', '2026-05-30', '05/24-05/30', 413, 772, NULL, 14, NULL, NULL, NULL),
    ('linkedin', '2026-05-31', '2026-06-06', '05/31-06/06', 415, 595, NULL, 14, NULL, NULL, NULL),
    ('linkedin', '2026-06-07', '2026-06-13', '06/07-06/13', 420, 1028, NULL, 21, NULL, NULL, NULL),
    ('linkedin', '2026-06-14', '2026-06-20', '06/14-06/20', 425, 840, NULL, 17, NULL, NULL, NULL),
    ('linkedin', '2026-06-21', '2026-06-27', '06/21-06/27', 426, 748, NULL, 13, NULL, NULL, NULL),
    ('linkedin', '2026-06-28', '2026-07-04', '06/28-07/04', 428, 7237, NULL, 19, NULL, NULL, NULL)
)
INSERT INTO kpi_snapshots (account_id, period, period_start, period_end, period_label, followers, impressions, views, likes, shares, engagement_rate, watch_time_seconds, source)
SELECT
    pa.id, 'weekly'::period_type, d.period_start, d.period_end, d.period_label,
    d.followers, d.impressions, d.views, d.likes, d.shares, d.engagement_rate,
    CASE WHEN d.watch_time_h IS NOT NULL THEN ROUND(d.watch_time_h * 3600)::bigint ELSE NULL END,
    'google_sheets_backfill'
FROM weekly_data d
JOIN platform_accounts pa ON pa.platform::text = d.platform
ON CONFLICT (account_id, period, period_start) DO UPDATE SET
    followers = EXCLUDED.followers, impressions = EXCLUDED.impressions,
    views = EXCLUDED.views, likes = EXCLUDED.likes, shares = EXCLUDED.shares,
    engagement_rate = EXCLUDED.engagement_rate, watch_time_seconds = EXCLUDED.watch_time_seconds,
    source = 'google_sheets_backfill';

-- =====================================================================
-- MONTHLY DATA (Jan-Jun 2026)
-- =====================================================================
WITH monthly_data(platform, period_start, period_end, period_label, followers, impressions, views, likes, shares, engagement_rate, watch_time_h) AS (VALUES
    -- Twitter Monthly: impressions, followers, retweets, likes, engagement
    ('twitter'::text, '2026-01-01'::date, '2026-01-31'::date, 'January', 152::bigint, 5162::bigint, NULL::bigint, 20::bigint, 22::bigint, 2.6::numeric, NULL::numeric),
    ('twitter', '2026-02-01', '2026-02-28', 'February', 172, 4084, NULL, 117, 66, 8.3, NULL),
    ('twitter', '2026-03-01', '2026-03-31', 'March', 181, 2844, NULL, 130, 106, 12.3, NULL),
    ('twitter', '2026-04-01', '2026-04-30', 'April', 191, 80009, NULL, 274, 142, 0.9, NULL),
    ('twitter', '2026-05-01', '2026-05-31', 'May', 204, 10827, NULL, 187, 116, 2.9, NULL),
    ('twitter', '2026-06-01', '2026-06-30', 'June', 215, 2597, NULL, 156, 135, 12.5, NULL),
    -- Instagram Monthly: views, followers, interactions
    ('instagram', '2026-01-01', '2026-01-31', 'January', 1748, NULL, 150783, 894, NULL, NULL, NULL),
    ('instagram', '2026-02-01', '2026-02-28', 'February', 1880, NULL, 146758, 717, NULL, NULL, NULL),
    ('instagram', '2026-03-01', '2026-03-31', 'March', 1950, NULL, 95894, 548, NULL, NULL, NULL),
    ('instagram', '2026-04-01', '2026-04-30', 'April', 2150, NULL, 164851, 740, NULL, NULL, NULL),
    ('instagram', '2026-05-01', '2026-05-31', 'May', 2358, NULL, 241082, 1177, NULL, NULL, NULL),
    ('instagram', '2026-06-01', '2026-06-30', 'June', 2534, NULL, 302748, 1178, NULL, NULL, NULL),
    -- Facebook Monthly
    ('facebook', '2026-01-01', '2026-01-31', 'January', 505, NULL, 1226716, 376, NULL, NULL, NULL),
    ('facebook', '2026-02-01', '2026-02-28', 'February', 553, NULL, 434664, 462, NULL, NULL, NULL),
    ('facebook', '2026-03-01', '2026-03-31', 'March', 595, NULL, 450347, 364, NULL, NULL, NULL),
    ('facebook', '2026-04-01', '2026-04-30', 'April', 666, NULL, 735058, 861, NULL, NULL, NULL),
    ('facebook', '2026-05-01', '2026-05-31', 'May', 739, NULL, 1026102, 781, NULL, NULL, NULL),
    ('facebook', '2026-06-01', '2026-06-30', 'June', 790, NULL, 797442, 802, NULL, NULL, NULL),
    -- YouTube Monthly
    ('youtube', '2026-01-01', '2026-01-31', 'January', 201, NULL, 18136, NULL, NULL, NULL, 97.5),
    ('youtube', '2026-02-01', '2026-02-28', 'February', 224, NULL, 41668, NULL, NULL, NULL, 168.3),
    ('youtube', '2026-03-01', '2026-03-31', 'March', 263, NULL, 27988, NULL, NULL, NULL, 162.3),
    ('youtube', '2026-04-01', '2026-04-30', 'April', 301, NULL, 229824, NULL, NULL, NULL, 692.4),
    ('youtube', '2026-05-01', '2026-05-31', 'May', 322, NULL, 227287, NULL, NULL, NULL, 548.0),
    ('youtube', '2026-06-01', '2026-06-30', 'June', 340, NULL, 204077, NULL, NULL, NULL, 1766.7),
    -- TikTok Monthly
    ('tiktok', '2026-01-01', '2026-01-31', 'January', 4, NULL, 17, 1, NULL, NULL, NULL),
    ('tiktok', '2026-02-01', '2026-02-28', 'February', 8, NULL, 165, 12, NULL, NULL, NULL),
    ('tiktok', '2026-03-01', '2026-03-31', 'March', 8, NULL, 915, 12, NULL, NULL, NULL),
    ('tiktok', '2026-04-01', '2026-04-30', 'April', 14, NULL, 1317, 17, NULL, NULL, NULL),
    ('tiktok', '2026-05-01', '2026-05-31', 'May', 22, NULL, 2223, 29, NULL, NULL, NULL),
    ('tiktok', '2026-06-01', '2026-06-30', 'June', 23, NULL, 549, 5, NULL, NULL, NULL),
    -- LinkedIn Monthly
    ('linkedin', '2026-01-01', '2026-01-31', 'January', 231, 5260, NULL, 122, NULL, NULL, NULL),
    ('linkedin', '2026-02-01', '2026-02-28', 'February', 289, 7554, NULL, 91, NULL, NULL, NULL),
    ('linkedin', '2026-03-01', '2026-03-31', 'March', 351, 5289, NULL, 96, NULL, NULL, NULL),
    ('linkedin', '2026-04-01', '2026-04-30', 'April', 389, 6003, NULL, 95, NULL, NULL, NULL),
    ('linkedin', '2026-05-01', '2026-05-31', 'May', 413, 3719, NULL, 58, NULL, NULL, NULL),
    ('linkedin', '2026-06-01', '2026-06-30', 'June', 428, 6479, NULL, 70, NULL, NULL, NULL)
)
INSERT INTO kpi_snapshots (account_id, period, period_start, period_end, period_label, followers, impressions, views, likes, shares, engagement_rate, watch_time_seconds, source)
SELECT
    pa.id, 'monthly'::period_type, d.period_start, d.period_end, d.period_label,
    d.followers, d.impressions, d.views, d.likes, d.shares, d.engagement_rate,
    CASE WHEN d.watch_time_h IS NOT NULL THEN ROUND(d.watch_time_h * 3600)::bigint ELSE NULL END,
    'google_sheets_backfill'
FROM monthly_data d
JOIN platform_accounts pa ON pa.platform::text = d.platform
ON CONFLICT (account_id, period, period_start) DO UPDATE SET
    followers = EXCLUDED.followers, impressions = EXCLUDED.impressions,
    views = EXCLUDED.views, likes = EXCLUDED.likes, shares = EXCLUDED.shares,
    engagement_rate = EXCLUDED.engagement_rate, watch_time_seconds = EXCLUDED.watch_time_seconds,
    source = 'google_sheets_backfill';

-- =====================================================================
-- QUARTERLY DATA (2025 baseline, 2026 Q1, 2026 Q2)
-- =====================================================================
WITH quarterly_data(platform, period_start, period_end, period_label, followers, impressions, views, likes, shares, engagement_rate, watch_time_h) AS (VALUES
    -- Twitter Quarterly
    ('twitter'::text, '2025-01-01'::date, '2025-03-31'::date, '2025 Q1', 135::bigint, 17069::bigint, NULL::bigint, 118::bigint, 134::bigint, 4.1::numeric, NULL::numeric),
    ('twitter', '2026-01-01', '2026-03-31', '2026 Q1', 181, 12094, NULL, 267, 194, 6.8, NULL),
    ('twitter', '2026-04-01', '2026-06-30', '2026 Q2', 215, 93457, NULL, 617, 395, 1.1, NULL),
    -- Instagram Quarterly
    ('instagram', '2025-01-01', '2025-03-31', '2025 Q1', 1487, NULL, 422279, 2792, NULL, NULL, NULL),
    ('instagram', '2026-01-01', '2026-03-31', '2026 Q1', 1959, NULL, 393435, 2156, NULL, NULL, NULL),
    ('instagram', '2026-04-01', '2026-06-30', '2026 Q2', 2534, NULL, 708681, 3095, NULL, NULL, NULL),
    -- Facebook Quarterly
    ('facebook', '2025-01-01', '2025-03-31', '2025 Q1', 235, NULL, 1776007, 2336, NULL, NULL, NULL),
    ('facebook', '2026-01-01', '2026-03-31', '2026 Q1', 595, NULL, 2111906, 1202, NULL, NULL, NULL),
    ('facebook', '2026-04-01', '2026-06-30', '2026 Q2', 790, NULL, 2558602, 2444, NULL, NULL, NULL),
    -- YouTube Quarterly
    ('youtube', '2025-01-01', '2025-03-31', '2025 Q1', 186, NULL, 55314, NULL, NULL, NULL, 301.5),
    ('youtube', '2026-01-01', '2026-03-31', '2026 Q1', 263, NULL, 87786, NULL, NULL, NULL, 428.1),
    -- Sheet says 30,003.60 watch hours for Q2 but Apr+May+Jun monthlies sum to ~3,007 — likely a typo in the sheet; using sheet value as-is
    ('youtube', '2026-04-01', '2026-06-30', '2026 Q2', 341, NULL, 668694, NULL, NULL, NULL, 30003.6),
    -- TikTok Quarterly
    ('tiktok', '2025-01-01', '2025-03-31', '2025 Q1', 4, NULL, 51, 0, NULL, NULL, NULL),
    ('tiktok', '2026-01-01', '2026-03-31', '2026 Q1', 8, NULL, 1100, 24, NULL, NULL, NULL),
    ('tiktok', '2026-04-01', '2026-06-30', '2026 Q2', 23, NULL, 4088, 51, NULL, NULL, NULL),
    -- LinkedIn Quarterly
    ('linkedin', '2025-01-01', '2025-03-31', '2025 Q1', 229, 12994, NULL, 402, NULL, NULL, NULL),
    ('linkedin', '2026-01-01', '2026-03-31', '2026 Q1', 351, 17877, NULL, 300, NULL, NULL, NULL),
    ('linkedin', '2026-04-01', '2026-06-30', '2026 Q2', 428, 16216, NULL, 222, NULL, NULL, NULL)
)
INSERT INTO kpi_snapshots (account_id, period, period_start, period_end, period_label, followers, impressions, views, likes, shares, engagement_rate, watch_time_seconds, source)
SELECT
    pa.id, 'quarterly'::period_type, d.period_start, d.period_end, d.period_label,
    d.followers, d.impressions, d.views, d.likes, d.shares, d.engagement_rate,
    CASE WHEN d.watch_time_h IS NOT NULL THEN ROUND(d.watch_time_h * 3600)::bigint ELSE NULL END,
    'google_sheets_backfill'
FROM quarterly_data d
JOIN platform_accounts pa ON pa.platform::text = d.platform
ON CONFLICT (account_id, period, period_start) DO UPDATE SET
    followers = EXCLUDED.followers, impressions = EXCLUDED.impressions,
    views = EXCLUDED.views, likes = EXCLUDED.likes, shares = EXCLUDED.shares,
    engagement_rate = EXCLUDED.engagement_rate, watch_time_seconds = EXCLUDED.watch_time_seconds,
    source = 'google_sheets_backfill';

-- =====================================================================
-- VERIFICATION
-- =====================================================================
SELECT period, platform, COUNT(*) as rows_loaded
FROM kpi_snapshots s
JOIN platform_accounts a ON a.id = s.account_id
GROUP BY period, platform
ORDER BY period, platform;
