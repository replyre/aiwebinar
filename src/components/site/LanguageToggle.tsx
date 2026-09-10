"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * EN / हिं for the whole site, on top of Google's website translator.
 *
 * ⚠️ NO API KEY AND NO PER-PAGE WORK. This is the free `translate_a/element.js` widget, not
 * the paid Cloud Translation API — it walks the rendered DOM and swaps the text in place, so
 * every page, including ones added later, is covered without a translation file or a `[lang]`
 * route segment. The trade is that the output is machine translation of whatever is on
 * screen; nobody has approved the Hindi wording.
 *
 * ⚠️ GOOGLE'S OWN UI IS SUPPRESSED IN CSS AND THIS IS THE ONLY CONTROL. The widget renders a
 * `<select>` and a banner across the top of the page that shifts `body { top }` and looks
 * nothing like the site. Both are hidden in `styles/site.css`; the buttons below drive that
 * hidden `<select>` directly.
 */

const LANGUAGES = [
  { code: "en", label: "EN", name: "English" },
  { code: "hi", label: "हिं", name: "हिन्दी" },
] as const;

type LanguageCode = (typeof LANGUAGES)[number]["code"];

/** The element the widget mounts its own `<select>` into. */
const MOUNT_ID = "google_translate_element";
/** The `<script>` tag itself — kept distinct from `MOUNT_ID` so the "already loaded?" check
 *  below tests for the script and not for this component's own markup. */
const SCRIPT_ID = "google-translate-script";
const COOKIE = "googtrans";

/**
 * ⚠️ THE COOKIE IS WHAT SURVIVES A NAVIGATION, NOT THE `<select>`. Every route change tears
 * the widget down and builds it again from scratch, and the only thing it reads on the way
 * up is `googtrans`. Drive the select without writing this and Hindi lasts exactly until the
 * guardian clicks a link.
 *
 * Written to three scopes because Google reads whichever the browser sends first and the
 * host differs between `localhost`, the Vercel preview, and the apex domain. Setting one
 * that does not match leaves the value invisible to the widget with no error.
 */
function cookieDomains(): string[] {
  const { hostname } = window.location;
  // An IP or `localhost` cannot take a dotted domain attribute; it is rejected silently.
  if (hostname === "localhost" || /^[\d.]+$/.test(hostname)) return [""];
  return ["", `; domain=${hostname}`, `; domain=.${hostname}`];
}

function writeCookie(value: string | null): void {
  for (const domain of cookieDomains()) {
    document.cookie = value
      ? `${COOKIE}=${value}; path=/${domain}`
      : `${COOKIE}=; path=/${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

/** `googtrans` is `/<from>/<to>`; the tail is the language actually on screen. */
function readCookie(): LanguageCode {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  const target = match ? decodeURIComponent(match[1]).split("/")[2] : "";
  return target === "hi" ? "hi" : "en";
}

export default function LanguageToggle() {
  /**
   * Always "en" for the server render. The real answer lives in a cookie this component
   * cannot read until it is mounted, and guessing on the server would mean two different
   * buttons marked current between the HTML and the first paint — a hydration mismatch on
   * every translated page load.
   */
  const [active, setActive] = useState<LanguageCode>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setActive(readCookie());

    if (document.getElementById(SCRIPT_ID)) {
      setReady(true);
      return;
    }

    /**
     * ⚠️ THIS PATCH IS LOAD-BEARING, NOT DEFENSIVE TIDYING.
     *
     * Google replaces React's text nodes with its own `<font>` elements. React still holds
     * references to the originals, so the next time a client component re-renders — the
     * enrolment modal opening, a form showing an error — it calls `removeChild` on a node
     * whose parent is now something Google inserted, and the page dies with
     * `NotFoundError: Failed to execute 'removeChild' on 'Node'`. Nothing recovers it; the
     * guardian gets a blank screen mid-checkout.
     *
     * Making the two mutation methods no-op when the node is not actually a child turns a
     * fatal DOM exception back into the harmless situation it describes. It is a well-worn
     * workaround for exactly this widget, and the cost is that a genuine React bug of the
     * same shape would now pass silently.
     */
    if (!(window as unknown as { __gtPatched?: boolean }).__gtPatched) {
      (window as unknown as { __gtPatched?: boolean }).__gtPatched = true;
      const { removeChild, insertBefore } = Node.prototype;
      Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
        if (child.parentNode !== this) return child;
        return removeChild.call(this, child) as T;
      };
      Node.prototype.insertBefore = function <T extends Node>(
        this: Node,
        node: T,
        reference: Node | null,
      ): T {
        if (reference && reference.parentNode !== this) return node;
        return insertBefore.call(this, node, reference) as T;
      };
    }

    (window as unknown as { googleTranslateElementInit?: () => void }).googleTranslateElementInit =
      () => {
        const google = (window as unknown as {
          google?: {
            translate?: {
              TranslateElement: new (options: Record<string, unknown>, element: string) => void;
            };
          };
        }).google;
        if (!google?.translate) return;
        new google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,hi",
            // Without this the widget decides on its own that a Hindi-locale browser wants
            // the page translated and does it unasked, before anybody touches the toggle.
            autoDisplay: false,
          },
          MOUNT_ID,
        );
        setReady(true);
      };

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const choose = useCallback((code: LanguageCode) => {
    writeCookie(code === "en" ? null : `/en/${code}`);
    setActive(code);

    const select = document.querySelector<HTMLSelectElement>("select.goog-te-combo");
    const option = select && Array.from(select.options).some((o) => o.value === code);

    /**
     * The reload is the fallback, not the plan. Driving the select re-translates in place
     * and keeps the guardian's scroll position and any half-filled form; a reload is only
     * right when the widget has not finished loading, or when it never offered the option
     * we need — and on a slow connection that is a real state, not a theoretical one.
     */
    if (select && option) {
      select.value = code;
      select.dispatchEvent(new Event("change"));
      return;
    }
    window.location.reload();
  }, []);

  return (
    <>
      {/* Where the widget mounts its own select. Hidden, never interacted with directly. */}
      <div id={MOUNT_ID} aria-hidden="true" />

      <div className="lang" role="group" aria-label="Language">
        {LANGUAGES.map((language) => (
          <button
            key={language.code}
            className={`lang__btn${active === language.code ? " is-active" : ""}`}
            type="button"
            lang={language.code}
            aria-label={language.name}
            aria-pressed={active === language.code}
            // Until the widget answers, a click can only reload the page — which on a slow
            // connection looks like the button broke the site.
            disabled={!ready}
            onClick={() => choose(language.code)}
          >
            {language.label}
          </button>
        ))}
      </div>
    </>
  );
}
