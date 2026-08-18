import { precacheAndRoute } from "workbox-precaching";

// vite-plugin-pwa injects the list of build assets to precache here —
// same offline-caching behavior as before, just written by hand instead
// of fully generated, so there's room for the push handlers below.
precacheAndRoute(self.__WB_MANIFEST);

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
// always spawning a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
