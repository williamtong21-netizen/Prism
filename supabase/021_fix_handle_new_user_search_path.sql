-- Security Advisor flagged handle_new_user() (schema.sql) as the one
-- SECURITY DEFINER function in the project missing `set search_path`.
-- Every function added since (is_blocked, shares_crew_with, etc.) already
-- pins it -- this just brings the original signup trigger in line.
--
-- Why it matters: without a pinned search_path, a SECURITY DEFINER
-- function resolves unqualified names (or ones outside its own explicit
-- schema-qualification) using the *caller's* search_path, not a fixed one
-- -- letting a caller who can create objects in a schema ahead of `public`
-- shadow what the function actually operates on. This function already
-- schema-qualifies public.profiles, so it wasn't currently exploitable,
-- but leaving search_path unset is the kind of gap that becomes one the
-- next time this function is edited by someone who doesn't re-add the
-- qualification.
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, handle, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'handle', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'name', 'New user')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;
