-- Manually-built schedules: which specific sets someone has decided they
-- want to see, independent of the algorithmic match score (SETS.match).
-- Crew-scoped read access reuses shares_crew_with() (011_camp_pins.sql) so
-- "who else in my crew is planning to be at this set" works the same way
-- camp pins already do -- per-festival, not global.

create table if not exists schedule_picks (
  profile_id uuid not null references profiles(id) on delete cascade,
  festival_id text not null,
  set_id integer not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, festival_id, set_id)
);

alter table schedule_picks enable row level security;

drop policy if exists "you can read your own picks" on schedule_picks;
create policy "you can read your own picks"
  on schedule_picks for select
  using (profile_id = auth.uid());

drop policy if exists "crew members can read each other's picks" on schedule_picks;
create policy "crew members can read each other's picks"
  on schedule_picks for select
  using (shares_crew_with(profile_id, festival_id));

drop policy if exists "you manage your own picks" on schedule_picks;
create policy "you manage your own picks"
  on schedule_picks for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

alter publication supabase_realtime add table schedule_picks;
