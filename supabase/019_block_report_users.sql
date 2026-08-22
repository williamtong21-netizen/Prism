-- Trust & safety: block a DM contact, and file a report. No moderation
-- admin UI exists yet -- user_reports is the record to build one against,
-- not wired to any automated action. Blocking is the part that actually
-- does something: it stops new messages in either direction once either
-- side has blocked the other.

create table if not exists blocked_users (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table blocked_users enable row level security;

drop policy if exists "you can see who you've blocked" on blocked_users;
create policy "you can see who you've blocked"
  on blocked_users for select
  using (blocker_id = auth.uid());

drop policy if exists "you can block someone" on blocked_users;
create policy "you can block someone"
  on blocked_users for insert
  with check (blocker_id = auth.uid());

drop policy if exists "you can unblock someone" on blocked_users;
create policy "you can unblock someone"
  on blocked_users for delete
  using (blocker_id = auth.uid());

create table if not exists user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  reported_id uuid not null references profiles(id) on delete cascade,
  reason text not null,
  details text,
  created_at timestamptz not null default now()
);

alter table user_reports enable row level security;

drop policy if exists "you can file a report" on user_reports;
create policy "you can file a report"
  on user_reports for insert
  with check (reporter_id = auth.uid());

drop policy if exists "you can see your own reports" on user_reports;
create policy "you can see your own reports"
  on user_reports for select
  using (reporter_id = auth.uid());

-- Same SECURITY DEFINER shape as shares_crew_with/shares_any_crew_with --
-- blocking is symmetric in effect (either direction stops messages), so
-- this checks both without needing the caller to know who blocked whom.
create or replace function public.is_blocked(other_profile_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from blocked_users
    where (blocker_id = auth.uid() and blocked_id = other_profile_id)
       or (blocker_id = other_profile_id and blocked_id = auth.uid())
  );
$$;

-- Tighten the existing send policy (005/schema.sql) so a blocked
-- relationship stops new messages in a thread, not just new threads.
drop policy if exists "participants can send messages in their threads" on dm_messages;
create policy "participants can send messages in their threads"
  on dm_messages for insert
  with check (
    sender_id = auth.uid()
    and thread_id in (select thread_id from dm_participants where profile_id = auth.uid())
    and not exists (
      select 1 from dm_participants other
      where other.thread_id = dm_messages.thread_id
        and other.profile_id != auth.uid()
        and is_blocked(other.profile_id)
    )
  );

-- Tighten start_dm_thread (006) the same way, so a blocked relationship
-- can't just start a fresh thread to route around the message-insert check.
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

  if is_blocked(other_profile_id) then
    raise exception 'cannot message this person';
  end if;

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
