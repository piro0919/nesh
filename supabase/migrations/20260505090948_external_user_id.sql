-- Optional external user identifier per subscription.
-- Lets project owners send notifications targeted at their own users
-- (e.g. by app user id) rather than only by raw push endpoint.
alter table public.subscriptions add column external_user_id text;

-- Index for fast lookup when sending to a set of user ids within a project.
create index subscriptions_project_user_idx
  on public.subscriptions(project_id, external_user_id)
  where external_user_id is not null;


