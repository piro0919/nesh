-- Speed up monthly notification count queries used by free-tier caps
create index notifications_project_created_at_idx
  on public.notifications(project_id, created_at);
