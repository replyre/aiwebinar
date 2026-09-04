"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Native `<details>` elements, with one added rule: opening one closes the rest.
 *
 * ⚠️ LISTENERS, NOT REACT STATE, and the reason is the `toggle` event — it does NOT bubble,
 * so React's `onToggle` cannot be delegated from this container and every `<details>` would
 * have to become a client component to get one. Attaching directly keeps all twelve answers
 * server-rendered, and keeps the accordion fully working with JavaScript switched off:
 * without this component the details still open, they just do not close each other.
 */
export default function FaqAccordion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = Array.from(ref.current?.querySelectorAll("details") ?? []);

    const onToggle = (event: Event) => {
      const opened = event.target as HTMLDetailsElement;
      if (!opened.open) return;
      for (const other of items) if (other !== opened) other.open = false;
    };

    for (const item of items) item.addEventListener("toggle", onToggle);
    return () => {
      for (const item of items) item.removeEventListener("toggle", onToggle);
    };
  }, []);

  return (
    <div className="faq" data-faq="" ref={ref}>
      {children}
    </div>
  );
}
