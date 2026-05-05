-- Visual assets carried in the push payload and consumed by the SDK's
-- default Service Worker handler (next-push >= 0.4):
--   icon  — small image shown alongside the notification
--   image — large image rendered in the body (Android, some desktop)
--   badge — monochrome icon shown in the system tray (Android)
-- Project-level defaults are stored on `projects` and applied if a
-- per-notification value is null.
alter table public.notifications add column icon text;
alter table public.notifications add column image text;
alter table public.notifications add column badge text;

alter table public.projects add column default_icon text;
alter table public.projects add column default_badge text;
