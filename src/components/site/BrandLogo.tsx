/**
 * The Innovgeist lockup — full logo on a wide screen, mark alone on a phone.
 *
 * ⚠️ THE SWAP IS A `<picture>` SOURCE, NOT TWO IMAGES WITH `display: none`. The CSS version
 * is the one everybody writes and it makes a phone download both files: `display: none`
 * suppresses the rendering, never the fetch. Here the browser evaluates `media` *before*
 * choosing, so exactly one image is ever requested.
 *
 * ⚠️ THE `width`/`height` ATTRIBUTES DESCRIBE THE FULL LOCKUP, AND THE MARK HAS A DIFFERENT
 * RATIO. That is safe only because every place this renders styles the image `height: …;
 * width: auto`, which lets the loaded file's own ratio decide the width. Drop that rule and
 * the mark stretches to lockup proportions. The attributes still earn their place: they are
 * the aspect-ratio hint that stops the header reflowing on first paint.
 *
 * It is one component rather than nine copies because it *was* nine copies — the same nine
 * lines pasted into every header on the site, which is nine places to forget when the logo
 * changes, and the reason this mobile swap would otherwise have been a nine-file edit.
 */
export default function BrandLogo({
  /** `light` is the knocked-out version, for the dark footer. */
  tone = "dark",
  width = 170,
  height = 28,
}: {
  tone?: "dark" | "light";
  width?: number;
  height?: number;
}) {
  const lockup =
    tone === "light" ? "/assets/img/innovgeist-logo-light@2x.png" : "/assets/img/innovgeist-logo.png";
  const lockupSrcSet =
    tone === "light"
      ? "/assets/img/innovgeist-logo-light@2x.png 2x"
      : "/assets/img/innovgeist-logo.png 1x, /assets/img/innovgeist-logo@2x.png 2x";
  const markSrcSet =
    tone === "light"
      ? "/assets/img/innovgeist-mark-light@2x.png 2x"
      : "/assets/img/innovgeist-mark.png 1x, /assets/img/innovgeist-mark@2x.png 2x";

  return (
    <picture>
      {/* Below 640px the wordmark is the first thing to crowd the nav toggle out. */}
      <source media="(max-width: 640px)" srcSet={markSrcSet} />
      {/* A fixed-size logo with a hand-authored 2x srcSet; next/image would re-encode it
          for no gain. `no-img-element` does not fire inside a `<picture>`, so unlike the
          nine copies this replaced, no eslint-disable is needed. */}
      <img
        src={lockup}
        srcSet={lockupSrcSet}
        alt="Innovgeist"
        width={width}
        height={height}
        decoding="async"
      />
    </picture>
  );
}
