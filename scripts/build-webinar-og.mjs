/**
 * Build the two share cards for the webinar page — what WhatsApp, Facebook and Instagram
 * show when a parent forwards `/webinar` or `/webinar/en`.
 *
 *   node scripts/build-webinar-og.mjs
 *
 * ⚠️ RENDERED HERE, NOT WITH `next/og`. `ImageResponse` lays text out with Satori, which
 * does not shape Devanagari: matras detach and conjuncts fall apart, so "सोचें" comes out
 * as a row of broken glyphs on the one card a Hindi-speaking parent will judge us by.
 * sharp hands SVG text to Pango + HarfBuzz, which shape it properly.
 *
 * ⚠️ THE FONT IS NIRMALA UI, SO RUN THIS ON WINDOWS (or any machine with Nirmala
 * installed). It is the system Devanagari face there and carries Latin too, so one family
 * covers "AI", "JEE" and the Hindi. Elsewhere fontconfig silently substitutes something
 * else — check the output by eye before committing it.
 *
 * Outputs, into `public/assets/img/webinar/` — 1200×630 JPEG, the size every network crops
 * to without letterboxing:
 *   og-webinar-hi.jpg
 *   og-webinar-en.jpg
 */

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = "public/assets/img/webinar";
const W = 1200;
const H = 630;

/** The Kalan hall — the screen reads "AI as your personal tutor". */
const PHOTO_SRC = "public/assets/img/events/svnic-hall@2x.jpg";
const LOGO_SRC = "public/assets/img/innovgeist-logo-light@2x.png";

/** Photo plate on the right, in card coordinates. */
const PHOTO = { left: 660, top: 92, width: 488, height: 446, radius: 24 };

const CARDS = {
  hi: {
    chip: "फ्री लाइव वेबिनार · कक्षा 9–12",
    lines: ["AI से <tspan fill='#9EC1F7'>बेहतर सोचें,</tspan>", "तेज़ी से सीखें"],
    size: 64,
    lineGap: 84,
    sub: "बोर्ड, JEE और NEET · बिना नकल के",
    cta: "WhatsApp ग्रुप जॉइन करें, फ्री",
    badge: "कलान, सुल्तानपुर · 13 सितंबर 2026",
  },
  en: {
    chip: "Free live webinar · Class 9–12",
    lines: ["Think Better.", "<tspan fill='#9EC1F7'>Learn Faster</tspan> with AI."],
    size: 54,
    lineGap: 70,
    sub: "Boards, JEE and NEET · without copying",
    cta: "Join the free WhatsApp group",
    badge: "Kalan, Sultanpur · 13 September 2026",
  },
};

const FONT = "Nirmala UI";

/**
 * Rendered width of one line, in px. The pills are sized to their text, and a character
 * count cannot do that for Devanagari — "फ्री" is four code points and one and a half glyphs.
 * So the line is drawn on its own and the ink trimmed.
 */
async function textWidth(text, size, weight) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="${size * 2}"><text x="0" y="${size * 1.4}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="#000">${text}</text></svg>`;
  const { info } = await sharp(Buffer.from(svg)).flatten({ background: "#fff" }).trim().toBuffer({ resolveWithObject: true });
  return info.width;
}

function backgroundSvg(card, widths) {
  const headTop = 268;
  const subTop = headTop + card.lineGap + 62;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M32 0H0V32" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
    </pattern>
    <radialGradient id="glow" cx="78%" cy="40%" r="55%">
      <stop offset="0" stop-color="#9EC1F7" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#9EC1F7" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="#0F2847"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <rect x="${PHOTO.left}" y="${PHOTO.top}" width="${PHOTO.width}" height="${PHOTO.height}"
        rx="${PHOTO.radius}" fill="#1A3A5F" filter="url(#shadow)"/>

  <g font-family="${FONT}">
    <rect x="56" y="150" width="${widths.chip + 64}" height="44" rx="22"
          fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)"/>
    <circle cx="80" cy="172" r="6" fill="#FF6B57"/>
    <text x="98" y="180" font-size="22" font-weight="600" fill="#E4EAF3">${card.chip}</text>

    <text font-size="${card.size}" font-weight="700" fill="#FFFFFF">
      <tspan x="54" y="${headTop}">${card.lines[0]}</tspan>
      <tspan x="54" y="${headTop + card.lineGap}">${card.lines[1]}</tspan>
    </text>

    <text x="56" y="${subTop}" font-size="26" fill="#C7D2E3">${card.sub}</text>

    <rect x="56" y="${subTop + 40}" width="${widths.cta + 96}" height="64" rx="14" fill="#25D366"/>
    <g transform="translate(80 ${subTop + 60}) scale(1.05)">
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" fill="none" stroke="#0F2847" stroke-width="2" stroke-linejoin="round"/>
      <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9a4.4 4.4 0 0 1-2.3-2.3l.9-1-1-2Z" fill="#0F2847"/>
    </g>
    <text x="118" y="${subTop + 81}" font-size="25" font-weight="700" fill="#0F2847">${card.cta}</text>
  </g>
</svg>`;
}

function badgeSvg(card, textW) {
  const width = textW + 58;
  return {
    width,
    svg: `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="40">
  <rect width="${width}" height="40" rx="20" fill="rgba(255,255,255,0.96)"/>
  <g transform="translate(16 11) scale(0.75)">
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" fill="none" stroke="#0F2847" stroke-width="2.4"/>
    <circle cx="12" cy="9.5" r="2.5" fill="#0F2847"/>
  </g>
  <text x="40" y="26" font-family="${FONT}" font-size="17" font-weight="600" fill="#0F2847">${card.badge}</text>
</svg>`,
  };
}

/** The hall photo, cropped to the plate and given the same rounded corners. */
async function photoPlate() {
  const mask = Buffer.from(
    `<svg width="${PHOTO.width}" height="${PHOTO.height}"><rect width="100%" height="100%" rx="${PHOTO.radius}"/></svg>`,
  );
  // Left-weighted crop: keeps the projector screen and the speaker, as on the page.
  return sharp(PHOTO_SRC)
    .resize({ width: PHOTO.width, height: PHOTO.height, fit: "cover", position: "west" })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

await mkdir(OUT_DIR, { recursive: true });

const logo = await sharp(LOGO_SRC).resize({ height: 40 }).png().toBuffer();
const photo = await photoPlate();

for (const [lang, card] of Object.entries(CARDS)) {
  const widths = {
    chip: await textWidth(card.chip, 22, 600),
    cta: await textWidth(card.cta, 25, 700),
  };
  const badge = badgeSvg(card, await textWidth(card.badge, 17, 600));
  const out = path.join(OUT_DIR, `og-webinar-${lang}.jpg`);
  await sharp(Buffer.from(backgroundSvg(card, widths)))
    .composite([
      { input: logo, left: 56, top: 64 },
      { input: photo, left: PHOTO.left, top: PHOTO.top },
      {
        input: Buffer.from(badge.svg),
        left: PHOTO.left + PHOTO.width - badge.width - 16,
        top: PHOTO.top + 16,
      },
    ])
    .jpeg({ quality: 84, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(out);
  console.log(`  ${out}`);
}
