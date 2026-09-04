"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const AUTOPLAY_MS = 7000;

export interface Slide {
  /** Used for the slide's own `aria-label` and for its dot's. */
  label: string;
  body: ReactNode;
}

export default function AudienceCarousel({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const go = useCallback(
    (next: number, stop = false) => {
      setIndex(((next % slides.length) + slides.length) % slides.length);
      if (stop) setPlaying(false);
    },
    [slides.length],
  );

  /**
   * Autoplay runs only while the carousel is actually on screen — there is no reason to
   * wake a timer for a component three viewports down, and it is the difference between
   * an idle tab costing nothing and costing a re-render every seven seconds.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !("IntersectionObserver" in window)) {
      setPlaying(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setPlaying(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || reduceMotion) return;
    const timer = setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [playing, reduceMotion, index, go]);

  // Horizontal swipe. Mostly-vertical drags are ignored so the page still scrolls.
  const touch = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      ref={rootRef}
      className="carousel"
      data-carousel=""
      aria-roledescription="carousel"
      aria-label="What each audience gains from AI"
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          go(index + 1, true);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          go(index - 1, true);
        }
      }}
      // Hovering or tabbing in shouldn't yank the card out from under you.
      onMouseEnter={() => setPlaying(false)}
      onMouseLeave={() => setPlaying(true)}
      onFocus={() => setPlaying(false)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPlaying(true);
      }}
      onTouchStart={(event) => {
        touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        setPlaying(false);
      }}
      onTouchEnd={(event) => {
        const start = touch.current;
        touch.current = null;
        setPlaying(true);
        if (!start) return;
        const dx = event.changedTouches[0].clientX - start.x;
        const dy = event.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      <div className="carousel__head">
        <div>
          <p className="carousel__kicker">Practical outcomes</p>
          <h2 className="carousel__title">What AI changes for each audience</h2>
        </div>
        <div className="carousel__nav">
          <button
            className="carousel__btn"
            type="button"
            data-carousel-prev=""
            aria-label="Previous audience"
            onClick={() => go(index - 1, true)}
          >
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            className="carousel__btn"
            type="button"
            data-carousel-next=""
            aria-label="Next audience"
            onClick={() => go(index + 1, true)}
          >
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="carousel__viewport">
        <ul
          className="carousel__track"
          data-carousel-track=""
          style={{ transform: `translateX(${-100 * index}%)` }}
        >
          {slides.map((slide, i) => (
            <li
              key={slide.label}
              className="carousel__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length} — ${slide.label}`}
              /**
               * ⚠️ `inert`, NOT a manual tabIndex sweep. Off-screen slides must leave both
               * the tab order and the accessibility tree; `inert` does both for the whole
               * subtree in one declarative prop, where walking descendants setting
               * `tabIndex = -1` misses anything with a `tabindex` of its own.
               */
              inert={i !== index}
            >
              {slide.body}
            </li>
          ))}
        </ul>
      </div>

      <div className="carousel__foot">
        <div className="carousel__dots" data-carousel-dots="">
          {slides.map((slide, i) => (
            <button
              key={slide.label}
              type="button"
              className="carousel__dot"
              aria-label={`Show ${slide.label}`}
              aria-current={i === index}
              onClick={() => go(i, true)}
            />
          ))}
        </div>
        <a className="carousel__more" href="#programs">
          Compare all tracks
          <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
