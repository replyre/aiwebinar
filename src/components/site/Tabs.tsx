"use client";

import { useRef, useState, type ReactNode } from "react";

export interface TabItem {
  /** Stem for the `tab-*` / `panel-*` id pair the ARIA wiring needs. */
  id: string;
  button: ReactNode;
  panel: ReactNode;
}

/**
 * A WAI-ARIA tablist with roving tabindex.
 *
 * ⚠️ ONLY THE SELECTED TAB IS TABBABLE. That is the pattern, not an oversight: a tablist is
 * one stop in the tab order and the arrow keys move within it. Leaving every tab at
 * `tabIndex={0}` makes a keyboard user press Tab three times to get past three tabs, and
 * ten times past ten.
 */
export default function Tabs({ label, items }: { label: string; items: TabItem[] }) {
  const [selected, setSelected] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (next: number, focus = false) => {
    const at = ((next % items.length) + items.length) % items.length;
    setSelected(at);
    if (focus) buttons.current[at]?.focus();
  };

  return (
    <div className="tabs" data-tabs="" data-reveal="">
      <div className="tabs__list" role="tablist" aria-label={label}>
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(node) => {
              buttons.current[i] = node;
            }}
            className="tabs__btn"
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-controls={`panel-${item.id}`}
            aria-selected={i === selected}
            tabIndex={i === selected ? 0 : -1}
            onClick={() => select(i)}
            onKeyDown={(event) => {
              const next =
                event.key === "ArrowRight" || event.key === "ArrowDown"
                  ? i + 1
                  : event.key === "ArrowLeft" || event.key === "ArrowUp"
                    ? i - 1
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? items.length - 1
                        : null;
              if (next === null) return;
              event.preventDefault();
              select(next, true);
            }}
          >
            {item.button}
          </button>
        ))}
      </div>

      {items.map((item, i) => (
        <div
          key={item.id}
          className="tabs__panel"
          role="tabpanel"
          id={`panel-${item.id}`}
          aria-labelledby={`tab-${item.id}`}
          tabIndex={0}
          hidden={i !== selected}
        >
          {item.panel}
        </div>
      ))}
    </div>
  );
}
