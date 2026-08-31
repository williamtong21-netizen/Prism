# Supabase setup

Migrations in this folder are numbered and meant to be run in order, once
each, by pasting into the Supabase SQL Editor (Project -> SQL Editor -> New
query -> paste -> Run). There's no CLI/migration-runner wired up — this is
a small project, so manual-but-tracked is good enough for now.

## Push notifications

Three manual steps beyond running `007_push_subscriptions.sql`, all in the
Supabase dashboard:

1. **Deploy the Edge Function.** Edge Functions -> deploy a new function
   named `send-push`, paste in `functions/send-push/index.ts`.
2. **Set its secrets.** Edge Functions -> `send-push` -> Secrets:
   - `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — generate a pair with
     `npx web-push generate-vapid-keys`. The public key also goes in the
     app's `VITE_VAPID_PUBLIC_KEY` env var (Vercel + `.env.local`); the
     private key goes *only* here, never in client code or committed
     anywhere.
   - `VAPID_SUBJECT` (optional) — a `mailto:` address or URL identifying
     the app to push services. Defaults to a placeholder if unset.

   (`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` don't need setting —
   every edge function gets those automatically.)
3. **Wire the trigger.** Database -> Webhooks -> create one on
   `dm_messages`, event `INSERT`, target the `send-push` function. That's
   what actually fires a push every time a DM is sent.

## Camp pin crew alerts

Two manual steps beyond running `057_camp_pin_crew_alerts.sql` (needs push
notifications, above, already set up -- reuses its VAPID secrets):

1. **Deploy the Edge Function.** Edge Functions -> deploy a new function
   named `send-camp-pin-push`, paste in
   `functions/send-camp-pin-push/index.ts`. No new secrets to set.
2. **Wire the trigger.** Database -> Webhooks -> create one on
   `camp_pins`, event `INSERT` only (not update/delete — moving an
   existing pin shouldn't re-alert the crew), target the
   `send-camp-pin-push` function.

## Spotify connect

Two manual steps beyond running `015_spotify_connections.sql`, both in the
Supabase dashboard:

1. **Deploy the Edge Function.** Edge Functions -> deploy a new function
   named `spotify-callback`, paste in `functions/spotify-callback/index.ts`.
2. **Set its secrets.** Edge Functions -> `spotify-callback` -> Secrets:
   - `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — from the app registered
     at developer.spotify.com/dashboard. The redirect URI there must be
     exactly `https://prismfest.io/auth/spotify/callback`.

   (`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` don't need setting --
   every edge function gets those automatically.)

Spotify's Development Mode caps new apps at 5 authorized users total until
Extended Quota Mode is granted -- see the Feb 2026 developer policy update.

## Artist photos (lineup profile sheet)

One manual step, no migration needed:

1. **Deploy the Edge Function.** Edge Functions -> deploy a new function
   named `spotify-artist-search`, paste in
   `functions/spotify-artist-search/index.ts`.

   Reuses the same `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` secrets
   as `spotify-callback` above (Supabase function secrets are
   project-wide, not per-function -- no need to set them again if
   Spotify connect is already deployed). Uses the Client Credentials
   flow (app-level, no user token) so it works for every set, not just
   signed-in users who've personally connected Spotify.

## Account deletion

One manual step, no migration needed (every per-user table already
cascades from `profiles`, which cascades from `auth.users`):

1. **Deploy the Edge Function.** Edge Functions -> deploy a new function
   named `delete-account`, paste in `functions/delete-account/index.ts`.

   No secrets to set -- it only needs the auto-injected `SUPABASE_URL` /
   `SUPABASE_SERVICE_ROLE_KEY`, same as the other functions.
