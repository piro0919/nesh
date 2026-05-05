-- Lightweight server-side error log. Written by the admin client only —
-- no RLS policy is granted to anon/authenticated, so reads must go
-- through server components (which use the service role).
create table public.error_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  context text not null,
  message text not null,
  stack text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.error_logs enable row level security;

-- Newest-first lookup per project for the dashboard "Recent errors" card.
create index error_logs_project_created_idx
  on public.error_logs(project_id, created_at desc);

-- Cleanup index for retention.
create index error_logs_created_idx
  on public.error_logs(created_at);
