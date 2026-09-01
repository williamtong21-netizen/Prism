import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { clientsClaim } from "workbox-core";

// Without these, a new deploy's service worker installs but sits
// "waiting" until every open tab/PWA instance is fully closed -- which on
// a phone PWA that's rarely force-quit can mean days of a stale bundle
// even though the site "deployed successfully." skipWaiting + clientsClaim
// make a new version take over immediately instead (paired with the
// controllerchange reload in main.jsx so the page actually refreshes).
self.skipWaiting();
clientsClaim();

// vite-plugin-pwa injects the list of build assets to precache here —
// same offline-caching behavior as before, just written by hand instead
// of fully generated, so there's room for the push handlers below.
precacheAndRoute(self.__WB_MANIFEST);

// Festival map images are a few hundred KB each and most people only ever
// look at one or two festivals — precaching all 10 upfront would bloat
// every install/update for maps nobody asked for. Cache them lazily
// instead: first view fetches from network, everything after (including
// offline) serves from cache.
registerRoute(
  ({ url }) => url.pathname.startsWith("/festival-maps/"),
  new CacheFirst({
    cacheName: "festival-maps",
    plugins: [new ExpirationPlugin({ maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 })],
  })
);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Prism", body: event.data?.text() || "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Prism", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: data.meta || {},
    })
  );
});

// Tapping the OS notification focuses an already-open tab instead of
// always spawning a new one -- and, since this code has no access to the
// app's own React state to navigate anywhere itself, hands the tapped
// notification's data (App.jsx's push handlers set it as `data: meta` in
// showNotification, above) back to that client via postMessage. App.jsx
// listens for it and does the actual routing (e.g. camp_pin -> that
// festival's Map), the same place the in-app bell dropdown's tap does.
// Previously this was a straight focus-or-open with the meta thrown
// away entirely, so tapping a push always landed wherever the app
// happened to already be instead of anywhere relevant to the notification.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const meta = event.notification.data || {};
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          await client.focus();
          client.postMessage({ type: "notification-click", meta });
          return;
        }
      }
      if (self.clients.openWindow) {
        const newClient = await self.clients.openWindow("/");
        // Best-effort -- if the page is still loading when this resolves,
        // App.jsx's listener isn't mounted yet and this message is missed.
        // The common case (app already open, backgrounded) goes through
        // the focus() branch above instead, where the listener is already live.
        if (newClient) newClient.postMessage({ type: "notification-click", meta });
      }
    })
  );
});
