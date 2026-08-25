-- Supabase stopped granting table privileges to anon/authenticated automatically
-- for new tables in the public schema (2026 default change), which left every
-- PostgREST call failing with 42501 "permission denied for table" even though the
-- RLS policies were correct. Restore the grants explicitly, per table, so the
-- schema no longer depends on the platform default.
--
-- RLS is enabled on all seven tables, so these grants do not widen row access:
-- error_logs and rate_limits deliberately carry no policy and stay service-role
-- only, and the rest are still filtered by their existing policies.

grant usage on schema public to anon, authenticated, service_role;

-- projects: owner-only select/insert/update/delete.
-- anon needs select as well: unauthenticated dashboard requests hit the query
-- before the redirect runs, and RLS returns zero rows for them.
grant select on public.projects to anon;
grant select, insert, update, delete on public.projects to authenticated;

-- subscriptions: owners read and delete, and the public subscribe endpoint inserts.
grant select, delete on public.subscriptions to authenticated;
grant insert on public.subscriptions to anon, authenticated;

-- notifications: owner-only, policy is "for all".
grant select, insert, update, delete on public.notifications to authenticated;

-- webhooks / webhook_deliveries: owner-only.
grant select, insert, update, delete on public.webhooks to authenticated;
grant select on public.webhook_deliveries to authenticated;

-- The service role bypasses RLS but still needs the table privilege.
grant select, insert, update, delete on
  public.projects,
  public.subscriptions,
  public.notifications,
  public.webhooks,
  public.webhook_deliveries,
  public.error_logs,
  public.rate_limits
to service_role;
