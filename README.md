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
