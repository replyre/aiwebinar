"use client";

import { useEffect } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * The three enhancements that are observations *about the document*, not state belonging to
 * any one component: reveal-on-scroll, the counting stat, and which nav link is lit.
 *
 * ⚠️ THESE STAY DOM-DRIVEN ON PURPOSE. Every alternative was worse. Reveal applies to ~90
 * elements scattered across nine sections; routing that through React state would mean
 * either one context re-rendering the whole page on every intersection, or making every
 * static section a client component. The work here is "watch arbitrary nodes, toggle a
 * class" — an IntersectionObserver does that in one pass with no re-render at all.
 *
 * The markup contract is the same `data-*` hook the pre-Next site used, so the CSS
 * (`[data-reveal]`, `.is-visible`, `.is-active`) is untouched and untouchable from here.
 */
export default function ScrollEffects() {
  const reduceMotion = useReducedMotion();

  /* ------------------------------ reveal on scroll ----------------------------- */
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (!targets.length) return;

    for (const el of targets) {
      const delay = el.getAttribute("data-reveal-delay");
      if (delay) el.style.setProperty("--reveal-delay", delay);
    }

    if (reduceMotion || !("IntersectionObserver" in window)) {
      for (const el of targets) el.classList.add("is-visible");
      return;
    }

    const pending = new Set(targets);

    const show = (el: Element) => {
      el.classList.add("is-visible");
      pending.delete(el as HTMLElement);
      observer.unobserve(el);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // `top < 0` catches an element already scrolled past by the time its
          // notification is delivered.
          if (entry.isIntersecting || entry.boundingClientRect.top < 0) show(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );

    for (const el of targets) observer.observe(el);

    /**
     * ⚠️ SAFETY NET, NOT BELT-AND-BRACES. A fast flick, a scrollbar drag or an in-page
     * `#anchor` jump can carry an element from below the fold to above it with no frame in
     * between where it intersects. No notification is ever delivered and the content stays
     * invisible permanently. Sweeping what is left on scroll is the only thing that catches
     * this, and it stops listening the moment nothing is pending.
     */
    let queued = false;

    const sweep = () => {
      queued = false;
      const fold = window.innerHeight;
      for (const el of Array.from(pending)) {
        if (el.getBoundingClientRect().top < fold) show(el);
      }
      if (!pending.size) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sweep);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduceMotion]);

  /* --------------------------------- counters ---------------------------------- */
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-count-to]"));
    if (!els.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      for (const el of els) el.textContent = el.getAttribute("data-count-to") ?? "";
      return;
    }

    const frames = new Set<number>();

    const run = (el: HTMLElement) => {
      const target = Number.parseFloat(el.getAttribute("data-count-to") ?? "0") || 0;
      const duration = 1100;
      let start: number | null = null;

      const frame = (now: number) => {
        if (start === null) start = now;
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = String(Math.round(target * eased));
        if (p < 1) frames.add(requestAnimationFrame(frame));
        else el.textContent = String(target);
      };

      frames.add(requestAnimationFrame(frame));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          run(entry.target as HTMLElement);
        }
      },
      { threshold: 0.4 },
    );

    for (const el of els) observer.observe(el);

    return () => {
      observer.disconnect();
      for (const id of frames) cancelAnimationFrame(id);
    };
  }, [reduceMotion]);

  /* ------------------------------ active nav link ------------------------------ */
  useEffect(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('.nav-list a[href^="#"]'),
    );
    if (!links.length || !("IntersectionObserver" in window)) return;

    const byId = new Map<string, HTMLAnchorElement>();
    const sections: HTMLElement[] = [];

    for (const link of links) {
      const id = link.getAttribute("href")!.slice(1);
      const section = document.getElementById(id);
      if (!section) continue;
      byId.set(id, link);
      sections.push(section);
    }
    if (!sections.length) return;

    const visible: string[] = [];

    const highlight = () => {
      // Topmost visible section wins, so the marker never jitters between two
      // sections that are on screen together.
      let best: string | null = null;
      let bestTop = Number.POSITIVE_INFINITY;
      for (const id of visible) {
        const top = document.getElementById(id)!.getBoundingClientRect().top;
        if (top < bestTop) {
          bestTop = top;
          best = id;
        }
      }
      for (const link of links) link.classList.remove("is-active");
      if (best) byId.get(best)?.classList.add("is-active");
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          const at = visible.indexOf(id);
          if (entry.isIntersecting && at === -1) visible.push(id);
          else if (!entry.isIntersecting && at > -1) visible.splice(at, 1);
        }
        highlight();
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );

    for (const section of sections) observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return null;
}
