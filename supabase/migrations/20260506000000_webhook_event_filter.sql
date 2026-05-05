-- Per-webhook event filter.
-- events = NULL  → receive every event type (backward compatible default)
-- events = []    → receive nothing (effectively disabled, but kept distinct from NULL)
-- events = ['notification.sent', ...] → receive only listed types
alter table public.webhooks
  add column events text[];
