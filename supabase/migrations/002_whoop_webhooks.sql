-- WHOOP webhook integration: user mapping + event deduplication

alter table user_integrations
  add column if not exists whoop_user_id bigint;

create unique index if not exists user_integrations_whoop_user_id_idx
  on user_integrations (whoop_user_id)
  where whoop_user_id is not null;

-- webhook_events: idempotency via trace_id + async processing queue
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
