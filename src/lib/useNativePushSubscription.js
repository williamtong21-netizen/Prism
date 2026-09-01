import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "./supabaseClient";

// Native-platform counterpart to usePushSubscription.js (Web Push) --
// same {supported, subscribed, subscribe, unsubscribe} shape so App.jsx
// can pick whichever one actually applies with no other code branching
// (see the Capacitor.isNativePlatform() ? nativePush : webPush wiring).
//
// There's no client-side "deregister" API for native push -- the OS
// permission itself can only be revoked from the phone's own Settings, so
// unsubscribe() here just deletes this device's token row, which is what
// actually controls whether the send side still targets it.
export function useNativePushSubscription(profileId) {
  const [subscribed, setSubscribed] = useState(false);
  const supported = Capacitor.isNativePlatform();
  const tokenRef = useRef(null);

  useEffect(() => {
    if (!supported) return;
    // If permission was already granted in an earlier session, silently
    // re-register to (a) confirm the toggle should read "on" and (b)
    // refresh the token row in case the OS rotated it -- register() only
    // shows a permission prompt the first time, it's a no-op UI-wise here.
    PushNotifications.checkPermissions().then(({ receive }) => {
      setSubscribed(receive === "granted");
      if (receive === "granted") PushNotifications.register();
    });
  }, [supported]);

  useEffect(() => {
    if (!supported || !profileId) return;
    const regSub = PushNotifications.addListener("registration", (token) => {
      tokenRef.current = token.value;
      supabase
        .from("native_push_tokens")
        .upsert({ profile_id: profileId, token: token.value, platform: Capacitor.getPlatform() }, { onConflict: "token" })
        .then(({ error }) => {
          if (error) console.error("native push token upsert failed", error);
          else setSubscribed(true);
        });
    });
    const errSub = PushNotifications.addListener("registrationError", (err) => {
      console.error("native push registration error", err);
    });
    return () => {
      regSub.then((s) => s.remove());
      errSub.then((s) => s.remove());
    };
  }, [supported, profileId]);

  const subscribe = useCallback(async () => {
    if (!supported || !profileId) return { error: { message: "Push isn't supported on this device." } };
    try {
      const { receive } = await PushNotifications.requestPermissions();
      if (receive !== "granted") {
        return { error: { message: "Notifications are blocked for this app in your phone's settings." } };
      }
      // The actual `subscribed` flip happens in the "registration"
      // listener above once the OS hands back a token -- this just kicks
      // that off rather than blocking the toggle on it.
      await PushNotifications.register();
      return { data: true };
    } catch (err) {
      return { error: { message: err?.message || "Couldn't turn on push notifications — try again." } };
    }
  }, [supported, profileId]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    const token = tokenRef.current;
    const query = supabase.from("native_push_tokens").delete();
    await (token ? query.eq("token", token) : query.eq("profile_id", profileId).eq("platform", Capacitor.getPlatform()));
    setSubscribed(false);
  }, [supported, profileId]);

  return { supported, subscribed, subscribe, unsubscribe };
}
