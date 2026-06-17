# WHOOP-Powered Circadian Intelligence

Self-hosted circadian rhythm intelligence that ingests WHOOP biometric data, computes personal energy peaks, cognitive dips, groggy windows, and melatonin windows locally, and surfaces predictions in a Meta display-optimized UI.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind
- **Supabase** Postgres for sleep records, predictions, and OAuth tokens
- **NextAuth.js** with custom WHOOP OAuth provider
- **Rule-based two-process engine** in `lib/circadian/`

## Quick Start

```bash
cp .env.example .env.local
# Fill in Supabase + WHOOP + NextAuth credentials

# Apply schema in Supabase SQL editor:
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_recovery_sleep_debt.sql

npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) — demo predictions render without auth. Connect WHOOP in Settings for live data.

## Routes

| Route | Purpose |
|-------|---------|
| `/dashboard` | Main circadian dashboard |
| `/dashboard/settings` | WHOOP OAuth + calibration |
| `/display?mode=` | Meta HUD (timeline, peak, groggy, dip, melatonin, compact) |
| `/api/webhooks/whoop` | WHOOP webhook receiver (sleep/recovery events) |
| `/api/webhooks/whoop/reconcile` | Cron retry for pending/failed webhooks (Bearer CRON_SECRET) |
| `/api/sync/whoop` | Manual + daily cron full sync (Bearer CRON_SECRET) |
| `/api/predictions/today` | Today's prediction |
| `/api/predictions/week` | 7-day rolling view |

## WHOOP Webhooks (recommended)

Sleep and recovery refresh automatically when WHOOP sends webhook events — no manual sync needed after setup.

1. Deploy the app (Vercel or any HTTPS host).
2. In the [WHOOP Developer Dashboard](https://developer.whoop.com/), open your app → **Webhooks**.
3. Add webhook URL: `https://<your-domain>/api/webhooks/whoop`
4. Set **Model Version** to **v2** (UUID IDs, required for this app).
5. Ensure `WHOOP_CLIENT_SECRET` matches the app secret (used for signature validation).

When you wake up or edit a sleep, WHOOP sends `sleep.updated` and `recovery.updated`. The app validates the signature, fetches the full sleep/recovery from the v2 API, upserts your record, and recomputes today's prediction. Workout webhooks are acknowledged but ignored.

**Testing:** Edit a past sleep start/end by 1 minute in the WHOOP app — you should receive both sleep and recovery webhooks ([WHOOP docs](https://developer.whoop.com/docs/developing/webhooks/)).

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET` | OAuth + webhook signature validation |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Auth session |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase client |
| `SUPABASE_SECRET_KEY` | Server writes (sync, webhooks) |
| `CRON_SECRET` | Protects cron routes (`/api/sync/whoop`, `/api/webhooks/whoop/reconcile`) |
| `APP_USER_ID` | Optional single-user mode for HUD without login |

## Deployment

Deploy to Vercel. Set `CRON_SECRET` in project env vars (Vercel sends it as `Authorization: Bearer …` on cron invocations).

- **Every 15 min:** retry pending/failed webhook events
- **Daily 6am UTC:** full 30-day sleep reconciliation sync

## Architecture

```
WHOOP webhooks (sleep/recovery) ──► /api/webhooks/whoop
        │ validate signature, dedupe trace_id
        │ fetch v2 sleep + recovery API
        ▼
WHOOP API (daily cron fallback) ──► Sync Layer ──► Supabase Postgres
                              ↓
                    Prediction Engine (lib/circadian)
                              ↓
                    Next.js API Routes → UI Layer
```
