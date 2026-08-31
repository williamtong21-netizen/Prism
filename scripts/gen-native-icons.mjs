// Generates the iOS + Android native-wrapper app icon and splash assets
// straight from the vector logomark (scripts/icon-svg.mjs) -- every size
// is a direct render, not a raster upscale of public/icons/icon-512.png,
// which is what actually matters here since the iOS App Store icon
// (1024x1024) and splash marks are larger than that PWA source.
//
// Run manually (`node scripts/gen-native-icons.mjs`) after `npx cap add
// ios`/`android` have created the asset folders this writes into, and
// again whenever the brand mark/colors change -- same convention as
// scripts/gen-icons.mjs for the PWA icon set.
import sharp from "sharp";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { iconSvg } from "./icon-svg.mjs";

const BG = "#0F0B1A"; // matches vite.config.js manifest background_color/theme_color

async function png(svg) {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function iosIcon() {
  const dir = "ios/App/App/Assets.xcassets/AppIcon.appiconset";
  if (!existsSync(dir)) return console.log("skip iOS icon (no ios/ project — npx cap add ios first)");
  // 1024x1024, opaque (the svg's own <rect> fills the whole canvas) --
  // App Store rejects any alpha channel on this icon.
  const buf = await png(iconSvg({ size: 1024, scale: 1.55, bg: BG }));
  writeFileSync(`${dir}/AppIcon-512@2x.png`, buf);
  console.log("wrote iOS app icon");
}

async function splashCanvas(w, h, logoFrac = 0.34) {
  const logoSize = Math.round(Math.min(w, h) * logoFrac);
  const logo = await png(iconSvg({ size: logoSize, scale: 1.55, bg: BG, drawBg: false }));
  return sharp({ create: { width: w, height: h, channels: 4, background: BG } })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

async function iosSplash() {
  const dir = "ios/App/App/Assets.xcassets/Splash.imageset";
  if (!existsSync(dir)) return console.log("skip iOS splash (no ios/ project)");
  const canvas = await splashCanvas(2732, 2732);
  // Same static image at all three scale slots -- Capacitor's default
  // LaunchScreen storyboard references one "universal" asset and lets the
  // OS scale it, so there's nothing scale-specific to render differently.
  for (const name of ["splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"]) {
    writeFileSync(`${dir}/${name}`, canvas);
  }
  console.log("wrote iOS splash");
}

// mipmap density -> legacy launcher icon px. The adaptive-icon foreground
// canvas is 2.25x that (108dp safe-zone / 48dp legacy icon ratio).
const DENSITIES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

async function androidLauncher() {
  const base = "android/app/src/main/res";
  if (!existsSync(base)) return console.log("skip Android launcher (no android/ project — npx cap add android first)");
  for (const [density, size] of Object.entries(DENSITIES)) {
    const dir = `${base}/mipmap-${density}`;
    const flat = await png(iconSvg({ size, scale: 1.55, bg: BG }));
    writeFileSync(`${dir}/ic_launcher.png`, flat);
    writeFileSync(`${dir}/ic_launcher_round.png`, flat);

    const fgSize = Math.round(size * 2.25);
    // scale: 1.0 matches the maskable PWA icon's extra safe-zone padding
    // convention -- the adaptive-icon system masks this layer to a
    // circle/squircle, so the mark needs the same inset the PWA maskable
    // icon uses, not the tighter PWA icon-192/512 crop.
    const fg = await png(iconSvg({ size: fgSize, scale: 1.0, bg: BG, drawBg: false }));
    writeFileSync(`${dir}/ic_launcher_foreground.png`, fg);
  }
  console.log("wrote Android launcher set (all densities)");
}

// Legacy (pre-adaptive-icon) static splash slots Capacitor's template
// ships per density/orientation. Cosmetic only on modern devices
// (capacitor.config.ts sets SplashScreen.launchShowDuration: 0) but still
// shown very briefly by the OS during cold start before Capacitor's JS runs.
const SPLASH_SIZES = {
  "drawable-port-mdpi": [480, 800],
  "drawable-port-hdpi": [720, 1280],
  "drawable-port-xhdpi": [960, 1600],
  "drawable-port-xxhdpi": [1440, 2400],
  "drawable-port-xxxhdpi": [1920, 3200],
  "drawable-land-mdpi": [800, 480],
  "drawable-land-hdpi": [1280, 720],
  "drawable-land-xhdpi": [1600, 960],
  "drawable-land-xxhdpi": [2400, 1440],
  "drawable-land-xxxhdpi": [3200, 1920],
  drawable: [480, 800],
};

async function androidSplash() {
  const base = "android/app/src/main/res";
  if (!existsSync(base)) return console.log("skip Android splash (no android/ project)");
  for (const [dir, [w, h]] of Object.entries(SPLASH_SIZES)) {
    mkdirSync(`${base}/${dir}`, { recursive: true });
    const canvas = await splashCanvas(w, h);
    writeFileSync(`${base}/${dir}/splash.png`, canvas);
  }
  console.log("wrote Android splash set (all densities/orientations)");
}

await iosIcon();
await iosSplash();
await androidLauncher();
await androidSplash();
console.log("done");
