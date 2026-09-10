import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SiteFooter from "@/components/site/SiteFooter";
import AuthForms from "@/components/account/AuthForms";
import { ACCOUNT_COOKIE, verifyAccountToken } from "@/lib/account-auth";
import { getAccountById } from "@/lib/accounts-server";
import { COMPANY } from "@/lib/legal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in | Innovgeist",
  robots: { index: false, follow: false },
};

/**
 * ⚠️ THE LEFT COLUMN IS NOT DECORATION, IT IS THE REASON TO SIGN IN. A bare form on white
 * asks for a password without ever saying what is behind it — and most people arriving here
 * have paid once, weeks ago, and do not remember whether they made an account at all. The
 * three lines opposite the form answer "what do I get" and "what if I never signed up",
 * which is the whole difference between a form people complete and one they abandon.
 *
 * The split mirrors the enrolment modal — context left, form right — so the two places on
 * this site that ask for credentials behave the same way.
 */
const BENEFITS = [
  {
    title: "Your courses and schedule",
    body: "Every course you have paid for, with the batch and joining link in one place.",
  },
  {
    title: "Payment status at a glance",
    body: "See what is confirmed, and finish anything that was left half-paid.",
  },
  {
    title: "The same email as checkout",
    body: "Use the email you enrolled with and your existing enrolments appear automatically.",
  },
];

export default async function AccountPage() {
  const token = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  const accountId = verifyAccountToken(token);
  /**
   * ⚠️ THE TOKEN'S SIGNATURE BEING VALID IS NOT ENOUGH — the account it names might no
   * longer exist (deleted, or a stale cookie from a wiped dev database). `/account/dashboard`
   * checks both and bounces back here on a missing account; checking only the signature here
   * would send that visitor straight back to dashboard, which sends them straight back here —
   * an infinite redirect loop between the two pages.
   */
  if (accountId && (await getAccountById(accountId))) redirect("/account/dashboard");

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
              Browse courses
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="auth">
        <div className="auth__bg" aria-hidden="true" />

        <div className="container auth__grid">
          <div className="auth__intro">
            <p className="eyebrow">My account</p>
            <h1 className="auth__title">
              See what you&rsquo;ve <em>enrolled in</em>.
            </h1>
            <p className="auth__lede">
              Sign in to find your courses, batch timings and joining links. If you have paid
              but never made an account, create one with the same email &mdash; it will find
              your enrolment.
            </p>

            <ul className="auth__benefits">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title}>
                  <span className="auth__check" aria-hidden="true">
                    <svg className="icon" viewBox="0 0 24 24">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <span>
                    <strong>{benefit.title}</strong>
                    {benefit.body}
                  </span>
                </li>
              ))}
            </ul>

            <p className="auth__aside">
              Not enrolled yet? <Link href="/course">See the courses</Link> &mdash; you do not
              need an account to sign up for one.
            </p>
          </div>

          <div className="auth__panel">
            <AuthForms />

            <p className="auth__help">
              Stuck? Email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or call{" "}
              <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
