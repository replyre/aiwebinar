"use client";

import { useState, type ReactNode } from "react";

export interface Layer {
  /** Numeric stem for the `layer-*` id the button's `aria-controls` points at. */
  id: string;
  head: ReactNode;
  body: ReactNode;
}

/**
 * The readiness stack: an accordion where exactly one panel is open.
 *
 * Two behaviours worth keeping: one at a time (four open panels make the stack unreadable
 * on a phone), and the *last* layer — the foundation — starts open, so the section never
 * greets a visitor as a row of inert bars with nothing to read.
 */
export default function LayerStack({ layers }: { layers: Layer[] }) {
  const [open, setOpen] = useState(layers.length - 1);

  return (
    <div className="layers" data-layers="">
      {layers.map((layer, i) => (
        <div key={layer.id} className={`layer${i === open ? " is-open" : ""}`} data-reveal="">
          <button
            className="layer__btn"
            type="button"
            aria-expanded={i === open}
            aria-controls={`layer-${layer.id}`}
            // Clicking the open layer closes it; -1 is "none open", which is reachable
            // by choice but never by default.
            onClick={() => setOpen((was) => (was === i ? -1 : i))}
          >
            {layer.head}
            <svg className="icon layer__chev" aria-hidden="true" viewBox="0 0 24 24">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <div className="layer__body" id={`layer-${layer.id}`}>
            <div className="layer__inner">{layer.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
