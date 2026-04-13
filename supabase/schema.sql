-- =====================================================================
-- SOCIAL DASHBOARD V2 — CORE SCHEMA
-- Run in Supabase SQL editor
-- =====================================================================

create type period_type as enum ('weekly', 'monthly', 'quarterly');
create type platform_type as enum ('twitter', 'instagram', 'facebook', 'youtube', 'tiktok', 'linkedin');
create type content_type as enum ('reels', 'long_video', 'carousel', 'static_image', 'stories', 'text_thread');
create type sync_status as enum ('success', 'partial', 'failed');

create table platform_accounts (
    id uuid primary key default gen_random_uuid(),
    platform platform_type not null,
    handle text not null,
    display_name text,
    profile_url text,
    external_id text,
    access_token text,
    refresh_token text,
    token_expires_at timestamptz,
    active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    unique(platform, handle)
);
create index idx_platform_accounts_platform on platform_accounts(platform) where active;

create table kpi_snapshots (
    id uuid primary key default gen_random_uuid(),
    account_id uuid not null references platform_accounts(id) on delete cascade,
    period period_type not null,
    period_start date not null,
    period_end date not null,
    period_label text not null,
    followers bigint,
    impressions bigint,
    reach bigint,
    views bigint,
    likes bigint,
    comments bigint,
    shares bigint,
    saves bigint,
    watch_time_seconds bigint,
    engagement_rate numeric(5,2),
    source text default 'manual',
    raw_data jsonb,
    created_at timestamptz default now(),
    unique(account_id, period, period_start)
);
create index idx_kpi_snapshots_account_period on kpi_snapshots(account_id, period, period_start desc);
create index idx_kpi_snapshots_period_start on kpi_snapshots(period_start desc);

create table post_metrics (
    id uuid primary key default gen_random_uuid(),
    account_id uuid not null references platform_accounts(id) on delete cascade,
    external_post_id text not null,
    content_type content_type,
    posted_at timestamptz not null,
    caption text,
    permalink text,
    likes bigint default 0,
    comments bigint default 0,
    views bigint default 0,
    shares bigint default 0,
    saves bigint default 0,
    impressions bigint,
    engagement bigint generated always as (
        coalesce(likes,0) + coalesce(comments,0) + coalesce(shares,0) + coalesce(saves,0)
    ) stored,
    topic text,
    metadata jsonb,
    last_synced_at timestamptz default now(),
    unique(account_id, external_post_id)
);
create index idx_post_metrics_account_posted on post_metrics(account_id, posted_at desc);
create index idx_post_metrics_content_type on post_metrics(content_type, posted_at desc);
create index idx_post_metrics_topic on post_metrics(topic);

create table competitors (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    website text,
    is_self boolean default false,
    instagram_url text,
    twitter_url text,
    facebook_url text,
    youtube_url text,
    tiktok_url text,
    linkedin_url text,
    display_order int default 100,
    created_at timestamptz default now()
);
create index idx_competitors_is_self on competitors(is_self) where is_self;

create table competitor_snapshots (
    id uuid primary key default gen_random_uuid(),
    competitor_id uuid not null references competitors(id) on delete cascade,
    snapshot_date date not null,
    instagram_followers bigint,
    twitter_followers bigint,
    facebook_followers bigint,
    youtube_subscribers bigint,
    tiktok_followers bigint,
    linkedin_followers bigint,
    notes text,
    source text default 'manual',
    created_at timestamptz default now(),
    unique(competitor_id, snapshot_date)
);
create index idx_competitor_snapshots_date on competitor_snapshots(snapshot_date desc);

create table content_benchmarks (
    id uuid primary key default gen_random_uuid(),
    competitor_id uuid not null references competitors(id) on delete cascade,
    content_type content_type not null,
    avg_engagement bigint,
    avg_impressions bigint,
    avg_likes bigint,
    avg_comments bigint,
    content_mix_pct numeric(5,2),
    benchmark_date date not null,
    created_at timestamptz default now(),
    unique(competitor_id, content_type, benchmark_date)
);

create table content_topics (
    id uuid primary key default gen_random_uuid(),
    topic text not null unique,
    avg_engagement bigint,
    color text,
    display_order int,
    updated_at timestamptz default now()
);

create table sync_logs (
    id uuid primary key default gen_random_uuid(),
    platform platform_type,
    account_id uuid references platform_accounts(id) on delete set null,
    status sync_status not null,
    rows_inserted int default 0,
    rows_updated int default 0,
    error_message text,
    duration_ms int,
    started_at timestamptz default now(),
    finished_at timestamptz
);
create index idx_sync_logs_platform_started on sync_logs(platform, started_at desc);

create table user_settings (
    user_id uuid primary key references auth.users(id) on delete cascade,
    theme text default 'dark',
    default_period period_type default 'weekly',
    notifications_enabled boolean default false,
    updated_at timestamptz default now()
);

create or replace function touch_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger touch_platform_accounts before update on platform_accounts
    for each row execute function touch_updated_at();
create trigger touch_user_settings before update on user_settings
    for each row execute function touch_updated_at();
