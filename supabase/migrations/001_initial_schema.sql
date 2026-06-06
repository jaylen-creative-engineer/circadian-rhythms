-- sleep_records: raw WHOOP sleep payloads
create table if not exists sleep_records (
  id                   uuid primary key default gen_random_uuid(),
  whoop_id             text unique,
  user_id              uuid not null references auth.users(id) on delete cascade,
  start_time           timestamptz not null,
  end_time             timestamptz not null,
  hrv_rmssd            float,
  resting_hr           float,
  sleep_performance    int,
  rem_pct              float,
  deep_pct             float,
  light_pct            float,
  raw_payload          jsonb,
  synced_at            timestamptz default now()
);

create index if not exists sleep_records_user_id_idx on sleep_records(user_id);
create index if not exists sleep_records_end_time_idx on sleep_records(end_time desc);

-- energy_cycles: computed circadian predictions per day
create table if not exists energy_cycles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  date                 date not null,
  prediction           jsonb not null,
  created_at           timestamptz default now(),
  unique(user_id, date)
);

create index if not exists energy_cycles_user_date_idx on energy_cycles(user_id, date desc);

-- user_integrations: OAuth tokens for WHOOP
create table if not exists user_integrations (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  provider             text not null,
  access_token         text not null,
  refresh_token        text not null,
  expires_at           timestamptz not null,
  unique(user_id, provider)
);

-- user_calibration: personal tuning knobs
create table if not exists user_calibration (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade unique,
  peak_offset_min          int not null default 0,
  melatonin_sensitivity_min int not null default 0,
  updated_at               timestamptz default now()
);

-- RLS
alter table sleep_records enable row level security;
alter table energy_cycles enable row level security;
alter table user_integrations enable row level security;
alter table user_calibration enable row level security;

create policy "Users read own sleep records"
  on sleep_records for select
  using (auth.uid() = user_id);

create policy "Users read own energy cycles"
  on energy_cycles for select
  using (auth.uid() = user_id);

create policy "Users read own integrations"
  on user_integrations for select
  using (auth.uid() = user_id);

create policy "Users manage own calibration"
  on user_calibration for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
