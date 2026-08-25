-- "Request data" in the festival picker previously only flipped local
-- React state (useState([])) -- nothing was saved, nothing sent anywhere,
-- and it reset on every reload. This table makes it real: one row per
-- (profile, festival) request, so the app owner can see what to prioritize
-- building next (`select festival_id, count(*) from festival_data_requests
-- group by festival_id order by count(*) desc` in the SQL Editor).

create table if not exists festival_data_requests (
  profile_id uuid not null references profiles(id) on delete cascade,
  festival_id text not null,
  created_at timestamptz not null default now(),
  primary key (profile_id, festival_id)
);

alter table festival_data_requests enable row level security;

drop policy if exists "you can read your own requests" on festival_data_requests;
create policy "you can read your own requests"
  on festival_data_requests for select
  using (profile_id = auth.uid());

drop policy if exists "you manage your own requests" on festival_data_requests;
create policy "you manage your own requests"
  on festival_data_requests for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
