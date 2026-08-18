import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Web Push wants the VAPID key as a Uint8Array, but it's handed out (and
// stored in env) as a base64url string — standard conversion.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushSubscription(profileId) {
  const [subscribed, setSubscribed] = useState(false);
  const [supported] = useState(() => "serviceWorker" in navigator && "PushManager" in window);

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
    );
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported || !profileId) return { error: { message: "Push isn't supported on this device/browser." } };
    if (Notification.permission === "denied") {
      return { error: { message: "Notifications are blocked for this app in your browser/phone settings." } };
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return { error: { message: "Permission not granted." } };

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }
    const json = subscription.toJSON();
    const { error } = await supabase.from("push_subscriptions").upsert(
      { profile_id: profileId, endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth },
      { onConflict: "endpoint" }
    );
    if (error) return { error };
    setSubscribed(true);
    return { data: true };
  }, [supported, profileId]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await supabase.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
      await subscription.unsubscribe();
    }
    setSubscribed(false);
  }, [supported]);

  return { supported, subscribed, subscribe, unsubscribe };
}
