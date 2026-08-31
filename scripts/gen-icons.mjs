import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { iconSvg } from "./icon-svg.mjs";

mkdirSync("public/icons", { recursive: true });

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
