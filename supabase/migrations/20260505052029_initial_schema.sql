-- projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  vapid_public_key text not null,
  vapid_private_key text not null,
  vapid_subject text not null,
  created_at timestamptz not null default now()
);
create index projects_user_id_idx on public.projects(user_id);

-- subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (project_id, endpoint)
);
create index subscriptions_project_id_idx on public.subscriptions(project_id);
create index subscriptions_endpoint_idx on public.subscriptions(endpoint);

-- notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  body text not null,
  url text,
  scheduled_at timestamptz,
  status text not null default 'pending' check (status in ('pending', 'sent')),
  created_at timestamptz not null default now()
);
create index notifications_dispatch_idx
  on public.notifications(project_id, status, scheduled_at);

-- RLS
alter table public.projects enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

-- projects: owner only
create policy "projects_owner_select" on public.projects
  for select using (user_id = auth.uid());
create policy "projects_owner_insert" on public.projects
  for insert with check (user_id = auth.uid());
create policy "projects_owner_update" on public.projects
  for update using (user_id = auth.uid());
create policy "projects_owner_delete" on public.projects
  for delete using (user_id = auth.uid());

-- subscriptions: owner of parent project
create policy "subscriptions_owner_select" on public.subscriptions
  for select using (
    exists (select 1 from public.projects p
            where p.id = subscriptions.project_id and p.user_id = auth.uid())
  );
create policy "subscriptions_owner_delete" on public.subscriptions
  for delete using (
    exists (select 1 from public.projects p
            where p.id = subscriptions.project_id and p.user_id = auth.uid())
  );
-- subscriptions の INSERT は anon にも許可(SDK が直接叩く)
-- projectId 存在検証はサーバーハンドラ側で行うため、RLS 上は無条件 allow
create policy "subscriptions_public_insert" on public.subscriptions
  for insert with check (true);

-- notifications: owner of parent project
create policy "notifications_owner_all" on public.notifications
  for all using (
    exists (select 1 from public.projects p
            where p.id = notifications.project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p
            where p.id = notifications.project_id and p.user_id = auth.uid())
  );
