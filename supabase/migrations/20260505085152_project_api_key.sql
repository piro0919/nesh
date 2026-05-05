-- Per-project API key for authenticated server-to-server send (REST API).
-- Format: 'nesh_sk_' + 32 url-safe base64 chars (~24 random bytes).
alter table public.projects add column api_key text;

update public.projects
set api_key = 'nesh_sk_' || translate(encode(gen_random_bytes(24), 'base64'), '+/=', '-_')
where api_key is null;

alter table public.projects alter column api_key set not null;
create unique index projects_api_key_unique on public.projects(api_key);
