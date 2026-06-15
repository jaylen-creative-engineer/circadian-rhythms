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
| `/api/sync/whoop` | Manual + cron sync (Bearer CRON_SECRET) |
| `/api/predictions/today` | Today's prediction |
| `/api/predictions/week` | 7-day rolling view |

## Environment Variables

See `.env.example` for the full list.

## Deployment

Deploy to Vercel. Cron sync runs daily at 6am UTC via `vercel.json`.

## Architecture

```
WHOOP API → Sync Layer → Supabase Postgres
                              ↓
                    Prediction Engine (lib/circadian)
                              ↓
                    Next.js API Routes → UI Layer
```
