// Shared logomark renderer used by scripts/gen-icons.mjs (PWA icons) and
// scripts/gen-native-icons.mjs (iOS/Android app icon + splash assets) --
// same visual language as the in-app PrismLogo component: a dark prism
// refracting one beam into the teal/purple/pink gradient used throughout
// the UI. Kept as vector source so every target size is a direct render,
// never a raster upscale of a smaller PNG.
//
// `drawBg: false` omits the background rect entirely (leaving the canvas
// transparent outside the mark itself) for callers that composite the
// mark onto their own background -- e.g. an Android adaptive-icon
// foreground layer, or a splash screen's logo sitting on a larger canvas.
// The prism triangle's own fill still uses `bg`, since that's the "cut
// glass" look (the triangle interior reads as background-colored, not
// as a hole), not the canvas background.
export function iconSvg({ size, scale, bg = "#0F0B1A", drawBg = true }) {
  const s = size;
  const c = s / 2;
  const g = (s / 100) * scale; // scale factor from the 100-unit logo coords
  const t = (x, y) => `${c + (x - 50) * g},${c + (y - 50) * g}`;

  return `
<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
  ${drawBg ? `<rect width="${s}" height="${s}" fill="${bg}"/>` : ""}
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
