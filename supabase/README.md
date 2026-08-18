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
