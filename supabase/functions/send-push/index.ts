// Deploys via the Supabase Dashboard (Edge Functions -> deploy from the
// browser editor) rather than the CLI. Triggered by a Database Webhook on
// INSERT to dm_messages — see supabase/README.md for the wiring steps.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase
// for every edge function. VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY /
// VAPID_SUBJECT are NOT auto-injected — set them as function secrets.
//
// Native push (APNs/FCM, for the Capacitor-wrapped app) needs its own set
// of secrets -- APNS_TEAM_ID / APNS_KEY_ID / APNS_PRIVATE_KEY (and
// FCM_PROJECT_ID / FCM_CLIENT_EMAIL / FCM_PRIVATE_KEY for Android) --
// none of which exist until there's a real Apple Developer account (APNs
// auth key) and Firebase project (FCM service account) to generate them
// from. Until those secrets are set, getApnsJwt/getFcmAccessToken below
// just throw, which the per-token try/catch already handles as a no-op --
// this whole native path is inert (native_push_tokens is empty until a
// real native build exists to register one anyway) but ready to work the
// moment both are set up, with zero code changes needed then.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { SignJWT, importPKCS8 } from "npm:jose@5";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const supabase = createClient(supabaseUrl, serviceRoleKey);

// ---------------------------------------------------------------------
// Native push (APNs + FCM) -- see supabase/README.md for what each secret
// is and how to get it. Both token caches are module-level so a warm
// function instance (Supabase keeps these alive between invocations,
// same reason the webpush.setVapidDetails call above only runs once)
// reuses one signed token across many sends instead of re-signing per
// notification.
// ---------------------------------------------------------------------

const apnsTeamId = Deno.env.get("APNS_TEAM_ID");
const apnsKeyId = Deno.env.get("APNS_KEY_ID");
const apnsPrivateKey = Deno.env.get("APNS_PRIVATE_KEY"); // the .p8 auth key's contents, as-is (PEM)
const apnsBundleId = Deno.env.get("APNS_BUNDLE_ID") || "io.prismfest.app";
const apnsHost = (Deno.env.get("APNS_ENV") || "production") === "sandbox"
  ? "https://api.sandbox.push.apple.com"
  : "https://api.push.apple.com";

let cachedApnsJwt: { token: string; exp: number } | null = null;
async function getApnsJwt() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedApnsJwt && cachedApnsJwt.exp - now > 300) return cachedApnsJwt.token;
  if (!apnsTeamId || !apnsKeyId || !apnsPrivateKey) throw new Error("APNs secrets not configured");
  const key = await importPKCS8(apnsPrivateKey, "ES256");
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: apnsKeyId })
    .setIssuer(apnsTeamId)
    .setIssuedAt(now)
    .sign(key);
  cachedApnsJwt = { token, exp: now + 3000 }; // APNs accepts tokens up to 1hr old; refresh a bit early
  return token;
}

