-- "Attending" is a distinct, stable signal from `currentFestival` (which
-- just tracks whatever you're currently browsing/last tapped into, and
-- changes every time you peek at a different festival's schedule). This
-- table lets someone mark several real festivals as ones they're actually
-- going to, so the Home countdown can be based on that set instead of
-- silently drifting whenever they browse something else out of curiosity.

create table if not exists attending_festivals (
  profile_id uuid not null references profiles(id) on delete cascade,
  festival_id text not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, festival_id)
);

alter table attending_festivals enable row level security;

drop policy if exists "you can read your own attending festivals" on attending_festivals;
create policy "you can read your own attending festivals"
  on attending_festivals for select
  using (profile_id = auth.uid());

drop policy if exists "you manage your own attending festivals" on attending_festivals;
create policy "you manage your own attending festivals"
  on attending_festivals for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
