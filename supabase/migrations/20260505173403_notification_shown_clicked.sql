-- Per-notification engagement counters.
-- Populated by the service worker via the public /events endpoint:
--   shown   — push received and Notification.show() invoked successfully
--   clicked — user clicked the notification, opening the URL
alter table public.notifications add column shown integer not null default 0;
alter table public.notifications add column clicked integer not null default 0;
