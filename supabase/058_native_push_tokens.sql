-- Native push tokens (APNs on iOS, FCM on Android) -- the counterpart to
-- 007_push_subscriptions.sql's Web Push subscriptions, for the Capacitor
-- native wrapper. A device only ever has one live token per (profile,
-- device), but a profile can have several (multiple devices, or both
-- platforms) -- so this is its own table, one row per registered device,
-- rather than a column on profiles.
--
-- Sending to these still needs the actual APNs/FCM plumbing wired into
-- send-push and send-camp-pin-push (see supabase/README.md) -- this
-- migration is just the storage side.

create table if not exists native_push_tokens (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table native_push_tokens enable row level security;

create policy "users manage their own native push tokens"
  on native_push_tokens for all
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());
