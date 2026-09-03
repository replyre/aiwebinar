"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * `prefers-reduced-motion`, as an external store.
 *
 * ⚠️ `useSyncExternalStore`, NOT `useState` + `useEffect`. A media query IS an external
 * store, and the effect version has two real faults this does not: it renders once with a
 * wrong value before the effect corrects it (a frame of motion for someone who asked for
 * none), and React flags the synchronous `setState` in an effect as a cascading render.
 *
 * The server snapshot is `false` because the server has no media queries and a mismatch
 * between the two snapshots is a hydration error. Every caller uses this to *skip* an
 * animation, so `false` is the safe direction to be wrong in for one paint.
 */

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
