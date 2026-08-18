-- Starting a DM requires adding *two* people to dm_participants (you and
-- them), but the insert policy only lets you insert your own row
-- (profile_id = auth.uid()) — the same shape of problem crews had with
-- joining by code. A SECURITY DEFINER function does the two-row insert
-- atomically, bypassing that restriction in a controlled way instead of
-- loosening the policy for everyone.
create or replace function public.start_dm_thread(other_profile_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_thread_id uuid;
  new_thread_id uuid;
begin
  if other_profile_id = auth.uid() then
    raise exception 'cannot start a thread with yourself';
  end if;

  -- reuse an existing thread with this person rather than creating a
  -- duplicate every time you open their DM
  select dp.thread_id into existing_thread_id
  from dm_participants dp
  where dp.profile_id = other_profile_id
    and dp.thread_id in (select thread_id from dm_participants where profile_id = auth.uid());

  if existing_thread_id is not null then
    return existing_thread_id;
  end if;

  insert into dm_threads default values returning id into new_thread_id;
  insert into dm_participants (thread_id, profile_id)
    values (new_thread_id, auth.uid()), (new_thread_id, other_profile_id);

  return new_thread_id;
end;
$$;

grant execute on function public.start_dm_thread(uuid) to authenticated;
