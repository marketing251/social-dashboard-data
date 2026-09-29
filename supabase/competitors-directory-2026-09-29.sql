-- =====================================================================
-- COMPETITOR DIRECTORY UPDATE: 2026-09-29
-- Source: PropAccount Competitor Directory (propaccount-competitors.csv)
-- Scope: Type = "Direct white-label" only; Saphyte and Trading Technologies excluded.
-- 26 competitors. Removes competitors not in this list (Tradelocker,
-- Devexperts: classed "Platform & broker tech" in the directory).
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- =====================================================================

alter table competitors add column if not exists notes text;

-- 1. Remove competitors outside the Direct white-label list (snapshots cascade)
delete from competitors
where is_self = false
  and name not in ('Match-Prop', 'YourPropFirm', 'Prop Suite', 'Zenproptech', 'FX Prop Tech', 'PropFirmsTech', 'Trade Tech Solutions', 'Propriotec', 'Prop Fintech', 'Prop Forge', 'Prop Label', 'Prop Trading Software', 'Propper', 'Execurve (PropScale)', 'B2Broker (B2PROP)', 'FunderPro', 'Axcera', 'Hashcodex', 'FX Trusts', 'Marginware', 'Taurex Prime', 'Simple Prop', 'Proprietary Firms (PFT)', 'Prime Prop Tech', 'PropTradeTech (PTT)', 'Tickblaze');

