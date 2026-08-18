-- Tracks whether a user has completed the name/handle onboarding step
-- after their first sign-in. The signup trigger has no way to ask for a
-- real name (magic-link auth collects nothing but an email), so it fills
-- in a placeholder and the app prompts for the real thing on first entry.
alter table profiles add column if not exists onboarded boolean not null default false;
