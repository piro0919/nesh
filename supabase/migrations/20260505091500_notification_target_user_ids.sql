-- Optional list of external_user_id values to target for a given notification.
-- NULL = broadcast (all subscribers in the project), the existing behaviour.
alter table public.notifications add column target_user_ids text[];
