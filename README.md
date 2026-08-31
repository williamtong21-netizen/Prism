# Prism

A multi-festival companion app — schedules, crew coordination, maps, and
community. Currently a prototype running on mock data.

Built as a PWA: installable to a phone home screen, with an offline-capable
service worker and app manifest via [`vite-plugin-pwa`](https://vite-pwa-org.netlify.app/).

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

`public/icons/` are generated from the in-app Prism logomark via
`scripts/gen-icons.mjs` (`node scripts/gen-icons.mjs`) — rerun it if the
logo/brand colors change.

## Native app (iOS / Android)

Wrapped with [Capacitor](https://capacitorjs.com) — `ios/` and `android/`
are real, committed native projects that load the *same* production web
build (`webDir: 'dist'` in `capacitor.config.ts`), not a fork of the
codebase. App ID: `io.prismfest.app`.

```bash
npm run cap:ios      # builds, syncs, opens ios/App/App.xcworkspace in Xcode
npm run cap:android  # builds, syncs, opens android/ in Android Studio
```

- **iOS needs a Mac with Xcode** — that's an Apple requirement, not a
  tooling choice, so `npm run cap:ios` on Windows/Linux will fail at the
  `cap open` step. Run it from a Mac, or just `npm run cap:sync` here and
  `open ios/App/App.xcworkspace` there. Building/archiving/submitting all
  happen in Xcode; an Apple Developer Program account ($99/yr) is required
  regardless of where the build runs.
- **Android** can build/run/sign end-to-end on Windows/Mac/Linux with
  Android Studio + a JDK installed.
- Icon/splash source is vector (`scripts/icon-svg.mjs`), rendered straight
  to every native size by `node scripts/gen-native-icons.mjs` — rerun it
  after `npx cap add ios`/`android` (creates the asset folders it writes
  into) and whenever the brand mark/colors change, same convention as
  `gen-icons.mjs`.
- The web app's service worker (offline caching + Web Push) is
  intentionally **not** registered inside the native shell (see
  `src/main.jsx`) — native builds bundle the web assets directly into the
  app binary and update via App Store/Play Store review, not a runtime SW
  fetch, so there's nothing for it to do there.
- Crew-invite deep links currently work via Capacitor's default custom URL
  scheme (`io.prismfest.app://…`) through `src/lib/useCapacitorBridge.js`.
  Making the real `https://prismfest.io/?join=CODE` links (the ones
  actually shared) open the native app directly still needs iOS
  Associated Domains + a hosted `apple-app-site-association` file, and
  Android App Links + a hosted `assetlinks.json` — not yet done.
- Native push notifications (APNs/FCM via `@capacitor/push-notifications`)
  are not yet built; `usePushSubscription.js`'s web-push toggle is
  correctly disabled on native in the meantime rather than silently
  hanging.
