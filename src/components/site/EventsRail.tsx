"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface RailEvent {
  slug: string;
  cardTitle: string;
  role: string;
  format: string;
  dateLabel: string;
  summary: string;
  location: string;
  crest?: string;
  cover: { src: string; srcSet: string; webpSrcSet: string; alt: string; width: number; height: number };
  photoCount: number;
}

/**
 * The events rail: what we have actually done, in the room, with a link into the full
 * record of each one.
 *
 * ⚠️ NATIVE SCROLL-SNAP, NOT A `translateX` TRACK LIKE `AudienceCarousel`. That component
 * shows exactly one full-width slide at a time, so transforming the track by -100% per step
 * is exact. These cards are a fixed width on a canvas that runs to 1920px, which means the
 * number visible changes with the viewport and there is no single correct step size to
 * transform by. A scroll container gets that right by construction, and three things come
 * free with it: touch and trackpad swipe with real momentum, keyboard scrolling, and the
 * half-card peeking past the right edge that tells people there is more without a caption
 * saying so.
 *
 * The cost is that position is now something to *read* rather than something we own, hence
 * the scroll listener below.
 */
export default function EventsRail({ events }: { events: RailEvent[] }) {
  const railRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  /**
   * Derive which card is active, and whether either end is reached, from scroll position.
   *
   * ⚠️ THE END TEST NEEDS THE 2px SLOP. `scrollLeft` is fractional on fractional-DPR
   * displays and after a snap it lands a hair short of `scrollWidth - clientWidth`, so an
   * exact comparison leaves the "next" button live at the end of the rail forever.
   */
  const sync = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const max = rail.scrollWidth - rail.clientWidth;
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(rail.scrollLeft >= max - 2);

    const cards = Array.from(rail.children) as HTMLElement[];
    if (!cards.length) return;
    // The card whose left edge is nearest the rail's own left edge.
    const nearest = cards.reduce(
      (best, card, i) =>
        Math.abs(card.offsetLeft - rail.scrollLeft - rail.offsetLeft) < best.distance
          ? { index: i, distance: Math.abs(card.offsetLeft - rail.scrollLeft - rail.offsetLeft) }
          : best,
      { index: 0, distance: Infinity },
    );
    setActive(nearest.index);
  }, []);

  useEffect(() => {
    sync();
    const rail = railRef.current;
    if (!rail) return;
    // Resize matters as much as scroll: rotating a phone changes how many cards fit, which
    // changes whether the rail can scroll at all.
    const observer = new ResizeObserver(sync);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [sync]);

  const step = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.children[0] as HTMLElement | undefined;
    // One card plus one gap. Falls back to most of the viewport if the rail is empty.
    const gap = parseFloat(getComputedStyle(rail).columnGap || "0") || 0;
    const distance = card ? card.offsetWidth + gap : rail.clientWidth * 0.8;
    rail.scrollBy({ left: distance * direction, behavior: "smooth" });
  }, []);

  const goTo = useCallback((index: number) => {
    const rail = railRef.current;
    const card = rail?.children[index] as HTMLElement | undefined;
    if (!rail || !card) return;
    rail.scrollTo({ left: card.offsetLeft - rail.offsetLeft, behavior: "smooth" });
  }, []);

  return (
    <div className="rail" aria-roledescription="carousel" aria-label="Events Innovgeist has run">
      <ul
        className="rail__track"
        ref={railRef}
        onScroll={sync}
        tabIndex={0}
        aria-label="Events, scrollable"
      >
        {events.map((event, i) => (
          <li className="rail__item" key={event.slug}>
            <article className="ecard">
              <div className="ecard__media">
                <picture>
                  <source type="image/webp" srcSet={event.cover.webpSrcSet} sizes="(max-width: 700px) 84vw, 480px" />
                  <img
                    src={event.cover.src}
                    srcSet={event.cover.srcSet}
                    sizes="(max-width: 700px) 84vw, 480px"
                    alt={event.cover.alt}
                    width={event.cover.width}
                    height={event.cover.height}
                    loading={i === 0 ? "eager" : "lazy"}
                    decoding="async"
                  />
                </picture>
                <span className="ecard__role">{event.role}</span>
              </div>

              <div className="ecard__body">
                <p className="ecard__meta">
                  <span>{event.format}</span>
                  <span aria-hidden="true">·</span>
                  <span>{event.dateLabel}</span>
                </p>

                <h3 className="ecard__title">
                  {/* The whole card is the target; the link is stretched over it in CSS. */}
                  <Link className="ecard__link" href={`/events/${event.slug}`}>
                    {event.cardTitle}
                  </Link>
                </h3>

                <p className="ecard__where">
                  {event.crest ? (
                    <span className="ecard__crest" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size crest. */}
                      <img src={event.crest} alt="" width="28" height="26" decoding="async" loading="lazy" />
                    </span>
                  ) : (
                    <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  )}
                  {event.location}
                </p>

                <p className="ecard__summary">{event.summary}</p>

                <p className="ecard__cta">
                  See the full record
                  <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>

      <div className="rail__foot">
        <div className="rail__dots">
          {events.map((event, i) => (
            <button
              key={event.slug}
              type="button"
              className="rail__dot"
              aria-label={`Show ${event.cardTitle}`}
              aria-current={i === active}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <div className="rail__nav">
          <button
            className="rail__btn"
            type="button"
            aria-label="Previous event"
            disabled={atStart}
            onClick={() => step(-1)}
          >
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            className="rail__btn"
            type="button"
            aria-label="Next event"
            disabled={atEnd}
            onClick={() => step(1)}
          >
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
