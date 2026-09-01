// Deploys via the Supabase Dashboard (Edge Functions -> deploy from the
// browser editor) rather than the CLI. Triggered by a Database Webhook on
// INSERT to camp_pins — see supabase/README.md for the wiring steps.
// Reuses the same VAPID_* function secrets send-push already has set
// (Supabase function secrets are project-wide, not per-function).
//
// Unlike send-push (DMs), this also writes a row into each recipient's
// `notifications` table -- DMs already have their own unread-count
// indicator independent of that table, but camp pins don't, so without
// this a crew-mate who hasn't granted push permission would never see the
// alert anywhere. Real push is still sent too, for anyone who has.
//
// Scoped to INSERT only (a brand-new pin), not UPDATE -- nudging an
// existing pin's position shouldn't re-alert the whole crew every time.

import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

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

    await Promise.all(
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
    );

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.log("top-level error", String(err));
    return new Response(String(err), { status: 500 });
  }
});
