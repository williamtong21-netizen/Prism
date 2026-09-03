import type { CapacitorConfig } from '@capacitor/cli';

// Native app wrapper config. `webDir: 'dist'` means `npx cap sync` copies the
// same production build the web app ships (npm run build) straight into the
// iOS/Android projects -- one build, two distribution channels, no forked
// codebase. Colors below match the PWA manifest's theme_color/background_color
// (vite.config.js) so the native splash/status bar don't flash a mismatched
// shade before React mounts.
const config: CapacitorConfig = {
  appId: 'io.prismfest.app',
  appName: 'Prism',
  webDir: 'dist',
  backgroundColor: '#0F0B1A',
  plugins: {
    SplashScreen: {
      launchShowDuration: 0, // hand off to the app's own loading UI immediately, don't show a second splash on top of it
      backgroundColor: '#0F0B1A',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      // Matches the existing apple-mobile-web-app-status-bar-style
      // "black-translucent" meta tag the PWA already uses.
      style: 'DARK', // dark background -> light (white) status bar text/icons
      backgroundColor: '#0F0B1A',
      overlaysWebView: false,
    },
  },
  ios: {
    contentInset: 'automatic',
  },
  // Do NOT set server.iosScheme/androidScheme to 'https' -- tried that once
  // to chase a sign-in bug that turned out to be an unrelated corrupted env
  // var, and it silently broke Capacitor.isNativePlatform() detection: the
  // app kept running fine but every Capacitor.isNativePlatform() ? native :
  // web branch (native push registration included) started taking the web
  // path instead, with no visible error -- just silently wrong data (web
  // Push subscriptions instead of native APNs/FCM tokens). Default
  // `capacitor://localhost` scheme is what keeps that detection correct.
};

export default config;
