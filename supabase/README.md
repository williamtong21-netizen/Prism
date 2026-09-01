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

## Native push (APNs / FCM)

Web Push (above) only reaches the browser/installed-PWA — Capacitor's
WebView has no Web Push API at all, so the native iOS/Android app needs
its own delivery path. `useNativePushSubscription.js` and
`native_push_tokens` (`058_native_push_tokens.sql`) handle the client and
storage side already; `send-push` and `send-camp-pin-push` already have
the APNs/FCM sending code (reusing the exact same triggers/webhooks as
Web Push, just fanning out to native tokens too) — **none of it can
actually send anything until the steps below exist**, which need a real
Apple Developer account and a real Firebase project, neither of which
exist yet.

**iOS (APNs) — needs the Apple Developer account:**
1. **Generate an APNs Auth Key.** developer.apple.com -> Certificates,
   Identifiers & Profiles -> Keys -> new key with the "Apple Push
   Notifications service (APNs)" capability checked. Downloads once as a
   `.p8` file — save it somewhere safe, Apple won't let you re-download it.
   Note the **Key ID** (shown on the key's page) and your **Team ID**
   (top-right of the developer portal, or Membership page).
2. **Set function secrets** (Edge Functions -> `send-push` -> Secrets —
   same project-wide secrets store `send-camp-pin-push` already reads
   from, no need to set twice):
   - `APNS_TEAM_ID` — your Apple Developer Team ID.
   - `APNS_KEY_ID` — the Key ID from step 1.
   - `APNS_PRIVATE_KEY` — the full contents of the `.p8` file, pasted as-is
     (including the `-----BEGIN/END PRIVATE KEY-----` lines).
   - `APNS_BUNDLE_ID` (optional) — defaults to `io.prismfest.app` if unset,
     which is already correct; only set this if that ever changes.
   - `APNS_ENV` (optional) — `sandbox` for a debug/development build
     signed with a development provisioning profile, unset/`production`
     for a TestFlight or App Store build. Sending with the wrong one is
     the #1 reason a real device gets nothing.
3. **Add the capability in Xcode.** `ios/App/App.xcworkspace` ->
   select the App target -> Signing & Capabilities -> "+ Capability" ->
   "Push Notifications". This edits the project's code-signing
   entitlements and needs an actual Team selected in Xcode to do, so it
   can't be done from a text editor the way everything else here can —
   it's a real, separate step once you're at the Mac.

**Android (FCM) — needs a Firebase project:**
1. **Create a Firebase project** (or reuse one) at
   console.firebase.google.com, add an Android app to it with package
   name `io.prismfest.app`, and download the generated
   `google-services.json` into `android/app/google-services.json` (that
   exact path/filename — the Android Gradle build looks for it there).
2. **Add the Google Services Gradle plugin** — `android/build.gradle`
   needs `classpath 'com.google.gms:google-services:4.4.2'` (or current)
   in its `buildscript.dependencies`, and `android/app/build.gradle`
   needs `apply plugin: 'com.google.gms.google-services'` at the bottom.
   Skipped here deliberately: adding this now, with no
   `google-services.json` present yet, would just break the Android
   build for no benefit — add both together once the file above exists.
3. **Create a service account** for server-side sending: Firebase console
   -> Project settings -> Service accounts -> "Generate new private key"
   — downloads a JSON file with `client_email` and `private_key` fields.
4. **Set function secrets** (same project-wide store as above):
   - `FCM_PROJECT_ID` — the Firebase project's ID (Project settings ->
     General).
   - `FCM_CLIENT_EMAIL` — the service account JSON's `client_email`.
   - `FCM_PRIVATE_KEY` — the service account JSON's `private_key`, pasted
     as-is (it's already PEM-formatted with escaped `\n`s in the JSON —
     Supabase's secret editor handles the real newlines fine either way).

Until all of the above exists, `native_push_tokens` stays empty anyway
(no native build exists yet to register a device token into it), so
none of this is reachable in practice — it's ready to work the moment
both platforms' setup is done, with no further code changes.

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
