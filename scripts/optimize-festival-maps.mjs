import sharp from "sharp";
import { readdirSync, statSync, unlinkSync } from "node:fs";
import path from "node:path";

const dir = "public/festival-maps";
const files = readdirSync(dir).filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f));

for (const file of files) {
  const id = path.parse(file).name;
  const srcPath = path.join(dir, file);
  const outPath = path.join(dir, `${id}.jpg`);
  const beforeSize = statSync(srcPath).size;

  await sharp(srcPath)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(outPath + ".tmp");

  // sharp can't overwrite its own input file mid-pipeline, so write to a
  // temp name first, then swap in and clean up the original if it wasn't
  // already a .jpg (a png/webp source and its new .jpg output differ in
  // name, so both would otherwise linger).
  if (srcPath !== outPath) unlinkSync(srcPath);
  const { renameSync } = await import("node:fs");
  renameSync(outPath + ".tmp", outPath);

  const afterSize = statSync(outPath).size;
  console.log(`${file} -> ${id}.jpg : ${(beforeSize / 1024).toFixed(0)}KB -> ${(afterSize / 1024).toFixed(0)}KB`);
}
