"use client";

import { useRef, useState, type ReactNode } from "react";

export interface Layer {
  /** Numeric stem for the `layer-*` id the button's `aria-controls` points at. */
  id: string;
  head: ReactNode;
  body: ReactNode;
}

/**
 * The readiness stack: an accordion where exactly one panel is open.
 *
 * ⚠️ OPEN STATE IS A `data-open` ATTRIBUTE, NOT A CLASS, AND THAT IS NOT A STYLE CHOICE.
 * These panels also carry `data-reveal`, and `ScrollEffects` reveals them by reaching into
 * the DOM and calling `classList.add("is-visible")` — a write React knows nothing about.
 * The moment React re-rendered a `className` of its own here it overwrote that class, and
 * `.js [data-reveal] { opacity: 0 }` took over: clicking a layer made the entire accordion
 * vanish. So `className` on the revealed element is a constant string React will never
 * rewrite, and everything stateful moves to an attribute it can own outright.
 *
 * The same trap is waiting for any client component that puts a computed `className` on a
 * `[data-reveal]` element. Put the animation on a wrapper, or drive the state from a
 * `data-*` attribute as here.
 *
 * Behaviour: one panel at a time (four open at once is unreadable on a phone), the last
 * layer — the foundation — starts open so the section never greets a visitor as a row of
 * inert bars, and selecting always opens rather than toggling, so a click can only ever
 * move which panel is open and never leave the stack empty.
 */
export default function LayerStack({ layers }: { layers: Layer[] }) {
  const [open, setOpen] = useState(layers.length - 1);
  const headers = useRef<(HTMLButtonElement | null)[]>([]);

  /** Arrow keys walk the headers, Home/End jump to the ends — the usual accordion contract. */
  const onKeyDown = (event: React.KeyboardEvent, i: number) => {
    const last = layers.length - 1;
    const to =
      event.key === "ArrowDown" ? (i === last ? 0 : i + 1)
      : event.key === "ArrowUp" ? (i === 0 ? last : i - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;

    if (to === null) return;
    event.preventDefault();
    headers.current[to]?.focus();
  };

  return (
    <div className="layers" data-layers="">
      {layers.map((layer, i) => (
        <div key={layer.id} className="layer" data-open={i === open} data-reveal="">
          <button
            ref={(el) => {
              headers.current[i] = el;
            }}
            className="layer__btn"
            type="button"
            aria-expanded={i === open}
            aria-controls={`layer-${layer.id}`}
            onClick={() => setOpen(i)}
            onKeyDown={(event) => onKeyDown(event, i)}
          >
            {layer.head}
            <svg className="icon layer__chev" aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <div
            className="layer__body"
            id={`layer-${layer.id}`}
            role="region"
            // A collapsed panel is decoration, not content: keep it out of the tab order
            // and out of the accessibility tree rather than merely invisible.
            inert={i !== open}
          >
            <div className="layer__inner">{layer.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
