-- =====================================================================
-- AI INSIGHTS: table for Claude-generated dashboard insights
-- Run once in the Supabase SQL Editor.
-- Rows are written by the daily sheet-sync cron (service role) and read
-- by the dashboard (authenticated users).
-- =====================================================================
create table if not exists ai_insights (
    id uuid primary key default gen_random_uuid(),
    period period_type not null unique,
    insights jsonb not null,
    model text,
    generated_at timestamptz default now()
);

alter table ai_insights enable row level security;
create policy "auth_read_ai_insights" on ai_insights for select
    using (auth.role() = 'authenticated');
