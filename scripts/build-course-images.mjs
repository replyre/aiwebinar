/**
 * Turn a course banner into the renditions the page serves.
 *
 *   node scripts/build-course-images.mjs source-assets/ai-study-method-banner-source.png ai-study-method-banner
 *
 * ⚠️ THIS IS THE PIPELINE, NOT AN OPTIMISATION. The source banner is a 1.6 MB PNG; served
 * as-is it is the largest thing on the page by a factor of twenty, on a connection that is
 * often 4G in a tier-2 city. The 800w WebP is 35 KB. Nothing here is optional.
 *
 * Outputs, into `public/assets/img/course/`:
 *   <name>.jpg / .webp        800w   — the 1x rendition
 *   <name>@2x.jpg / .webp    1600w   — retina and desktop
 *   <name>-og.jpg          1200×630  — social preview, cropped not letterboxed
 *
 * Both formats are emitted because `<picture>` offers WebP first and falls back to JPEG;
 * the JPEG is never fetched by a browser that took the WebP.
 */

import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";

const [, , sourceArg, nameArg] = process.argv;

if (!sourceArg || !nameArg) {
  console.error(
    "usage: node scripts/build-course-images.mjs <source-image> <output-name>\n" +
      "e.g.   node scripts/build-course-images.mjs source-assets/banner.png ai-study-method-banner",
  );
  process.exit(1);
}

const OUT_DIR = "public/assets/img/course";
await mkdir(OUT_DIR, { recursive: true });

const base = path.join(OUT_DIR, nameArg);
const meta = await sharp(sourceArg).metadata();
console.log(`source: ${meta.width}×${meta.height}`);

for (const [width, suffix] of [
  [800, ""],
  [1600, "@2x"],
]) {
  await sharp(sourceArg).resize(width).webp({ quality: 82 }).toFile(`${base}${suffix}.webp`);
  await sharp(sourceArg)
    .resize(width)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(`${base}${suffix}.jpg`);
}

/**
 * ⚠️ `fit: "cover"` WITH `position: "left"`, NOT `contain`. A 16:9 banner squeezed into
 * 1200×630 by letterboxing gets grey bars in every social preview. Cropping from the left
 * keeps the headline — which is the part worth previewing — and loses only the right edge.
 */
await sharp(sourceArg)
  .resize(1200, 630, { fit: "cover", position: "left" })
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(`${base}-og.jpg`);

const files = (await readdir(OUT_DIR)).filter((f) => f.startsWith(nameArg)).sort();
console.log(`\nwritten to ${OUT_DIR}/`);
for (const file of files) {
  const { size } = await stat(path.join(OUT_DIR, file));
  console.log(`  ${file.padEnd(38)} ${(size / 1024).toFixed(0)} KB`);
}
