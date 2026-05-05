-- Webhook delivery retry support.
-- attempts        — number of attempts so far (starts at 1)
-- next_attempt_at — when the cron should retry; NULL means "terminal"
--                   (succeeded, or exceeded max attempts, or non-retryable error)
alter table public.webhook_deliveries
  add column attempts integer not null default 1,
  add column next_attempt_at timestamptz;

-- Cron lookup: pending retries due now.
create index webhook_deliveries_next_attempt_idx
  on public.webhook_deliveries(next_attempt_at)
  where next_attempt_at is not null;
