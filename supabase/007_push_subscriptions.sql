-- Stores each device's Web Push subscription (the browser gives us this
-- after the user grants notification permission). One profile can have
-- several — e.g. phone home-screen app and a laptop browser both
-- subscribed — so a push fans out to every device they've enabled it on.
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "users manage their own push subscriptions"
  on push_subscriptions for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
