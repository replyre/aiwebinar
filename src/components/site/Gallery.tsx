"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface Viewing {
  src: string;
  alt: string;
  caption: string;
}

/**
 * The proof-of-work gallery and its lightbox.
 *
 * ⚠️ THE THUMBNAILS ARE `children`, NOT PROPS, on purpose. Each one is a `<picture>` with two
 * hand-tuned `srcSet`/`sizes` pairs (WebP and JPEG, 800w and 1504w) — the whole point of
 * which is to serve a phone the small file. Rebuilding that from props would mean either
 * re-deriving those breakpoints here or shipping the markup to the client; passing it
 * through keeps it server-rendered and byte-identical.
 *
 * The click is delegated because `click` bubbles and `data-full` / `data-caption` already
 * live on the buttons — so the trigger needs no per-thumbnail wiring, while the *lightbox*
 * itself is ordinary React state.
 */
export default function Gallery({ children }: { children: ReactNode }) {
  const [viewing, setViewing] = useState<Viewing | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!viewing) return;

    document.body.classList.add("is-locked");
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setViewing(null);
      // The close button is the only focusable thing inside, so Tab stays on it
      // rather than escaping to the page behind the backdrop.
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("is-locked");
      lastFocused.current?.focus();
    };
  }, [viewing]);

  return (
    <>
      <ul
        className="gallery"
        data-gallery=""
        onClick={(event) => {
          const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
            ".gallery__btn",
          );
          if (!button) return;
          const thumb = button.querySelector("img");
          lastFocused.current = button;
          setViewing({
            src: button.dataset.full || thumb?.src || "",
            alt: thumb?.alt || "",
            caption: button.dataset.caption || "",
          });
        }}
      >
        {children}
      </ul>

      {viewing ? (
        <div className="lightbox" data-lightbox="">
          <div
            className="lightbox__backdrop"
            data-lightbox-close=""
            onClick={() => setViewing(null)}
          />
          <div
            className="lightbox__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Photo viewer"
          >
            <button
              ref={closeRef}
              className="lightbox__close"
              type="button"
              data-lightbox-close=""
              aria-label="Close photo viewer"
              onClick={() => setViewing(null)}
            >
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element -- the source is a
                data-full URL read off the clicked thumbnail at runtime, not a build-time
                import, so next/image has nothing to optimise. */}
            <img
              className="lightbox__img"
              data-lightbox-img=""
              src={viewing.src}
              alt={viewing.alt}
            />
            <p className="lightbox__caption" data-lightbox-caption="">
              {viewing.caption}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
