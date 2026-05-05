create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  primary key (key, window_start)
);
create index rate_limits_window_idx on public.rate_limits(window_start);

-- service-role only; RLS enabled with no policies blocks anon access
alter table public.rate_limits enable row level security;

-- Atomically increment a fixed-window counter and return the new value
create or replace function public.increment_rate_limit(p_key text, p_window_start timestamptz)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, p_window_start, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into new_count;
  return new_count;
end;
$$;
