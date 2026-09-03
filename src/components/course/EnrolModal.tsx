"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * The enrolment invitation — context on the left, the full form on the right.
 *
 * ⚠️ IT OPENS ONCE PER SESSION, NOT ONCE PER PAGE VIEW. `sessionStorage` rather than
 * `localStorage`: somebody who came back a month later has not seen this recently and should
 * get it again, but nobody should meet it twice in one sitting. Reading and writing are both
 * wrapped, because private mode throws on both.
 *
 * ⚠️ IT CANCELS ITSELF IF THE VISITOR IS ALREADY ENROLLING. The same form is on the page
 * below; interrupting somebody who has started filling it in — to show them the identical
 * fields in a box — is the worst moment this component has. Any focus inside a form on the
 * page kills the timer for the session.
 */

const SEEN_KEY_PREFIX = "ig_enrol_seen:";
const OPEN_AFTER_MS = 6000;

export default function EnrolModal({
  courseSlug,
  title,
  subtitle,
  priceLabel,
  batchLabel,
  bullets,
  facts,
  proof,
  weeks,
  children,
}: {
  /** Keyed per course, so seeing one course's invitation doesn't suppress another's. */
  courseSlug: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  batchLabel: string | null;
  /** What the student keeps. Kept short — this is a side panel, not the page. */
  bullets: string[];
  /** Format, audience, commitment: the one-line facts a parent scans for. */
  facts: string[];
  /** The before/after headline. Omitted when the course has no measured claim. */
  proof: { before: string; after: string } | null;
  weeks: number;
  /** The enrolment form. Passed in so the server renders it and this only owns open/closed. */
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const key = `${SEEN_KEY_PREFIX}${courseSlug}`;

  const seen = useCallback(() => {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  }, [key]);

  const remember = useCallback(() => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode — the invitation just repeats */
    }
  }, [key]);

  useEffect(() => {
    if (seen()) return;

    const timer = setTimeout(() => {
      // Re-checked at fire time: the visitor may have touched the inline form in the
      // meantime, which sets the flag below.
      if (seen()) return;
      lastFocused.current = document.activeElement as HTMLElement | null;
      remember();
      setOpen(true);
    }, OPEN_AFTER_MS);

    const forms = Array.from(document.querySelectorAll("form.course-form"));
    const onFocusIn = () => {
      clearTimeout(timer);
      remember();
    };
    for (const form of forms) form.addEventListener("focusin", onFocusIn);

    return () => {
      clearTimeout(timer);
      for (const form of forms) form.removeEventListener("focusin", onFocusIn);
    };
  }, [seen, remember]);

  useEffect(() => {
    if (!open) return;

    document.body.classList.add("is-locked");
    // The close button, not the first field: landing a caret in a text input on a box
    // nobody asked for opens the keyboard on a phone unbidden.
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      const items = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled]), select, textarea",
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
    <div className="enrol-modal">
      <div className="enrol-modal__backdrop" onClick={() => setOpen(false)} />

      <div
        ref={panelRef}
        className="enrol-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="enrol-modal-title"
      >
        <button
          ref={closeRef}
          className="enrol-modal__close"
          type="button"
          aria-label="Close"
          onClick={() => setOpen(false)}
        >
          <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>

        <aside className="enrol-modal__aside">
          <p className="eyebrow eyebrow--onDark">Enroll</p>
          <h2 className="enrol-modal__title" id="enrol-modal-title">
            {title}
          </h2>
          <p className="enrol-modal__sub">{subtitle}</p>

          {/**
           * The measured result leads on this side. It is the strongest thing in the whole
           * offer, and somebody who has just been handed a nine-field form needs a reason
           * to start filling it in — not a restatement of the course title.
           */}
          {proof ? (
            <div className="enrol-modal__proof">
              <p className="enrol-modal__proof-k">What changes in {weeks} weeks</p>
              <p className="enrol-modal__proof-v">
                <span>{proof.before}</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
                <strong>{proof.after}</strong>
              </p>
              <p className="enrol-modal__proof-note">
                On their own weakest subject, measured by the same test.
              </p>
            </div>
          ) : null}

          {bullets.length ? (
            <>
              <p className="enrol-modal__k">What they keep</p>
              <ul className="enrol-modal__list">
                {bullets.map((bullet) => (
                  <li key={bullet}>
                    <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {bullet}
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {facts.length ? (
            <ul className="enrol-modal__facts">
              {facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          ) : null}

          <div className="enrol-modal__foot">
            <p className="enrol-modal__price">
              <span>Fee</span>
              <strong>{priceLabel}</strong>
            </p>
            {batchLabel ? <p className="enrol-modal__batch">{batchLabel}</p> : null}
          </div>
        </aside>

        {/* The form itself — server-rendered and handed down, so this component owns
            nothing but whether the box is open. */}
        <div className="enrol-modal__main">{children}</div>
      </div>
    </div>
  );
}
