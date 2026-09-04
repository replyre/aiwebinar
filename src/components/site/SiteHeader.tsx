"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const NAV_LINKS = [
  { href: "#challenges", label: "The Gap" },
  { href: "#programs", label: "Programs" },
  { href: "#architecture", label: "Readiness Model" },
  { href: "#trainer", label: "Trainer" },
  { href: "#proof", label: "Proof of Work" },
  { href: "#faq", label: "FAQ" },
];

export interface NavCourse {
  slug: string;
  title: string;
  audience: string;
  priceLabel: string;
  startsLabel: string | null;
}

/** Must match the mobile-navigation breakpoint in `styles/site.css`. */
const MOBILE_NAV_MAX = 1120;

export default function SiteHeader({ courses = [] }: { courses?: NavCourse[] }) {
  const [stuck, setStuck] = useState(false);
  const [open, setOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const coursesRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * ⚠️ THE CLOSE IS DELAYED, THE OPEN IS NOT. Between the "Courses" link and the panel below
   * it there is a gap the pointer crosses, and closing on `mouseleave` immediately makes the
   * menu vanish mid-reach — the single most common way a hover menu becomes unusable. A
   * short grace period covers the crossing without feeling sticky.
   */
  const openCourses = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setCoursesOpen(true);
  };
  const closeCourses = (delay = 180) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setCoursesOpen(false), delay);
  };

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    if (!coursesOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCoursesOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [coursesOpen]);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const isMobile = () =>
      window.matchMedia(`(max-width: ${MOBILE_NAV_MAX}px)`).matches;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    // A tap outside closes the menu — but the toggle owns its own click, so
    // excluding it here stops open-then-immediately-close.
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (navRef.current?.contains(target) || toggleRef.current?.contains(target)) return;
      setOpen(false);
    };

    // Crossing the breakpoint with the menu open leaves the desktop nav in a
    // state its CSS has no rule for.
    const onResize = () => {
      if (!isMobile()) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header className={`site-header${stuck ? " is-stuck" : ""}`} data-header="">
      <div className="container header__inner">
        <a className="header__brand" href="#top" aria-label="Innovgeist — home">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size logo with a
              hand-authored 2x srcSet; next/image would re-encode it for no gain. */}
          <img
            src="/assets/img/innovgeist-logo.png"
            srcSet="/assets/img/innovgeist-logo.png 1x, /assets/img/innovgeist-logo@2x.png 2x"
            alt="Innovgeist"
            width="170"
            height="28"
            decoding="async"
          />
        </a>

        <nav
          ref={navRef}
          className={`header__nav${open ? " is-open" : ""}`}
          id="primary-nav"
          aria-label="Primary"
          onClick={(event) => {
            // Follow the anchor, then get out of the way on mobile.
            const link = (event.target as HTMLElement).closest("a");
            if (link && window.matchMedia(`(max-width: ${MOBILE_NAV_MAX}px)`).matches) {
              setOpen(false);
            }
          }}
        >
          <ul className="nav-list">
            {/**
             * Courses sits first: it is the only item that leaves this page, and the only
             * one with something to sell.
             *
             * ⚠️ THE LINK WORKS WITHOUT THE HOVER. The panel is an enhancement — the item
             * itself navigates to /course, so touch, keyboard and a failed hydration all
             * still reach the catalogue. A dropdown that is the *only* way in is a
             * dropdown that strands phone users.
             */}
            <li
              className={`nav-courses${coursesOpen ? " is-open" : ""}`}
              ref={coursesRef}
              onMouseEnter={courses.length ? openCourses : undefined}
              onMouseLeave={courses.length ? () => closeCourses() : undefined}
            >
              <Link
                href="/course"
                aria-expanded={courses.length ? coursesOpen : undefined}
                onFocus={courses.length ? openCourses : undefined}
                onClick={() => setOpen(false)}
              >
                Courses
                {courses.length ? (
                  <svg className="icon icon--sm nav-courses__chev" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                ) : null}
              </Link>

              {courses.length ? (
                <div
                  className="nav-menu"
                  onMouseEnter={openCourses}
                  onMouseLeave={() => closeCourses()}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) closeCourses(0);
                  }}
                >
                  <p className="nav-menu__k">Open now</p>
                  <ul>
                    {courses.map((course) => (
                      <li key={course.slug}>
                        <Link href={`/course/${course.slug}`} onClick={() => setOpen(false)}>
                          <strong>{course.title}</strong>
                          <span>
                            {course.audience}
                            {course.startsLabel ? ` · starts ${course.startsLabel}` : ""}
                          </span>
                          <em>{course.priceLabel}</em>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link className="nav-menu__all" href="/course" onClick={() => setOpen(false)}>
                    See all courses
                    <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ) : null}
            </li>

            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
          <div className="header__nav-cta">
            <Link className="btn btn--ghost btn--sm" href="/account" onClick={() => setOpen(false)}>
              My account
            </Link>
            <a className="btn btn--primary btn--sm" href="#contact">
              Book a Discussion
            </a>
          </div>
        </nav>

        {/* The menu/close glyphs are swapped by CSS off `aria-expanded`. */}
        <button
          ref={toggleRef}
          className="header__toggle"
          type="button"
          data-nav-toggle=""
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((was) => !was)}
        >
          <svg className="icon" data-icon-menu="" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
          <svg className="icon" data-icon-close="" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    </header>
  );
}
