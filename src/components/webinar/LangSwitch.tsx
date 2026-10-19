"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { WEBINAR_PATH, type WebinarLang } from "@/lib/webinar";

const OPTIONS: { lang: WebinarLang; label: string; name: string }[] = [
  { lang: "en", label: "EN", name: "English" },
  { lang: "hi", label: "हिं", name: "हिन्दी" },
];

/**
 * EN | हिं for the webinar page — two real URLs, not a translation overlay.
 *
 * ⚠️ PLAIN LINKS THAT WORK WITHOUT JAVASCRIPT; THE CLICK HANDLER ONLY CARRIES THE QUERY.
 * A parent who arrives from an ad lands on `/webinar?utm_source=meta&…`. Switching language
 * on a bare `href` drops those tags, and the join click that follows is logged as traffic
 * from nowhere — the ad that earned it gets no credit. So the current query string rides
 * along. If the script has not loaded yet the link still goes to the right page; only the
 * attribution is lost, never the navigation.
 */
export default function LangSwitch({ current, label }: { current: WebinarLang; label: string }) {
  const router = useRouter();

  const carryQuery = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    router.push(`${href}${window.location.search}`);
  };

  return (
    <nav className="wb-lang" aria-label={label}>
      {OPTIONS.map((option) => {
        const active = option.lang === current;
        const href = WEBINAR_PATH[option.lang];
        return (
          <a
            key={option.lang}
            className={`wb-lang__opt${active ? " is-active" : ""}`}
            href={href}
            hrefLang={option.lang}
            lang={option.lang}
            aria-label={option.name}
            aria-current={active ? "page" : undefined}
            onClick={active ? (event) => event.preventDefault() : (event) => carryQuery(event, href)}
          >
            {option.label}
          </a>
        );
      })}
    </nav>
  );
}
