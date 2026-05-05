-- Atomically increment notifications.shown or .clicked, scoped by project_id
-- to reject cross-project tampering.
create or replace function public.increment_notification_event(
  p_notification_id uuid,
  p_project_id uuid,
  p_column text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_column = 'shown' then
    update public.notifications
    set shown = shown + 1
    where id = p_notification_id and project_id = p_project_id;
  elsif p_column = 'clicked' then
    update public.notifications
    set clicked = clicked + 1
    where id = p_notification_id and project_id = p_project_id;
  else
    raise exception 'Invalid column: %', p_column;
  end if;
end;
$$;
