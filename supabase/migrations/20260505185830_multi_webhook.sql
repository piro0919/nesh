-- Allow multiple webhook endpoints per project, with a human-friendly name
-- and a per-attempt delivery history table.

-- Drop the previous "one webhook per project" constraint.
alter table public.webhooks drop constraint webhooks_project_id_key;

-- Add a label so users can tell endpoints apart in the UI.
alter table public.webhooks add column name text;

-- Per-attempt delivery log. Used to render recent deliveries in the dashboard
-- and (eventually) drive retries. Cascade with the webhook so deletion cleans up.
create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  event_type text not null,
  status_code integer,
  error text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index webhook_deliveries_webhook_created_idx
  on public.webhook_deliveries(webhook_id, created_at desc);

alter table public.webhook_deliveries enable row level security;

create policy "webhook_deliveries: owner select" on public.webhook_deliveries for select
  using (exists (
    select 1 from public.webhooks w
    join public.projects p on p.id = w.project_id
    where w.id = webhook_deliveries.webhook_id and p.user_id = auth.uid()
  ));
-- Inserts are done via service role from the server; no RLS insert policy needed
-- because RLS is enabled and service role bypasses it.
