-- Prism schema — covers the parts of the app that are genuinely per-user or
-- multi-user (profile, crews, DMs, packing checklist, notifications).
-- Festival/lineup/artist content stays static in the app for now; it's
-- public reference data, not something a user account needs to own.
--
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

-- ---------------------------------------------------------------------------
-- profiles — one row per authenticated user, keyed to auth.users
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are readable by any signed-in user"
  on profiles for select
  using (auth.uid() is not null);

create policy "users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row right after signup so the app never has to
-- handle a signed-in user with no profile yet.
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
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- crews — scoped to one festival each, joined via invite code
-- ---------------------------------------------------------------------------
create table if not exists crews (
  id uuid primary key default gen_random_uuid(),
  festival_id text not null,
  name text not null,
  code text unique not null,
  persistent boolean not null default false,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists crew_members (
  crew_id uuid not null references crews(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (crew_id, profile_id)
);

alter table crews enable row level security;
alter table crew_members enable row level security;

create policy "crew members can read their crews"
  on crews for select
  using (
    id in (select crew_id from crew_members where profile_id = auth.uid())
  );

create policy "any signed-in user can create a crew"
  on crews for insert
  with check (auth.uid() = created_by);

create policy "crew members can read the roster"
  on crew_members for select
  using (
    crew_id in (select crew_id from crew_members where profile_id = auth.uid())
  );

create policy "users can join a crew (insert their own membership)"
  on crew_members for insert
  with check (profile_id = auth.uid());

create policy "users can leave a crew"
  on crew_members for delete
  using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- direct messages — thread + participants + messages
-- ---------------------------------------------------------------------------
create table if not exists dm_threads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists dm_participants (
  thread_id uuid not null references dm_threads(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  primary key (thread_id, profile_id)
);

create table if not exists dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references dm_threads(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

alter table dm_threads enable row level security;
alter table dm_participants enable row level security;
alter table dm_messages enable row level security;

create policy "participants can read their threads"
  on dm_threads for select
  using (
    id in (select thread_id from dm_participants where profile_id = auth.uid())
  );

create policy "signed-in users can start a thread"
  on dm_threads for insert
  with check (auth.uid() is not null);

create policy "participants can read the participant list"
  on dm_participants for select
  using (
    thread_id in (select thread_id from dm_participants where profile_id = auth.uid())
  );

create policy "users can add themselves to a thread they're starting"
  on dm_participants for insert
  with check (profile_id = auth.uid());

create policy "participants can read messages in their threads"
  on dm_messages for select
  using (
    thread_id in (select thread_id from dm_participants where profile_id = auth.uid())
  );

create policy "participants can send messages in their threads"
  on dm_messages for insert
  with check (
    sender_id = auth.uid()
    and thread_id in (select thread_id from dm_participants where profile_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- packing checklist — per-user, per-festival-day-essential item
-- ---------------------------------------------------------------------------
create table if not exists packing_state (
  profile_id uuid not null references profiles(id) on delete cascade,
  item_id text not null,
  checked boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (profile_id, item_id)
);

alter table packing_state enable row level security;

create policy "users manage their own packing state"
  on packing_state for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- notifications — per-user inbox
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  meta jsonb,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "users manage their own notifications"
  on notifications for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- realtime — turn on change broadcasts for the tables that need live updates
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table dm_messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table crew_members;
