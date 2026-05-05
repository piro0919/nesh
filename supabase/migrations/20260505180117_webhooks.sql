-- One webhook endpoint per project. Fires on `notification.sent` with an
-- HMAC-SHA256 signature in the `X-Nesh-Signature` header (`sha256=<hex>`).
-- Schema is multi-event-ready (events column reserved for future use).
create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.projects(id) on delete cascade,
  url text not null,
  secret text not null,
  enabled boolean not null default true,
  last_delivery_at timestamptz,
  last_delivery_status integer,
  last_delivery_error text,
  created_at timestamptz not null default now()
);

alter table public.webhooks enable row level security;

create policy "webhooks: owner select" on public.webhooks for select
  using (exists (select 1 from public.projects p where p.id = webhooks.project_id and p.user_id = auth.uid()));
create policy "webhooks: owner insert" on public.webhooks for insert
  with check (exists (select 1 from public.projects p where p.id = webhooks.project_id and p.user_id = auth.uid()));
create policy "webhooks: owner update" on public.webhooks for update
  using (exists (select 1 from public.projects p where p.id = webhooks.project_id and p.user_id = auth.uid()));
create policy "webhooks: owner delete" on public.webhooks for delete
  using (exists (select 1 from public.projects p where p.id = webhooks.project_id and p.user_id = auth.uid()));
