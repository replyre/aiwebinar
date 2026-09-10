"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QuickAccountCreate from "@/components/account/QuickAccountCreate";

/**
 * The password step, as a box that cannot be dismissed.
 *
 * ⚠️ IT IS ONLY EVER RENDERED OVER A *PAID* CONFIRMATION. Blocking a guardian whose payment
 * is pending or failed would put an unskippable form between them and the retry button —
 * the one control that page exists to offer. The caller makes that call; this component
 * assumes the seat is already bought and the only thing left is a way back in.
 *
 * ⚠️ NO CLOSE BUTTON, NO BACKDROP CLICK, NO ESCAPE — deliberately, and this is the whole
 * difference from `EnrolModal`. Every exit an ordinary modal offers is an exit into a page
 * that will show the same box again on the next visit, so offering one only teaches the
 * habit of dismissing it. The single way out is to set the password.
 *
 * ⚠️ IT IS A COURTESY GATE, NOT AN ACCESS CONTROL. The confirmation page underneath is
 * fully rendered and anyone with devtools can remove this element. That is fine — the page
 * is reachable only from a 24-character random reference the guardian already holds, and
 * nothing here is protecting it. This box exists so a parent who paid does not lose the
 * only route to their enrolment, not to keep anybody out.
 */

export default function SetPasswordGate({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [created, setCreated] = useState(false);

  useEffect(() => {
    if (created) return;

    document.body.classList.add("is-locked");

    /**
     * The password field, not a close button — `EnrolModal` deliberately focuses its close
     * button so an uninvited box does not throw up a phone keyboard, and the reasoning
     * inverts here: this box *is* the task, it was invited by the payment that just went
     * through, and there is nothing else on the page to reach.
     */
    panelRef.current?.querySelector<HTMLInputElement>("input")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      // Escape is swallowed rather than ignored: left alone it would close the box in any
      // browser that treats the panel as a dialog, and reach the page behind in the rest.
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
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

      /**
       * ⚠️ THE "FOCUS IS NOWHERE" CASE IS THE ONE THAT ACTUALLY LEAKS, and wrapping the
       * two ends is not enough to catch it. Clicking the backdrop — the thing a guardian
       * tries first on a box with no close button — blurs to `<body>`, which is neither
       * the first item nor the last, so both branches below decline and the browser hands
       * the next Tab to the header link *behind* the overlay. From there the whole page is
       * reachable by keyboard while it is visually blocked and inert to the mouse.
       */
      if (!panelRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.classList.remove("is-locked");
    };
  }, [created]);

  /**
   * ⚠️ THE BOX CLOSES ON THE CLIENT FIRST AND REFRESHES SECOND, NOT THE OTHER WAY ROUND.
   * `router.refresh()` is a round trip to the server, and gating the close on it would hold
   * a guardian inside an unclosable box for as long as that takes — or permanently, if the
   * connection has dropped between paying and now. Closing immediately is safe: the refresh
   * only has to agree, and when it lands the server has already stopped rendering this.
   */
  if (created) return null;

  return (
    <div className="gate">
      {/* `mousedown` is where focus is lost, so that is where it is refused — by the time
          a click fires the caret has already left the field. Without this, clicking the
          backdrop blurs to `<body>` and the guardian's next keystroke goes nowhere. */}
      <div className="gate__backdrop" onMouseDown={(event) => event.preventDefault()} />

      <div
        ref={panelRef}
        className="gate__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-title"
      >
        {/* The navy band carries the same weight as `EnrolModal`'s aside — it is what makes
            this read as part of the site rather than a browser prompt. */}
        <div className="gate__head">
          {/**
           * A window with the enrolment ticked inside it, not a padlock.
           *
           * ⚠️ THE ICON IS READ AS THE REASON THE BOX IS THERE, so a padlock was answering
           * the wrong question. It says "you are locked out" — the register of a login wall
           * or a security warning — to somebody who has just successfully paid and has done
           * nothing suspicious. What is actually being offered is a place online where this
           * enrolment keeps existing after the tab closes, which is what the heading says
           * too. The window frame is that place; the tick is the seat already in it.
           */}
          <div className="gate__mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2.5" />
              {/* The title bar. It is what makes the rectangle read as a window rather
                  than a plain box or a card. */}
              <path d="M3 9h18" />
              <path d="M8.5 14.25l2.25 2.25 4.75-5" />
            </svg>
          </div>
          <p className="eyebrow eyebrow--onDark">Enrollment confirmed</p>
          <h2 className="gate__title" id="gate-title">
            Track this online
          </h2>
        </div>

        <div className="gate__body">
          <QuickAccountCreate
            fullName={fullName}
            email={email}
            onCreated={() => {
              setCreated(true);
              router.refresh();
            }}
          />
        </div>
      </div>
    </div>
  );
}
