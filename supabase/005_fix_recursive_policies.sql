-- "infinite recursion detected in policy for relation X" happens whenever
-- a table's own RLS policy subqueries that same table — Postgres has to
-- re-apply the policy to evaluate the subquery, forever. Both
-- crew_members and dm_participants had this exact pattern (a self-join
-- inside their own SELECT policy). Fix: route the membership check
-- through a SECURITY DEFINER function, which runs with the function
-- owner's privileges (bypassing RLS) instead of re-triggering the policy.

create or replace function public.is_crew_member(check_crew_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from crew_members
    where crew_id = check_crew_id and profile_id = auth.uid()
  );
$$;

create or replace function public.is_dm_participant(check_thread_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from dm_participants
    where thread_id = check_thread_id and profile_id = auth.uid()
  );
$$;

-- crew_members: the actual self-referential policy
drop policy if exists "crew members can read the roster" on crew_members;
create policy "crew members can read the roster"
  on crew_members for select
  using (is_crew_member(crew_id));

-- crews: these queried crew_members, which tripped the recursion above
-- even though crews itself isn't self-referential
drop policy if exists "crew members can read their crews" on crews;
create policy "crew members can read their crews"
  on crews for select
  using (is_crew_member(id));

drop policy if exists "crew members can update their crew" on crews;
create policy "crew members can update their crew"
  on crews for update
  using (is_crew_member(id));

-- dm_participants: identical self-referential bug, fixed pre-emptively
-- before DMs are wired up to the app
drop policy if exists "participants can read the participant list" on dm_participants;
create policy "participants can read the participant list"
  on dm_participants for select
  using (is_dm_participant(thread_id));

drop policy if exists "participants can read their threads" on dm_threads;
create policy "participants can read their threads"
  on dm_threads for select
  using (is_dm_participant(id));

drop policy if exists "participants can read messages in their threads" on dm_messages;
create policy "participants can read messages in their threads"
  on dm_messages for select
  using (is_dm_participant(thread_id));

drop policy if exists "participants can send messages in their threads" on dm_messages;
create policy "participants can send messages in their threads"
  on dm_messages for insert
  with check (sender_id = auth.uid() and is_dm_participant(thread_id));