async function sendApns(deviceToken: string, title: string, body: string, meta: Record<string, unknown>) {
  const jwt = await getApnsJwt();
  return fetch(`${apnsHost}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": apnsBundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
    },
    body: JSON.stringify({ aps: { alert: { title, body }, sound: "default" }, ...meta }),
  });
}

const fcmProjectId = Deno.env.get("FCM_PROJECT_ID");
const fcmClientEmail = Deno.env.get("FCM_CLIENT_EMAIL");
const fcmPrivateKey = Deno.env.get("FCM_PRIVATE_KEY"); // service account's private key, PEM

let cachedFcmToken: { token: string; exp: number } | null = null;
async function getFcmAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedFcmToken && cachedFcmToken.exp - now > 300) return cachedFcmToken.token;
  if (!fcmProjectId || !fcmClientEmail || !fcmPrivateKey) throw new Error("FCM secrets not configured");
  const key = await importPKCS8(fcmPrivateKey, "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(fcmClientEmail)
    .setSubject(fcmClientEmail)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`FCM token exchange failed: ${JSON.stringify(json)}`);
  cachedFcmToken = { token: json.access_token, exp: now + json.expires_in };
  return cachedFcmToken.token;
}

// Android's the one platform that actually renders a real image in the
// notification itself (expands to a "big picture" style) -- iOS needs a
// Notification Service Extension (real native code, a separate Xcode
// target) to attach one at all, so that side stays plain title/body
// until that's built. Reusing the existing public PWA icon rather than
// a bespoke banner asset -- already deployed, already on-brand, no new
// design work needed for what's otherwise just a config field.
const fcmImageUrl = "https://prismfest.io/icons/icon-512.png";

async function sendFcm(deviceToken: string, title: string, body: string, meta: Record<string, string>) {
  const accessToken = await getFcmAccessToken();
  return fetch(`https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`, {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ message: { token: deviceToken, notification: { title, body, image: fcmImageUrl }, data: meta } }),
  });
}

// Fans a notification out to every recipient's registered native devices
// (both platforms, however many devices each has), cleaning up any token
// the platform reports as invalid/expired along the way. Silently a
// no-op for a profile with no native_push_tokens rows -- e.g. everyone
// today, since no native build exists yet to register one.
async function sendNativePush(recipientIds: string[], title: string, body: string, meta: Record<string, unknown>) {
  const { data: tokens, error } = await supabase.from("native_push_tokens").select("*").in("profile_id", recipientIds);
  if (error) console.log("native_push_tokens query error", error);
  if (!tokens || tokens.length === 0) return;

  const stringMeta: Record<string, string> = {};
  for (const [k, v] of Object.entries(meta)) stringMeta[k] = String(v);

  await Promise.all(
    tokens.map(async (t) => {
      try {
        const res = t.platform === "ios"
          ? await sendApns(t.token, title, body, meta)
          : await sendFcm(t.token, title, body, stringMeta);
        if (!res.ok) {
          const detail = await res.text();
          console.log("native push failed", t.platform, res.status, detail);
          // Invalid/expired token, on either platform's equivalent status.
          if (res.status === 400 || res.status === 404 || res.status === 410) {
            await supabase.from("native_push_tokens").delete().eq("id", t.id);
          }
        } else {
          console.log("native push sent ok", t.platform, t.id);
        }
      } catch (err) {
        // Expected/no-op until APNS_*/FCM_* secrets are actually set.
        console.log("native push error (secrets likely not configured yet)", t.platform, String(err));
      }
    })
  );
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;
    if (!record) {
      console.log("no record in payload", JSON.stringify(payload));
      return new Response("no record", { status: 200 });
    }

    const { thread_id, sender_id, text } = record;
    console.log("dm_messages insert", { thread_id, sender_id, text });

    const [{ data: participants, error: participantsError }, { data: sender }] = await Promise.all([
      supabase.from("dm_participants").select("profile_id").eq("thread_id", thread_id).neq("profile_id", sender_id),
      supabase.from("profiles").select("name").eq("id", sender_id).single(),
    ]);

    if (participantsError) console.log("participants query error", participantsError);
    const recipientIds = (participants ?? []).map((p) => p.profile_id);
    console.log("recipientIds", recipientIds);
    if (recipientIds.length === 0) return new Response("no recipients", { status: 200 });

    const { data: subs, error: subsError } = await supabase.from("push_subscriptions").select("*").in("profile_id", recipientIds);
    if (subsError) console.log("subs query error", subsError);
    console.log("subscriptions found", subs?.length ?? 0);

    const title = sender?.name ? `New message from ${sender.name}` : "New message";
    const meta = { type: "dm", threadId: thread_id };
    const body = JSON.stringify({ title, body: text, meta });

    await Promise.all([
      Promise.all(
        (subs ?? []).map(async (sub) => {
          try {
            await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, body);
            console.log("push sent ok to subscription", sub.id);
          } catch (err) {
            console.log("push send failed for subscription", sub.id, err?.statusCode, err?.body ?? String(err));
            // Dead subscription (uninstalled, permission revoked, etc.) —
            // clean it up so future sends don't keep failing on it.
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        })
      ),
      sendNativePush(recipientIds, title, text, meta),
    ]);

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.log("top-level error", String(err));
    return new Response(String(err), { status: 500 });
  }
});
