-- Row Level Security — single-admin: auth users can do anything, anon cannot.

alter table platform_accounts enable row level security;
alter table kpi_snapshots enable row level security;
alter table post_metrics enable row level security;
alter table competitors enable row level security;
alter table competitor_snapshots enable row level security;
alter table content_benchmarks enable row level security;
alter table content_topics enable row level security;
alter table sync_logs enable row level security;
alter table user_settings enable row level security;

create policy "auth_all_platform_accounts" on platform_accounts for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_kpi_snapshots" on kpi_snapshots for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_post_metrics" on post_metrics for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_competitors" on competitors for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_competitor_snapshots" on competitor_snapshots for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_content_benchmarks" on content_benchmarks for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_all_content_topics" on content_topics for all
    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "auth_read_sync_logs" on sync_logs for select
    using (auth.role() = 'authenticated');

create policy "user_own_settings" on user_settings for all
    using (user_id = auth.uid()) with check (user_id = auth.uid());
