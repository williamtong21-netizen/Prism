// Deploys via the Supabase Dashboard (Edge Functions -> deploy from the
// browser editor) rather than the CLI. Triggered by a Database Webhook on
// INSERT to camp_pins — see supabase/README.md for the wiring steps.
// Reuses the same VAPID_*/APNS_*/FCM_* function secrets send-push already
// has set (Supabase function secrets are project-wide, not per-function).
//
// Unlike send-push (DMs), this also writes a row into each recipient's
// `notifications` table -- DMs already have their own unread-count
// indicator independent of that table, but camp pins don't, so without
// this a crew-mate who hasn't granted push permission would never see the
// alert anywhere. Real push is still sent too, for anyone who has.
//
// Scoped to INSERT only (a brand-new pin), not UPDATE -- nudging an
// existing pin's position shouldn't re-alert the whole crew every time.
//
// Native push (APNs/FCM) needs APNS_TEAM_ID/APNS_KEY_ID/APNS_PRIVATE_KEY
// and FCM_PROJECT_ID/FCM_CLIENT_EMAIL/FCM_PRIVATE_KEY set -- none of
// which exist until there's a real Apple Developer account + Firebase
// project to generate them from. Until then getApnsJwt/getFcmAccessToken
// just throw, caught per-token below as a no-op -- inert (no
// native_push_tokens rows exist yet either, with no native build to
// register one) but ready the moment both are configured.

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

// Emoji match the same PIN_TYPES mapping App.jsx uses for the pin markers
// themselves (camp 🏕️ / meetup 📍 / other ⭐), so the notification reads
// as the same visual language as the map, not a generic system alert.
const PIN_COPY: Record<string, { emoji: string; body: string }> = {
  camp: { emoji: "🏕️", body: "Their campsite just went up — come find them on the map." },
  meetup: { emoji: "📍", body: "They're waiting to meet up — tap to see where." },
  other: { emoji: "⭐", body: "Tap to see where on the map." },
};

// ---------------------------------------------------------------------
// Native push (APNs + FCM) -- identical to send-push/index.ts's copy of
// this (each function is deployed standalone via the dashboard, not
// through a shared-module build step, so this is duplicated rather than
// imported -- same tradeoff every other pair of functions here makes).
// See supabase/README.md for what each secret is and how to get it.
// ---------------------------------------------------------------------

const apnsTeamId = Deno.env.get("APNS_TEAM_ID");
const apnsKeyId = Deno.env.get("APNS_KEY_ID");
const apnsPrivateKey = Deno.env.get("APNS_PRIVATE_KEY");
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
  cachedApnsJwt = { token, exp: now + 3000 };
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
const fcmPrivateKey = Deno.env.get("FCM_PRIVATE_KEY");

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
          if (res.status === 400 || res.status === 404 || res.status === 410) {
            await supabase.from("native_push_tokens").delete().eq("id", t.id);
          }
        } else {
          console.log("native push sent ok", t.platform, t.id);
        }
      } catch (err) {
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

    const { id: pinId, profile_id: placerId, festival_id: festivalId, pin_type: pinType } = record;
    console.log("camp_pins insert", { pinId, placerId, festivalId, pinType });

    const [{ data: recipients, error: recipientsError }, { data: placer }] = await Promise.all([
      supabase.rpc("crewmates_for_festival", { p_profile_id: placerId, p_festival_id: festivalId }),
      supabase.from("profiles").select("name").eq("id", placerId).single(),
    ]);

    if (recipientsError) console.log("crewmates_for_festival error", recipientsError);
    const recipientIds = (recipients ?? []).map((r: { profile_id: string }) => r.profile_id);
    console.log("recipientIds", recipientIds);
    if (recipientIds.length === 0) return new Response("no recipients", { status: 200 });

    const placerName = placer?.name || "Someone in your crew";
    const copy = PIN_COPY[pinType] || PIN_COPY.other;
    const title = `${placerName} dropped a pin ${copy.emoji}`;
    const body = copy.body;
    const meta = { festival: festivalId, pinType, pinId };

    // In-app inbox row for every recipient, regardless of push permission.
    const { error: notifError } = await supabase.from("notifications").insert(
      recipientIds.map((profile_id: string) => ({ profile_id, type: "camp_pin", title, body, meta, read: false }))
    );
    if (notifError) console.log("notifications insert error", notifError);

    // Real push, for whichever of those recipients have a subscription.
    const { data: subs, error: subsError } = await supabase.from("push_subscriptions").select("*").in("profile_id", recipientIds);
    if (subsError) console.log("subs query error", subsError);
    console.log("subscriptions found", subs?.length ?? 0);

    const pushPayload = JSON.stringify({ title, body, meta: { type: "camp_pin", ...meta } });

    await Promise.all([
      Promise.all(
        (subs ?? []).map(async (sub) => {
          try {
            await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, pushPayload);
            console.log("push sent ok to subscription", sub.id);
          } catch (err) {
            console.log("push send failed for subscription", sub.id, err?.statusCode, err?.body ?? String(err));
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        })
      ),
      sendNativePush(recipientIds, title, body, { type: "camp_pin", ...meta }),
    ]);

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.log("top-level error", String(err));
    return new Response(String(err), { status: 500 });
  }
});
