"use client";

import { useEffect, useState } from "react";

/**
 * The join bar pinned to the bottom of the screen.
 *
 * ⚠️ HIDDEN WHILE EITHER FULL-SIZE BUTTON IS ON SCREEN, AND THAT IS THE POINT OF IT. At the
 * top of the page the hero button is already in the thumb's reach; a second green button
 * under it reads as clutter and splits the tap. At the bottom, the final CTA does the same
 * job. So the bar exists exactly for the long middle of the page, where there would
 * otherwise be no way to act without scrolling. It also stands down over the footer, so
 * it never covers the legal links (and the footer needs no padding to make room for it).
 *
 * Observing the two buttons by id keeps them plain server-rendered links — this component
 * owns no copy and no hrefs of its own beyond what the page hands it.
 */
export default function StickyJoinBar({
  title,
  meta,
  children,
}: {
  title: string;
  meta: string;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const targets = ["wb-hero-cta", "wb-final-cta", "wb-foot"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (!targets.length || !("IntersectionObserver" in window)) return;

    // The observer's first callback reports every target at once, so the bar stays hidden
    // (the initial state) until there is a real answer — never a flash on first paint.
    const onScreen = new Set<Element>();

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setShown(onScreen.size === 0);
    });

    for (const el of targets) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`wb-sticky${shown ? " is-shown" : ""}`} aria-hidden={!shown} inert={!shown}>
      <div className="wb-sticky__inner">
        <div className="wb-sticky__text">
          <p className="wb-sticky__title">{title}</p>
          <p className="wb-sticky__meta">{meta}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
