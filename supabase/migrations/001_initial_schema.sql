-- Consolidated schema for NextAuth + WHOOP (no Supabase Auth dependency).

create table if not exists app_users (
  id            uuid primary key,
  whoop_user_id bigint unique,
  display_name  text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists app_users_whoop_user_id_idx on app_users (whoop_user_id);

create table if not exists sleep_records (
  id                   uuid primary key default gen_random_uuid(),
  whoop_id             text unique,
  user_id              uuid not null references app_users(id) on delete cascade,
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

create table if not exists energy_cycles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references app_users(id) on delete cascade,
  date                 date not null,
  prediction           jsonb not null,
  created_at           timestamptz default now(),
  unique(user_id, date)
);

create index if not exists energy_cycles_user_date_idx on energy_cycles(user_id, date desc);

create table if not exists user_integrations (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references app_users(id) on delete cascade,
  provider             text not null,
  whoop_user_id        bigint,
  access_token         text not null,
  refresh_token        text not null,
  expires_at           timestamptz not null,
  unique(user_id, provider)
);

create unique index if not exists user_integrations_whoop_user_id_idx
  on user_integrations (whoop_user_id)
  where whoop_user_id is not null;

create table if not exists user_calibration (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references app_users(id) on delete cascade unique,
  peak_offset_min          int not null default 0,
  melatonin_sensitivity_min int not null default 0,
  updated_at               timestamptz default now()
);

create table if not exists webhook_events (
  id              uuid primary key default gen_random_uuid(),
  trace_id        text not null unique,
  event_type      text not null,
  whoop_user_id   bigint not null,
  resource_id     text not null,
  payload         jsonb not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'processing', 'processed', 'failed', 'skipped')),
  error_message   text,
  received_at     timestamptz not null default now(),
  processed_at    timestamptz
);

create index if not exists webhook_events_status_received_idx
  on webhook_events (status, received_at);

create index if not exists webhook_events_whoop_user_id_idx
  on webhook_events (whoop_user_id);

alter table app_users enable row level security;
alter table sleep_records enable row level security;
alter table energy_cycles enable row level security;
alter table user_integrations enable row level security;
alter table user_calibration enable row level security;
alter table webhook_events enable row level security;
