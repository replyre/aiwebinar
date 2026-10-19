"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type Phase = "done" | "typing" | "searching";

/** Milliseconds. One cycle is roughly 10s for a 30-character question. */
const TYPE_MS = 55;
const PAUSE_MS = 350;
const SEARCH_MS = 1300;
const HOLD_MS = 6500;

/**
 * Split into what a reader sees as characters.
 *
 * ⚠️ NOT `Array.from` AND NOT `.split("")`. Devanagari builds one visible letter from
 * several code points — "प्र" is प + ् + र — and typing those one at a time flashes a
 * broken half-letter on every keystroke. `Intl.Segmenter` yields grapheme clusters, so each
 * step adds a whole letter, the way a keyboard would.
 */
function graphemes(text: string): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

/**
 * The tutor card's demo: the question is typed into a search bar, a search runs, and the
 * process diagram builds itself. Then it holds, clears, and goes again.
 *
 * ⚠️ THE SERVER RENDERS THE FINISHED STATE. Full question, diagram on screen — so the card
 * is complete with JavaScript off, for crawlers, and for anyone who asked for reduced
 * motion. The cycle only starts once the panel is actually on screen, and stops (back to
 * the finished state) when it leaves, so nothing types away unseen.
 */
export default function TutorDemo({
  ask,
  steps,
  icons,
  searchIcon,
}: {
  ask: string;
  steps: string[];
  icons: React.ReactNode[];
  searchIcon: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>("done");
  const [typed, setTyped] = useState(ask);
  // Bumped on each new "done", so the diagram's CSS entrance replays every cycle.
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (reduceMotion || !el || !("IntersectionObserver" in window)) return;

    const letters = graphemes(ask);
    let timers: number[] = [];
    const clear = () => {
      for (const t of timers) window.clearTimeout(t);
      timers = [];
    };
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms));

    const run = () => {
      clear();
      setPhase("typing");
      setTyped("");
      letters.forEach((_, i) => at(PAUSE_MS + i * TYPE_MS, () => setTyped(letters.slice(0, i + 1).join(""))));
      const typedAt = PAUSE_MS + letters.length * TYPE_MS + PAUSE_MS;
      at(typedAt, () => setPhase("searching"));
      at(typedAt + SEARCH_MS, () => {
        setPhase("done");
        setCycle((c) => c + 1);
      });
      at(typedAt + SEARCH_MS + HOLD_MS, run);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run();
        } else {
          clear();
          setPhase("done");
          setTyped(ask);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      clear();
    };
  }, [ask, reduceMotion]);

  return (
    <div ref={root} className={`wb-demo wb-demo--tutor is-${phase}`} aria-hidden="true">
      <p className="wb-topic">
        <span className="wb-topic__icon">
          {searchIcon}
          <span className="wb-spinner" />
        </span>
        <span className="wb-topic__text">
          {typed}
          <span className="wb-caret" />
        </span>
      </p>

      <div className="wb-flow-wrap">
        <ol className="wb-flow" key={cycle}>
          {steps.map((step, i) => (
            <li key={step} style={{ "--i": i } as React.CSSProperties}>
              <span className="wb-flow__icon">{icons[i]}</span>
              <span className="wb-flow__text">{step}</span>
            </li>
          ))}
        </ol>
        {/* What the search "returns" while it runs: placeholder rows, not a spinner wall. */}
        <div className="wb-skeleton">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}
