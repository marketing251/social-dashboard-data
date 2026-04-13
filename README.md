# PropAccount Social Dashboard v2

Next.js + Supabase + Vercel rebuild of the social media analytics dashboard.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Supabase** — Postgres + Auth + RLS
- **Tailwind CSS** for styling
- **Recharts** for charts
- **Vercel** deployment + Cron

## Local setup

```bash
# 1. Install
npm install

# 2. Configure env
cp .env.local.example .env.local
# Fill in the Supabase URL + keys from your project dashboard

# 3. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

## Supabase setup

1. Create project at [supabase.com](https://supabase.com/dashboard)
2. In the SQL Editor, run **in order**:
   - `supabase/schema.sql`
   - `supabase/policies.sql`
   - `supabase/seed.sql`
3. In Authentication → Users, create an admin user (email + password)
4. Settings → API → copy `Project URL`, `anon` key, `service_role` key into `.env.local`

## Folder structure

```
src/
├── app/
│   ├── (auth)/login/              → login form + server action
│   ├── (dashboard)/               → 5 tabs (Summary, Platforms, Competitors, Content, Links)
│   └── api/
│       ├── admin/                 → CSV import, manual entry (auth required)
│       ├── cron/sync              → Vercel Cron weekly job
│       └── sync/{platform}        → Manual per-platform sync trigger
├── components/dashboard/          → KPICard, TrendChart, StackedBarChart, InsightCard, etc.
├── lib/
│   ├── supabase/                  → client / server / admin
│   ├── kpi/                       → format, aggregate, insights, types, load
│   └── connectors/                → youtube, instagram, twitter, linkedin
└── middleware.ts                  → auth gate for /dashboard/*
```

## Data flow

1. **Manual entry** via `/api/admin/manual-entry` (POST JSON)
2. **CSV import** via `/api/admin/import-csv` (POST text/csv)
3. **Scheduled sync** via Vercel Cron → `/api/cron/sync` (weekly Mon 06:00 UTC)

All writes land in `kpi_snapshots`. Dashboard pages read from there via server components.

## Connectors

Implemented:
- ✅ **YouTube** — public API key auth, pulls channel stats

Stubs (ready to implement):
- 🔲 Instagram Graph API
- 🔲 X API v2
- 🔲 LinkedIn Marketing API

Each connector implements the `SocialConnector` interface in `src/lib/connectors/base.ts`.

## CSV import format

```csv
period,period_start,period_end,period_label,platform,handle,followers,impressions,views,likes,comments,shares,saves,engagement_rate
weekly,2026-03-15,2026-03-21,03/15-03/21,twitter,PropAccountWL,181,609,,24,20,,,11.3
weekly,2026-03-15,2026-03-21,03/15-03/21,instagram,propaccountsolutions,1940,,32210,179,,,,
```

Upload via:
```bash
curl -X POST https://YOUR-APP.vercel.app/api/admin/import-csv \
  -H "Cookie: YOUR_AUTH_COOKIE" \
  -H "Content-Type: text/csv" \
  --data-binary @data.csv
```

## Deployment

1. Push repo to GitHub
2. Import in Vercel (New Project → Import Git Repository)
3. Add env vars in Vercel Project Settings → Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET` (generate with `openssl rand -hex 32`)
   - Optional: `YOUTUBE_API_KEY`, `INSTAGRAM_ACCESS_TOKEN`, etc.
4. Deploy — cron is auto-configured via `vercel.json`

## Scripts

```bash
npm run dev         # local dev
npm run build       # production build
npm run start       # serve production build
npm run lint        # next lint
npm run typecheck   # tsc --noEmit
```
