-- Capture (truncated) response body so the delivery detail page can show
-- exactly what the receiver replied with. Limited to ~4KB at write time.
alter table public.webhook_deliveries
  add column response_body text;
