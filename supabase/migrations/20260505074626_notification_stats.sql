-- Per-notification delivery counters populated after send.
alter table public.notifications
  add column delivered integer not null default 0,
  add column removed integer not null default 0,
  add column failed integer not null default 0;
