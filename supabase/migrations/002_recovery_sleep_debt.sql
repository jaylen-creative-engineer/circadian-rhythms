-- Recovery score and sleep debt from WHOOP sync
alter table sleep_records
  add column if not exists recovery_score int,
  add column if not exists sleep_debt_millis bigint,
  add column if not exists sleep_need_baseline_millis bigint;