-- 2. Upsert the directory
insert into competitors (name, description, website, is_self, instagram_url, twitter_url, facebook_url, youtube_url, tiktok_url, linkedin_url, notes, display_order) values
    ('Match-Prop', 'Match-Trade''s managed prop service for influencers, educators, IBs and trading communities: brand launch in 7 days on Match-Trader with CRM, liquidity, risk and compliance run for you. Upgrade path to full white label.', 'https://match-prop.com/', false, 'https://www.instagram.com/matchprop_official/', 'https://x.com/Match_Prop', 'https://www.facebook.com/profile.php?id=61592896799979', NULL, NULL, NULL, 'Newest and closest match to PropAccount''s offer: same 7-day claim, same educator/influencer buyer. Match-Trade says 70+ prop firms and $100M+ monthly challenge volume run on its tech. No LinkedIn of its own; uses Match-Trade''s.', 10),
    ('YourPropFirm', 'Prop firm ''operating system'': white-label challenge, CRM and risk stack. $2,749 setup + 50% rev share; SOC 2 / ISO 27001.', 'https://yourpropfirm.com', false, 'https://instagram.com/yourpropfirm', 'https://x.com/yourpropfirm', NULL, 'https://youtube.com/@YourPropFirm', 'https://tiktok.com/@yourpropfirm', 'https://www.linkedin.com/company/yourpropfirm', 'Primary threat. Parent: Quant Technology Group (linkedin.com/company/quanttechnologygroup, x.com/quanttechx).', 20),
    ('Prop Suite', 'YourPropFirm''s capital-backed white-label tier: $2,749 setup, no monthly fee, 3-day launch, vendor covers payouts.', 'https://propsuite.com', false, 'https://instagram.com/propsuite', 'https://twitter.com/propsuite', NULL, NULL, NULL, 'https://linkedin.com/company/propsuite', 'Same company as YourPropFirm (Prop Suite FZCO, Dubai). Directly copies PropAccount''s capital-backed pitch. Footer socials not confirmed live.', 30),
    ('Zenproptech', 'White-label prop firm tech: ''Launch Your Prop Firm in 15 Days''. Running Meta ads in PropAccount''s geos.', 'https://zenproptech.com', false, 'https://www.instagram.com/zenproptech', NULL, NULL, NULL, NULL, 'https://www.linkedin.com/company/zenproptech', 'Not on the FPFX tracker; one of only three advertisers in the category.', 40),
    ('FX Prop Tech', 'Dubai white-label platform to launch a prop firm in about 2 weeks.', 'https://fxproptech.com', false, 'https://www.instagram.com/fxproptech', 'https://twitter.com/fxproptech', 'https://www.facebook.com/profile.php?id=61556385973249', 'https://youtube.com/@FXPROPTECH', NULL, 'https://www.linkedin.com/company/fxproptech', 'Telegram is an invite link; Discord is a channel link, not a public invite.', 50),
    ('PropFirmsTech', 'All-in-one white-label prop software: storefront, risk engine, CRM, payouts, KYC, MT4/MT5, plus marketing services. ''Launch in 14 days''.', 'https://www.propfirmstech.com', false, 'https://www.instagram.com/propfirmstech/', 'https://x.com/PropFirmsTech', 'https://www.facebook.com/propfirmstech', 'https://www.youtube.com/@propfirmstech', NULL, 'https://www.linkedin.com/company/propfirmstech/', 'Cited in Google''s AI Overview for ''prop firm technology'' next to PropAccount.', 60),
    ('Trade Tech Solutions', 'Turnkey prop tech stack (CFD and futures), launch in under 15 days. Claims 85+ firms.', 'https://www.tradetechsolutions.io', false, 'https://www.instagram.com/trade.techsolutions/', 'https://x.com/XLTradeTech', NULL, NULL, NULL, 'https://www.linkedin.com/company/xltrade-tech-solutions', 'LinkedIn found by search, not linked from site (slug matches X handle). Buying paid search keywords.', 70),
    ('Propriotec', 'All-in-one prop tech: CRM, trading platform, launch in about 7 days. Flat-fee value option.', 'https://propriotec.com', false, 'https://www.instagram.com/propriotec/', NULL, NULL, NULL, NULL, 'https://www.linkedin.com/company/propriotec', 'Instagram found by search.', 80),
    ('Prop Fintech', 'All-in-one prop firm platform, ''live in 10 days'', fixed fee, no revenue share.', 'https://propfintech.com', false, NULL, 'https://x.com/prop_fintech', NULL, NULL, NULL, 'https://www.linkedin.com/company/prop-fintech/', 'Not the same company as Prop Firm FinTech (propfirmfintech.com).', 90),
    ('Prop Forge', 'White-label prop software: CRM, dashboard, challenge engine, payouts, KYC, risk. Claims 25+ firms.', 'https://propforge.io', false, NULL, NULL, NULL, NULL, NULL, 'https://www.linkedin.com/company/propforge', 'LinkedIn is the only profile the site links.', 100),
    ('Prop Label', '''Prop Firm Operating System'': white-label CRM, risk, KYC, payouts, affiliates; also incorporation and payment processing.', 'https://www.proplabel.com', false, NULL, NULL, NULL, NULL, NULL, NULL, 'No social profiles found anywhere. Links to FX Edge prop liquidity.', 110),
    ('Prop Trading Software', 'Turnkey white-label futures prop platform: challenge engine, risk, CRM; MT5, NinjaTrader, Rithmic, cTrader, Match-Trader; live in 5–10 days.', 'https://proptradingsoftware.net', false, NULL, NULL, NULL, NULL, NULL, NULL, 'No company name or socials on site. Looks new and SEO-driven.', 120),
    ('Propper', 'White-label prop platform: branded TradingView terminal, challenge builder, risk engine, payouts. Migrates firms off ProjectX, NinjaTrader, Tradovate.', 'https://proppertrading.com', false, NULL, NULL, NULL, NULL, NULL, NULL, 'Propper, LLC (Delaware). No socials found. Futures-focused.', 130),
    ('Execurve (PropScale)', 'PropScale CRM (challenges, KYC, payouts, affiliates) + IntraQuote platform + risk. From €740/mo.', 'https://www.execurve.com', false, NULL, 'https://x.com/execurve', 'https://www.facebook.com/execurve', NULL, NULL, 'https://www.linkedin.com/company/execurve/', 'Publishes ''launch a prop firm'' guide content.', 140),
    ('B2Broker (B2PROP)', 'B2PROP turnkey prop solution: B2Core challenge CRM + cTrader White Label Prop, liquidity, crypto processing, PSPs.', 'https://b2broker.com', false, NULL, 'https://x.com/b2broker_net', NULL, 'https://www.youtube.com/@b2broker_official', NULL, 'https://www.linkedin.com/company/b2broker/', 'Large broker-tech firm expanding into prop. Traffic is mostly broker/liquidity terms.', 150),
    ('FunderPro', 'Retail prop firm that also sells a turnkey prop tech package. Sells on ROI/CPA/LTV economics.', 'https://funderpro.com/prop-trading-technology/', false, 'https://www.instagram.com/funderpro/', 'https://x.com/funderpro', 'https://facebook.com/funderpro', 'https://www.youtube.com/@funderpro', 'https://www.tiktok.com/@funderpro', 'https://www.linkedin.com/company/funderprofx', 'No separate B2B site; socials are its retail accounts. Traffic is B2C prop-firm demand.', 160),
    ('Axcera', 'Prop CRM, risk engine and infrastructure; connects to MT4/5, DXtrade, cTrader, Match-Trader, TradeLocker, futures. Strong on fraud detection.', 'https://axcera.io', false, NULL, NULL, NULL, NULL, NULL, 'https://www.linkedin.com/company/axcera-tech', 'LinkedIn only. Ranks #2 for ''prop firm software''. x.com/axcera is an unrelated company.', 170),
    ('Hashcodex', 'Software agency (crypto, blockchain, fintech) that also builds white-label prop firm software. Aggressive SEO content.', 'https://www.hashcodex.com/prop-firm-solutions', false, 'https://www.instagram.com/hashcodexperts/', 'https://x.com/hashcodextech', 'https://www.facebook.com/people/Hashcodex-Tech/61565211946062/', 'https://www.youtube.com/@Hashcodex', NULL, 'https://www.linkedin.com/company/hashcodex/', 'Prop tech is a side line; runs a ''top prop firm software companies'' listicle.', 180),
    ('FX Trusts', 'Broker technology plus white-label prop software and challenge engine.', 'https://fxtrusts.com', false, 'https://www.instagram.com/fxtrustspremium2026/', 'https://x.com/Fxtrustpremium', 'https://www.facebook.com/fxtrusts', 'https://www.youtube.com/@FxTrusts', NULL, 'https://www.linkedin.com/company/fxtrusts/', NULL, 190),
    ('Marginware', 'Cloud white-label prop firm platform for forex/CFD/futures, plus liquidity connectivity.', 'https://www.marginware.com/', false, NULL, NULL, NULL, NULL, NULL, NULL, 'Old but live site. No socials anywhere.', 200),
    ('Taurex Prime', 'Institutional arm of broker Taurex: liquidity, FIX/MT5 APIs, turnkey prop firm packages.', 'https://www.taurexprime.com/prop', false, NULL, NULL, NULL, NULL, NULL, 'https://www.linkedin.com/showcase/taurexprime/', 'Only a LinkedIn showcase page; parent Taurex''s retail accounts are separate.', 210),
    ('Simple Prop', 'White-label prop platform: TradeLocker bridge, dashboards, affiliates/payouts, competitions.', 'https://www.simple-prop.io', false, 'https://www.instagram.com/simple_prop', NULL, NULL, NULL, NULL, NULL, 'CEO Niko Gelic. simpleprop.com is unrelated.', 220),
    ('Proprietary Firms (PFT)', 'End-to-end prop tech (evaluation, risk, performance management). Owned by Swiset since 2024.', 'https://proprietaryfirms.tech', false, NULL, NULL, NULL, NULL, NULL, NULL, 'No socials of its own; see Swiset. proprietaryfirms.com is an unrelated review site.', 230),
    ('Prime Prop Tech', 'White-label prop firm tech: ''Your Prop Firm. Our Technology.''', 'https://primeproptech.com', false, NULL, NULL, NULL, NULL, NULL, NULL, 'Site loads again (was marked broken). Placeholder socials and email, so likely very early stage.', 240),
    ('PropTradeTech (PTT)', 'Fully managed white-label prop program: branded portal, evaluations, risk, trader support.', 'https://proptradetech.com', false, NULL, NULL, NULL, NULL, NULL, 'https://www.linkedin.com/company/proptradetech', 'Site shows ''Website Unavailable'' (bad SSL); possibly defunct.', 250),
    ('Tickblaze', 'Futures trading platform plus prop firm launch/migration tech (''under 30 days'').', 'https://tickblaze.com', false, 'https://www.instagram.com/tickblaze', 'https://x.com/Tickblaze', 'https://www.facebook.com/Tickblaze/', 'https://www.youtube.com/@tickblaze', NULL, 'https://www.linkedin.com/company/tickblaze', NULL, 260)
