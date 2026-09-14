/**
 * Turn the raw event capture — WhatsApp stills and a phone video — into the renditions
 * the event pages serve.
 *
 *   node scripts/build-event-images.mjs
 *
 * ⚠️ THE SOURCES ARE NOT IN THE REPOSITORY. This ran once against a WhatsApp export — two
 * stills and a 58-second phone video — that was deleted rather than committed; the video
 * alone was 8.4 MB, which is not a thing to carry in git forever for one page of photos.
 * Its *outputs* are committed, in `public/assets/img/events/`, so the site is complete
 * without it. Re-running needs those originals put back under `temp/` (stills in
 * `temp/images`, extracted video frames and the college header in `temp/frames`).
 *
 * It is kept because it is the record of how those files were made — the border crop, the
 * resolution rule, the enhancement settings — and the next school's photos want the same
 * treatment rather than a fresh guess at it.
 *
 * ⚠️ THE SOURCES ARE ALREADY DEGRADED AND NOTHING HERE RECOVERS THAT. The stills arrive as
 * 1152×520 WhatsApp re-encodes and the video is 832×464 — heavy 4:2:0 chroma subsampling,
 * visible ringing on every high-contrast edge. So this pipeline does not try to upscale its
 * way out. It does the one thing that actually works: it publishes the native pixels as the
 * **@2x** rendition and half that as the 1x, so the page can never lay a source out above
 * its own resolution. At a 576 CSS px card the 1152 px file is a true retina image and the
 * artefacts fall below a device pixel. Widen those layouts and the mush comes straight back.
 *
 * Outputs, into `public/assets/img/events/`:
 *   svnic-hall         576 / 1152w  — the room from the back, screen lit
 *   svnic-students     576 / 1152w  — front rows, speaker working the floor
 *   svnic-speaker      404 /  808w  — video frame, speaker mid-address
 *   svnic-audience     404 /  808w  — video frame, the full hall
 *   svnic-qa           404 /  808w  — video frame, students at the mic
 *   svnic-crest.png    240w         — the college crest, lifted from their own header
 *
 * Both JPEG and WebP are emitted because `<picture>` offers WebP first and falls back; a
 * browser that took the WebP never fetches the JPEG.
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC_DIR = "temp/images";
const FRAME_DIR = process.env.EVENT_FRAME_DIR ?? "temp/frames";
const OUT_DIR = "public/assets/img/events";

await mkdir(OUT_DIR, { recursive: true });

/**
 * The red broadcast border burnt into the video: 14px left, 10px top, 6px right, 11px
 * bottom, measured by sampling the raw buffer and then rounded outward so no fringe
 * survives. Cropping it is not cosmetic — left in, it becomes a red hairline inside every
 * rounded card on the page.
 */
const FRAME_CROP = { left: 16, top: 12, width: 808, height: 440 };

/**
 * A gentle unsharp pass puts back the local micro-contrast the re-encode flattened, and a
 * small saturation lift counters the wash-out of a fluorescent-lit hall. Both are kept
 * deliberately mild: pushed further, JPEG ringing sharpens just as happily as the subject.
 */
const enhance = (img) =>
  img
    .modulate({ saturation: 1.12, brightness: 1.02 })
    .linear(1.06, -8)
    .sharpen({ sigma: 0.8, m1: 0.5, m2: 2.2 });

/** Emit every rendition of one photo, in both formats. */
async function publish(name, pipeline, widths) {
  for (const [suffix, width] of Object.entries(widths)) {
    const sized = () => pipeline().resize({ width, kernel: "lanczos3" });
    const base = path.join(OUT_DIR, `${name}${suffix}`);

    // 4:4:4 on the way out. The source has already been through 4:2:0 once; a second
    // round of chroma decimation is where the colour fringing becomes obvious.
    await sized()
      .jpeg({ quality: 86, chromaSubsampling: "4:4:4", mozjpeg: true })
      .toFile(`${base}.jpg`);
    await sized().webp({ quality: 84, effort: 6 }).toFile(`${base}.webp`);

    console.log(`  ${name}${suffix}  ${width}w`);
  }
}

const still = (file) => () => enhance(sharp(path.join(SRC_DIR, file)));
const frame = (file) => () =>
  enhance(sharp(path.join(FRAME_DIR, file)).extract(FRAME_CROP));

const STILL_WIDTHS = { "": 576, "@2x": 1152 };
const FRAME_WIDTHS = { "": 404, "@2x": 808 };

console.log("stills (native 1152w → @2x):");
await publish("svnic-hall", still("WhatsApp Image 2026-09-13 at 9.09.27 PM.jpeg"), STILL_WIDTHS);
await publish("svnic-students", still("WhatsApp Image 2026-09-13 at 9.09.28 PM.jpeg"), STILL_WIDTHS);

console.log("video frames (native 808w after border crop → @2x):");
await publish("svnic-speaker", frame("f01.jpg"), FRAME_WIDTHS);
await publish("svnic-audience", frame("f08.jpg"), FRAME_WIDTHS);
await publish("svnic-qa", frame("f12.jpg"), FRAME_WIDTHS);

/**
 * The crest, taken from `svnic.in/images/header.jpg` and trimmed to its own bounds. It is
 * the host institution's mark on a page about their own event — shown at badge size beside
 * their name, never as an endorsement of anything else.
 */
console.log("crest:");
await sharp(path.join(FRAME_DIR, "header.jpg"))
  // The seal only. Bounds found by scanning the header for its red ring — x 20-134,
  // y 4-113 — then padded outward. Any taller and the motto line beneath rides along.
  .extract({ left: 17, top: 2, width: 120, height: 112 })
  .resize({ width: 240, kernel: "lanczos3" })
  // Flat artwork on white: a 128-colour palette is indistinguishable here and about a
  // fifth of the bytes of full truecolour.
  .png({ compressionLevel: 9, palette: true, colours: 128 })
  .toFile(path.join(OUT_DIR, "svnic-crest.png"));
console.log("  svnic-crest.png  240w");
