-- Real, persisted, crew-visible camp pins — replaces the local-only
-- "myPin" state the Map tab used to have, which never left the browser
-- it was set in. One pin per (profile, festival); visible to yourself
-- always, and to anyone you share a crew with *for that festival*.

create table if not exists camp_pins (
  profile_id uuid not null references profiles(id) on delete cascade,
  festival_id text not null,
  x numeric not null,
  y numeric not null,
  note text,
  updated_at timestamptz not null default now(),
  primary key (profile_id, festival_id)
);

alter table camp_pins enable row level security;

-- Same shape as is_crew_member()/is_dm_participant() (005) — a
-- SECURITY DEFINER function so the RLS policy that calls it isn't
-- itself vulnerable to the self-referential-recursion bug those fixed.
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
      and c.festival_id = check_festival_id
  );
$$;

drop policy if exists "you can read your own pin" on camp_pins;
create policy "you can read your own pin"
  on camp_pins for select
  using (profile_id = auth.uid());

drop policy if exists "crew members can read each other's pins" on camp_pins;
create policy "crew members can read each other's pins"
  on camp_pins for select
  using (shares_crew_with(profile_id, festival_id));

drop policy if exists "you manage your own pin" on camp_pins;
create policy "you manage your own pin"
  on camp_pins for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

alter publication supabase_realtime add table camp_pins;
