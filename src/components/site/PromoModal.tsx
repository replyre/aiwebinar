"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import EnquiryForm from "@/components/site/EnquiryForm";

/** How long a visitor gets to read the page before the invitation asks for anything. */
const PROMO_DELAY_MS = 5000;

/**
 * ⚠️ `sessionStorage`, NOT `localStorage`, AND THAT IS THE WHOLE POLICY. The invitation
 * should come back on a genuine return visit — somebody who left in March and is back in
 * June has not seen it recently — but never twice in one sitting. `localStorage` would
 * silence it permanently after one dismissal, which is a different product decision than
 * the one that was made.
 */
const SEEN_KEY = "ig_promo_seen";

export default function PromoModal() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  // Private mode and storage-blocked browsers throw on read AND on write, so both sides
  // are wrapped: the invitation should still work there, it just repeats.
  const seen = () => {
    try {
      return sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return false;
    }
  };

  const remember = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* no-op */
    }
  }, []);

  useEffect(() => {
    if (seen()) return;

    const timer = setTimeout(() => {
      /**
       * ⚠️ RE-CHECKED HERE, NOT ONLY ABOVE. Someone who started filling in the contact form
       * during those five seconds has already converted; interrupting them with a modal
       * asking for the same details is the worst moment this component has. The focus
       * listener below writes the flag, and this reads it back at fire time.
       */
      if (seen()) return;
      lastFocused.current = document.activeElement as HTMLElement | null;
      remember();
      setOpen(true);
    }, PROMO_DELAY_MS);

    // Any engagement with a form on the page cancels the invitation for this session.
    const forms = Array.from(document.querySelectorAll("[data-contact-form]"));
    const onFocusIn = () => {
      clearTimeout(timer);
      remember();
    };
    for (const form of forms) form.addEventListener("focusin", onFocusIn);

    return () => {
      clearTimeout(timer);
      for (const form of forms) form.removeEventListener("focusin", onFocusIn);
    };
  }, [remember]);

  useEffect(() => {
    if (!open) return;

    document.body.classList.add("is-locked");
    // The close button, not the first input — landing the caret in a text field on a modal
    // nobody asked for is disorienting, and on a phone it opens the keyboard unbidden.
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      // Keep Tab inside the dialog while it is open.
      const items = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input, select, textarea",
        ) ?? [],
      ).filter((el) => el.offsetWidth || el.offsetHeight || el === document.activeElement);

      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("is-locked");
      lastFocused.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="promo" data-promo="">
      <div
        className="promo__backdrop"
        data-promo-close=""
        onClick={() => setOpen(false)}
      />

      <div
        ref={panelRef}
        className="promo__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-title"
      >
        <button
          ref={closeRef}
          className="promo__close"
          type="button"
          data-promo-close=""
          aria-label="Close"
          onClick={() => setOpen(false)}
        >
          <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        {/* Left: context */}
        <div className="promo__aside">
          <p className="eyebrow eyebrow--onDark">Let&rsquo;s Begin</p>
          <h2 className="promo__title" id="promo-title">Let&rsquo;s build an AI-ready institution together</h2>
          <p className="promo__lede">
            Empower your institution with practical AI literacy, responsible technology adoption
            and future-ready learning &mdash; designed by professionals who build AI every day.
          </p>
    
          <ul className="promo__list">
            <li>
              <span className="promo__ico" aria-hidden="true">
                <svg className="icon" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>
              </span>
              <div>
                <p className="promo__k">AI for Students</p>
                <p className="promo__v">Classes IX&ndash;XII &amp; Undergraduate</p>
              </div>
            </li>
            <li>
              <span className="promo__ico" aria-hidden="true">
                <svg className="icon" viewBox="0 0 24 24"><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 21 5-5 5 5" /></svg>
              </span>
              <div>
                <p className="promo__k">AI for Faculty</p>
                <p className="promo__v">Educators &amp; Academic Staff</p>
              </div>
            </li>
            <li>
              <span className="promo__ico" aria-hidden="true">
                <svg className="icon" viewBox="0 0 24 24"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /><path d="M9 14h2" /><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" /><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>
              </span>
              <div>
                <p className="promo__k">AI for Graduate Students</p>
                <p className="promo__v">Research &amp; Professional Development</p>
              </div>
            </li>
            <li>
              <span className="promo__ico" aria-hidden="true">
                <svg className="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /></svg>
              </span>
              <div>
                <p className="promo__k">Institutional AI &amp; automation</p>
                <p className="promo__v">Systems, workflows &amp; capability building</p>
              </div>
            </li>
          </ul>
    
          <dl className="promo__stats">
            <div>
              <dt>Duration</dt>
              <dd>90 minutes</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>English + Hindi</dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>Offline &middot; Interactive</dd>
            </div>
          </dl>
    
          <p className="promo__meta">
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
            Now scheduling for the 2026&ndash;27 academic year
          </p>
        </div>

        {/* Right: form */}
        <div className="promo__main">
          <EnquiryForm
            variant="compact"
            source="Invitation popup"
            // Let the confirmation be read, then get out of the way.
            onSubmitted={() => setTimeout(() => setOpen(false), 2600)}
          />

          <a
            className="btn btn--ghost btn--block promo__proposal"
            href="/assets/docs/Innovgeist-AI-Education-Partnership-Proposal.pdf"
            download
          >
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <path d="m7 10 5 5 5-5" />
              <path d="M12 15V3" />
            </svg>
            Download the full proposal (PDF)
          </a>
        </div>
      </div>
    </div>
  );
}
