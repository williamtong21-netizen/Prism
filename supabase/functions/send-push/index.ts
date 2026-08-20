// Deploys via the Supabase Dashboard (Edge Functions -> deploy from the
// browser editor) rather than the CLI. Triggered by a Database Webhook on
// INSERT to dm_messages — see supabase/README.md for the wiring steps.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase
// for every edge function. VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY /
// VAPID_SUBJECT are NOT auto-injected — set them as function secrets.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

const supabase = createClient(supabaseUrl, serviceRoleKey);

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

    const body = JSON.stringify({
      title: sender?.name ? `New message from ${sender.name}` : "New message",
      body: text,
      meta: { type: "dm", threadId: thread_id },
    });

    await Promise.all(
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
    );

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.log("top-level error", String(err));
    return new Response(String(err), { status: 500 });
  }
});
