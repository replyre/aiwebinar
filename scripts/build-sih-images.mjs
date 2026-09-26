/**
 * Build the SIH 2026 hackathon renditions.
 *
 *   node scripts/build-sih-images.mjs
 *
 * ⚠️ SEPARATE FROM `build-event-images.mjs` ON PURPOSE. That script's sources were deleted
 * rather than committed, so running it now throws before it reaches anything new. This one
 * is the record of how the SIH set was made, and it fails just as loudly on its own missing
 * originals without taking the older recipe down with it.
 *
 * ⚠️ THESE SOURCES ARE GOOD, AND THE RULE CHANGES BECAUSE OF IT. The school photos were
 * 1152px WhatsApp re-encodes, so that pipeline published native pixels as **@2x** and never
 * laid them out above their own resolution. These arrive at 1600×1199 and 1600×1066 off a
 * real camera — clean enough to take the ordinary treatment: 800w for 1x, 1600w for @2x,
 * and only the mildest sharpening, because there are no compression artefacts here for a
 * heavy unsharp pass to find and amplify.
 *
 * Sources: the two WhatsApp exports dropped in `public/` (moved to `temp/sih/` before this
 * runs, so they are never served from the web root). Outputs, into
 * `public/assets/img/events/`:
 *   sih2026-award    800 / 1600w — certificate presentation under the hackathon slide
 *   sih2026-cohort   800 / 1600w — participants and faculty outside the NNF building
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC_DIR = process.env.SIH_SRC_DIR ?? "temp/sih";
const OUT_DIR = "public/assets/img/events";

await mkdir(OUT_DIR, { recursive: true });

/**
 * 3:2, matching the existing hackathon set so the two sit in one grid without one of them
 * being letterboxed by `aspect-ratio`. The award frame is 4:3, so it loses 133 rows — taken
 * four-to-one off the top, where there is ceiling, rather than off the feet.
 */
const AWARD_CROP = { left: 0, top: 106, width: 1600, height: 1066 };

/** Barely anything: a clean capture only needs its output resize resharpened. */
const enhance = (img) => img.modulate({ saturation: 1.04 }).sharpen({ sigma: 0.6, m1: 0.4, m2: 1.6 });

const WIDTHS = { "": 800, "@2x": 1600 };

async function publish(name, pipeline) {
  for (const [suffix, width] of Object.entries(WIDTHS)) {
    const sized = () => pipeline().resize({ width, kernel: "lanczos3" });
    const base = path.join(OUT_DIR, `${name}${suffix}`);

    await sized().jpeg({ quality: 86, chromaSubsampling: "4:4:4", mozjpeg: true }).toFile(`${base}.jpg`);
    await sized().webp({ quality: 84, effort: 6 }).toFile(`${base}.webp`);

    console.log(`  ${name}${suffix}  ${width}w`);
  }
}

const src = (file) => path.join(SRC_DIR, file);

console.log("SIH 2026 hackathon:");
await publish("sih2026-award", () =>
  enhance(sharp(src("WhatsApp Image 2026-09-24 at 10.43.42 AM.jpeg")).extract(AWARD_CROP)),
);
await publish("sih2026-cohort", () =>
  enhance(sharp(src("WhatsApp Image 2026-09-24 at 10.43.42 AM (1).jpeg"))),
);
