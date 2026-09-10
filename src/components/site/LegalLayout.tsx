import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";
import { LEGAL_LINKS, POLICY_UPDATED } from "@/lib/legal";

/**
 * Shared chrome for the six policy pages.
 *
 * ⚠️ THE SIBLING LINKS AT THE FOOT ARE NOT DECORATION. Razorpay's website review wants all
 * six pages reachable, and a reviewer who lands on one policy page from a support ticket
 * should be one click from the other five. Cross-linking them here means adding a page to
 * `LEGAL_LINKS` wires it into all of them at once.
 */
export default function LegalLayout({
  title,
  lede,
  updated = true,
  children,
}: {
  title: string;
  lede?: string;
  /** Contact and About are statements of fact, not policies, so they carry no version. */
  updated?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="course-bar">
        <div className="container course-bar__inner">
          <Link className="course-bar__brand" href="/" aria-label="Innovgeist — home">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size logo. */}
            <img
              src="/assets/img/innovgeist-logo.png"
              srcSet="/assets/img/innovgeist-logo.png 1x, /assets/img/innovgeist-logo@2x.png 2x"
              alt="Innovgeist"
              width="150"
              height="25"
              decoding="async"
            />
          </Link>
          <div className="course-bar__right">
            <Link className="btn btn--ghost btn--sm" href="/course">
              Courses
            </Link>
            <Link className="btn btn--ghost btn--sm" href="/#contact">
              For institutions
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="legal-hero">
          <div className="container">
            <h1 className="legal-hero__title">{title}</h1>
            {lede ? <p className="legal-hero__lede">{lede}</p> : null}
            {updated ? <p className="legal-hero__meta">Last updated {POLICY_UPDATED}</p> : null}
          </div>
        </section>

        <section className="section legal-body">
          <div className="container">
            <div className="legal">{children}</div>

            <nav className="legal-links" aria-label="Policies">
              {LEGAL_LINKS.map((link) => (
                <Link key={link.href} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
