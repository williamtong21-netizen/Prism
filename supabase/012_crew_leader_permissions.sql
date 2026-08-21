-- Crew leader permissions. "Leader" is just whoever created the crew
-- (crews.created_by already tracks this — no new column needed).

-- Persistent crews are now usable at any festival (see the app-side
-- festivalCrews filter), so pin-sharing needs to follow: a persistent
-- crew's members should see each other's camp pins at whatever festival
-- they're currently both using it for, not just the crew's original
-- festival_id.
create or replace function public.shares_crew_with(other_profile_id uuid, check_festival_id text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from crew_members mine
    join crew_members theirs on theirs.crew_id = mine.crew_id
    join crews c on c.id = mine.crew_id
    where mine.profile_id = auth.uid()
      and theirs.profile_id = other_profile_id
      and (c.persistent or c.festival_id = check_festival_id)
  );
$$;

-- Removing a member is leader-only. A SECURITY DEFINER function, same
-- shape as start_dm_thread — the existing crew_members RLS only lets a
-- user delete their *own* membership row, not someone else's, and that's
-- correct for everyone except the crew's leader.
create or replace function public.remove_crew_member(target_crew_id uuid, target_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from crews where id = target_crew_id and created_by = auth.uid()) then
    raise exception 'only the crew leader can remove a member';
  end if;
  if target_profile_id = auth.uid() then
    raise exception 'leader cannot remove themself this way — disband the crew instead';
  end if;
  delete from crew_members where crew_id = target_crew_id and profile_id = target_profile_id;
end;
$$;

grant execute on function public.remove_crew_member(uuid, uuid) to authenticated;

-- Disbanding deletes the crew outright (crew_members rows cascade via the
-- existing FK). Leader-only.
drop policy if exists "crew leader can disband their crew" on crews;
create policy "crew leader can disband their crew"
  on crews for delete
  using (created_by = auth.uid());
