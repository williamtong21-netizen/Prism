import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";

// Native-shell-only glue. Everything here is a no-op on the web PWA --
// Capacitor.isNativePlatform() is false there, so this hook does nothing
// and the existing web behavior (browser chrome, ?join= URL param, no
// status bar API) is untouched.
//
// Three jobs, all only meaningful inside the iOS/Android wrapper:
//  1. Match the status bar to the app's dark theme (the PWA meta tag
//     equivalent, apple-mobile-web-app-status-bar-style, has no native
//     counterpart -- this is that, for real).
//  2. Hand off the native launch screen the instant React has mounted.
//     capacitor.config.ts sets launchAutoHide/launchShowDuration so this
//     is belt-and-suspenders, not the only thing hiding it.
//  3. Bridge deep links (custom URL scheme now; add prismfest.io as an
//     associated/App Link domain later for real https universal links --
//     see capacitor.config.ts comment) into the same crew-invite join flow
//     the web `?join=CODE` query param already feeds. `onJoinCode` should
//     be the App.jsx setter that stashes a join code the same way the
//     lazy pendingJoinCode useState initializer does for the web case.
export function useCapacitorBridge(onJoinCode) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    SplashScreen.hide().catch(() => {});

    const sub = App.addListener("appUrlOpen", ({ url }) => {
      let code = null;
      try {
        code = new URL(url).searchParams.get("join");
      } catch {
        // Custom-scheme URLs (io.prismfest.app://join?code=X) aren't always
        // parseable by the WHATWG URL constructor across platforms -- fall
        // back to a plain regex on the raw string.
        const match = /[?&]join=([^&]+)/.exec(url);
        if (match) code = decodeURIComponent(match[1]);
      }
      if (code) onJoinCode(code);
    });

    return () => {
      sub.then((s) => s.remove()).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
