/**
 * Turn the webinar page's photos into the renditions it serves.
 *
 *   node scripts/build-webinar-images.mjs
 *
 * Sources live in `source-assets/webinar/` — the Kalan photos after they were upscaled by
 * hand (Canva). Drop a better file over one of them and re-run; the page needs no change.
 *
 * ⚠️ THESE ARE NOT THE `events/` FILES, ON PURPOSE. The event pages lay the same photos out
 * at 576 CSS px and have their own pipeline (`build-event-images.mjs`). The webinar lays
 * them out at half or all of a desktop screen, which is what made the 1152px WhatsApp copies
 * visibly soft. Overwriting the event files with a 6 MB upscale would fix this page by
 * making every event page download it too.
 *
 * ⚠️ NO RENDITION IS WIDER THAN ITS SOURCE. Widths above the source are skipped and the
 * source width itself is emitted instead, so an un-upscaled photo still publishes cleanly —
 * just with fewer sizes. Upscaling here would only make a bigger blurry file.
 *
 * Outputs, into `public/assets/img/webinar/`: `<name>-<width>.webp` per width. WebP only:
 * every browser the page targets decodes it, so a JPEG copy would never be requested.
 *
 * ⚠️ THE SOURCES ARE NOT IN THE REPOSITORY (gitignored, ~11 MB). Put them back under
 * `source-assets/webinar/` to re-run this; the committed outputs are all the site needs.
 *
 * The page reads `WEBINAR_PHOTOS` in `src/lib/webinar.ts` — update the widths there to
 * match what this prints.
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC_DIR = "source-assets/webinar";
const OUT_DIR = "public/assets/img/webinar";
const WIDTHS = [800, 1400, 2000];

const PHOTOS = ["hall", "students"];

await mkdir(OUT_DIR, { recursive: true });

for (const name of PHOTOS) {
  const src = path.join(SRC_DIR, `${name}.jpg`);
  const { width: srcWidth, height: srcHeight } = await sharp(src).metadata();
  const widths = WIDTHS.filter((w) => w < srcWidth);
  if (widths.length < WIDTHS.length) widths.push(srcWidth);

  const made = [];
  for (const width of widths) {
    const base = path.join(OUT_DIR, `${name}-${width}`);
    const sized = () => sharp(src).rotate().resize({ width, kernel: "lanczos3" });
    await sized().webp({ quality: 80, effort: 6 }).toFile(`${base}.webp`);
    made.push(width);
  }
  console.log(`  ${name}  ${srcWidth}×${srcHeight}  →  ${made.join(", ")}w`);
}