on conflict (name) do update set
    description = excluded.description, website = excluded.website,
    instagram_url = excluded.instagram_url, twitter_url = excluded.twitter_url,
    facebook_url = excluded.facebook_url, youtube_url = excluded.youtube_url,
    tiktok_url = excluded.tiktok_url, linkedin_url = excluded.linkedin_url,
    notes = excluded.notes, display_order = excluded.display_order;

-- 3. Follower snapshot (public pages, captured 2026-09-28/29)
--    X counts for YourPropFirm, Trade Tech Solutions and Tickblaze are carried
--    from 2026-04-01 (x.com unreachable); no X counts for new competitors.
insert into competitor_snapshots (competitor_id, snapshot_date, instagram_followers, twitter_followers, youtube_subscribers, tiktok_followers, notes, source)
select c.id, '2026-09-29'::date, s.ig, s.x, s.yt, s.tt, s.notes, 'public_page_capture'
from competitors c
join (values
    ('Match-Prop', 27, NULL::bigint, NULL::bigint, NULL::bigint, NULL),
    ('YourPropFirm', 1299, 102, 232, 74, 'X carried from 04/01'),
    ('Prop Suite', 2, NULL::bigint, NULL::bigint, NULL::bigint, NULL),
    ('Zenproptech', 667, NULL::bigint, NULL::bigint, NULL::bigint, NULL),
    ('FX Prop Tech', 597, NULL::bigint, 14, NULL::bigint, NULL),
    ('PropFirmsTech', NULL::bigint, NULL::bigint, NULL::bigint, NULL::bigint, 'Instagram account unavailable (shut down)'),
    ('Trade Tech Solutions', NULL::bigint, 1545, NULL::bigint, NULL::bigint, 'Instagram account unavailable (shut down); X carried from 04/01'),
    ('Propriotec', 74, NULL::bigint, NULL::bigint, NULL::bigint, NULL),
    ('B2Broker (B2PROP)', NULL::bigint, NULL::bigint, 9030, NULL::bigint, NULL),
    ('FunderPro', NULL::bigint, NULL::bigint, 11500, 1636, 'Instagram account unavailable (shut down)'),
    ('Hashcodex', 125, NULL::bigint, 27, NULL::bigint, NULL),
    ('FX Trusts', 12, NULL::bigint, NULL::bigint, NULL::bigint, NULL),
    ('Simple Prop', 43, NULL::bigint, NULL::bigint, NULL::bigint, NULL),
    ('Tickblaze', 1336, 716, 5550, NULL::bigint, 'X carried from 04/01')
) as s(name, ig, x, yt, tt, notes) on s.name = c.name
on conflict (competitor_id, snapshot_date) do update set
    instagram_followers = excluded.instagram_followers, twitter_followers = excluded.twitter_followers,
    youtube_subscribers = excluded.youtube_subscribers, tiktok_followers = excluded.tiktok_followers,
    notes = excluded.notes, source = excluded.source;

-- Verify: expect 26 competitors + PropAccount
select count(*) filter (where not is_self) as competitors, count(*) filter (where is_self) as self from competitors;
