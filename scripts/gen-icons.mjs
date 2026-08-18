import sharp from "sharp";
import { mkdirSync } from "node:fs";

mkdirSync("public/icons", { recursive: true });

// Same visual language as the in-app PrismLogo: a dark prism refracting one
// beam into the teal/purple/pink gradient used throughout the UI.
function iconSvg({ size, scale, bg = "#0F0B1A" }) {
  const s = size;
  const c = s / 2;
  const g = (s / 100) * scale; // scale factor from the 100-unit logo coords
  const t = (x, y) => `${c + (x - 50) * g},${c + (y - 50) * g}`;

  return `
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${s}" height="${s}" fill="${bg}"/>
  <defs>
    <linearGradient id="beam" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3DF2E0"/>
      <stop offset="55%" stop-color="#9D6BFF"/>
      <stop offset="100%" stop-color="#FF3DA6"/>
    </linearGradient>
  </defs>
  <line x1="${t(6,50).split(',')[0]}" y1="${t(6,50).split(',')[1]}" x2="${t(38,50).split(',')[0]}" y2="${t(38,50).split(',')[1]}" stroke="#F5F0FF" stroke-width="${3*g}" stroke-linecap="round" opacity="0.85"/>
  <polygon points="${t(50,22)} ${t(74,64)} ${t(26,64)}" fill="${bg}" stroke="url(#beam)" stroke-width="${3*g}" stroke-linejoin="round"/>
  <line x1="${t(58,50).split(',')[0]}" y1="${t(58,50).split(',')[1]}" x2="${t(94,30).split(',')[0]}" y2="${t(94,30).split(',')[1]}" stroke="#3DF2E0" stroke-width="${3*g}" stroke-linecap="round"/>
  <line x1="${t(58,52).split(',')[0]}" y1="${t(58,52).split(',')[1]}" x2="${t(94,52).split(',')[0]}" y2="${t(94,52).split(',')[1]}" stroke="#9D6BFF" stroke-width="${3*g}" stroke-linecap="round"/>
  <line x1="${t(58,54).split(',')[0]}" y1="${t(58,54).split(',')[1]}" x2="${t(94,76).split(',')[0]}" y2="${t(94,76).split(',')[1]}" stroke="#FF3DA6" stroke-width="${3*g}" stroke-linecap="round"/>
</svg>`;
}

const targets = [
  { file: "public/icons/icon-192.png", size: 192, scale: 1.55 },
  { file: "public/icons/icon-512.png", size: 512, scale: 1.55 },
  { file: "public/icons/maskable-512.png", size: 512, scale: 1.0 }, // extra padding for the safe zone
  { file: "public/apple-touch-icon.png", size: 180, scale: 1.55 },
  { file: "public/favicon-32.png", size: 32, scale: 1.55 },
];

for (const t of targets) {
  const svg = iconSvg(t);
  await sharp(Buffer.from(svg)).png().toFile(t.file);
  console.log("wrote", t.file);
}
