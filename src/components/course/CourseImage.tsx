import type { CourseImage as CourseImageData } from "@/lib/course";

/**
 * A course image with its WebP and JPEG renditions.
 *
 * ⚠️ PLAIN `<picture>`, NOT `next/image`. The renditions are pre-generated at build time by
 * `scripts/build-course-images.mjs` (1.6 MB PNG → 35 KB WebP), and the same component has to
 * render Cloudinary URLs, which are already transformed on their side. `next/image` would
 * either re-optimise something already optimised or refuse the remote host without extra
 * config — `<picture>` handles both sources identically.
 *
 * `width`/`height` are always emitted so the browser reserves the box before the bytes
 * arrive. Without them this banner — the largest thing above the fold — shifts the page as
 * it loads.
 */
export default function CourseImage({
  image,
  sizes,
  priority = false,
  className,
}: {
  image: CourseImageData;
  sizes: string;
  /** True for the above-the-fold banner: eager, high priority, no lazy attribute. */
  priority?: boolean;
  className?: string;
}) {
  return (
    <picture>
      {image.webpSrcSet ? (
        <source type="image/webp" srcSet={image.webpSrcSet} sizes={sizes} />
      ) : null}
      <img
        className={className}
        src={image.src}
        {...(image.srcSet ? { srcSet: image.srcSet, sizes } : {})}
        alt={image.alt}
        width={image.width}
        height={image.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </picture>
  );
}
