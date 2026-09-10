import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/site/SiteFooter";
import CourseImage from "@/components/course/CourseImage";
import MentorCard from "@/components/account/MentorCard";
import PayNowButton from "@/components/course/PayNowButton";
import QuickAccountCreate from "@/components/account/QuickAccountCreate";
import SetPasswordGate from "@/components/account/SetPasswordGate";
import { ACCOUNT_COOKIE, verifyAccountToken } from "@/lib/account-auth";
import { getAccountByEmail } from "@/lib/accounts-server";
import {
  daysUntil,
  formatPrice,
  formatSessionDate,
  formatSessionTime,
} from "@/lib/course";
import { getCohortById, getPublishedCourse } from "@/lib/courses-server";
import { getEnrolmentByReference } from "@/lib/enrolments-server";
import { COMPANY } from "@/lib/legal";

/**
 * "You're in, and here's what happens next."
 *
 * ⚠️ `noindex`, AND THE URL IS RANDOM, NOT SEQUENTIAL. This page names a child, their
 * school and a guardian's phone number. The reference is 24 random hex characters
 * (`makeReference`) precisely so one shared link does not make its neighbours guessable, and
 * the robots directive keeps it out of search results if a parent ever posts the URL.
 *
 * ⚠️ IT WORKS WITH NO DATES AND NO LINK. Cohort dates and the Meet link are set by hand and
 * go out over WhatsApp, so a seat can legitimately be sold before either exists. Every block
 * below degrades to a specific promise — "we'll WhatsApp you on this number" — rather than
 * an empty space where a date should be.
 */

export const dynamic = "force-dynamic";

/**
 * The cohort WhatsApp group.
 *
 * ⚠️ HARD-CODED, AND `cohort.joiningLink` IS THE PATTERN IT SHOULD FOLLOW. That one is a
 * field an admin edits per batch; this is one URL compiled into the bundle, so a second
 * course — or a second batch that needs its own group — cannot have a different one
 * without a deploy. `course.ts` opens by warning against exactly this ("A COURSE IS DATA,
 * NOT CODE"), and it is right. Kept as a constant only because there is one group today;
 * the moment there are two, move it onto the cohort beside `joiningLink`.
 *
 * ⚠️ THE INVITE IS A SECRET IN THE WEAK SENSE — anyone holding it can join. It is rendered
 * only on a *paid* confirmation, behind a 24-character random reference, which is what
 * keeps it away from people who have not bought a seat. Do not move it anywhere public.
 */
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/D1x76ipFzFJ0E43s0ckalQ";

export const metadata: Metadata = {
  title: "You're enrolled | Innovgeist",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ reference: string }>;
}

export default async function EnrolledPage({ params }: Props) {
  const { reference } = await params;
  const enrolment = await getEnrolmentByReference(reference);
  if (!enrolment) notFound();

  const [course, cohort] = await Promise.all([
    getPublishedCourse(enrolment.courseSlug),
    enrolment.cohortId ? getCohortById(enrolment.cohortId) : null,
  ]);

  const dated = (cohort?.sessions ?? []).filter((s) => s.startsAt);
  const firstSession = dated[0]?.startsAt ?? null;
  const days = firstSession ? daysUntil(firstSession) : null;

  const status = enrolment.payment.status;
  const paid = status === "paid" || status === "not_required";
  const canRetry = status === "pending" || status === "failed";

  const token = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  const signedIn = Boolean(verifyAccountToken(token));
  const hasAccount = signedIn ? true : Boolean(await getAccountByEmail(enrolment.guardian.email));

  /**
   * ⚠️ THE PASSWORD STEP IS MANDATORY ONLY ONCE THE SEAT IS PAID FOR, AND OPTIONAL BEFORE.
   *
   * A guardian with no account and no password has exactly one route back to this page: the
   * random 24-character link in a browser tab they are about to close. That is why the box
   * over a paid confirmation does not close — losing it is losing the enrolment.
   *
   * The same box over a *pending or failed* payment would be the opposite: an unskippable
   * form sitting on top of `PayNowButton`, which is the one control that page exists to
   * offer. So the unpaid case keeps the old inline card — an offer, ignorable — and only
   * the paid case blocks.
   */
  const mustSetPassword = paid && !hasAccount;
  const offerAccount = !paid && !hasAccount;

  const tone = paid ? "ok" : status === "failed" ? "bad" : "warn";
  const banner = course?.images?.hero ?? course?.images?.thumbnail ?? null;
  const firstName = enrolment.student.fullName.split(" ")[0];

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
            <Link className="btn btn--ghost btn--sm" href="/account/dashboard">
              My account
            </Link>
          </div>
        </div>
      </header>

      <main id="main" className="conf">
        <div className="conf__bg" aria-hidden="true" />

        <div className="container">
          {/**
           * ⚠️ THE STATUS DECIDES EVERY WORD IN THIS BLOCK, and it has to. A "you're in!"
           * headline above an unpaid enrolment is the single most expensive thing this page
           * could say — the guardian closes the tab believing a seat is held, and finds out
           * it never was on the morning of the first class.
           */}
          <div className="conf__hero">
            <div className="conf__intro">
              <span className={`dash-tag dash-tag--${tone} conf__tag`}>
                {paid
                  ? "Enrollment confirmed"
                  : status === "failed"
                    ? "Payment didn't go through"
                    : "Payment pending"}
              </span>

              <h1 className="conf__title">
                {paid
                  ? `${firstName} is in.`
                  : status === "failed"
                    ? "Almost there — payment didn't complete."
                    : "Almost there — finish your payment."}
              </h1>

              <p className="conf__lede">
                {paid ? (
                  <>
                    {course ? course.title : "The course"}
                    {cohort ? ` · ${cohort.name}` : ""}
                    {days !== null && days >= 0 ? (
                      <>
                        {" "}
                        — starting{" "}
                        <strong>
                          {days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`}
                        </strong>
                        .
                      </>
                    ) : (
                      " — we'll confirm the start date shortly."
                    )}
                  </>
                ) : (
                  <>
                    {course ? course.title : "The course"} — no seat is held until payment
                    completes.
                  </>
                )}
              </p>

              <dl className="conf__facts">
                <div>
                  <dt>Student</dt>
                  <dd>
                    {enrolment.student.fullName} &middot; Class {enrolment.student.class}
                  </dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>
                    <code>{enrolment.reference.slice(0, 8)}</code>
                  </dd>
                </div>
                <div>
                  <dt>{paid ? "Paid" : "Amount due"}</dt>
                  <dd>{formatPrice(enrolment.payment.amount)}</dd>
                </div>
              </dl>
            </div>

            {banner ? (
              <div className="conf__media">
                <CourseImage image={banner} sizes="(max-width: 62rem) 92vw, 26rem" priority />
              </div>
            ) : null}
          </div>

          {canRetry ? (
            <div className="conf__due">
              <div>
                <strong>{formatPrice(enrolment.payment.amount)} due</strong>
                <span>
                  {status === "failed"
                    ? "The last attempt didn't complete. Nothing was charged."
                    : "Your seat is held only once this clears."}
                </span>
              </div>
              <PayNowButton reference={enrolment.reference} label="Complete payment" />
            </div>
          ) : null}

          <div className="conf__grid">
            <section className="conf-card">
              <h2>
                {dated.length ? `Your ${dated.length} sessions` : "Your schedule"}
              </h2>
              {dated.length ? (
                <ol className="conf-card__sessions">
                  {dated.map((session) => (
                    <li key={session.n}>
                      <span className="conf-card__week">Week {session.n}</span>
                      <span className="conf-card__when">
                        <strong>{formatSessionDate(session.startsAt)}</strong>
                        {formatSessionTime(session.startsAt)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="conf-card__pending">
                  Dates are being finalised. We&rsquo;ll send them to your WhatsApp on{" "}
                  <strong>{enrolment.guardian.phone}</strong> as soon as they&rsquo;re set.
                </p>
              )}
            </section>

            <section className="conf-card">
              <h2>Joining the class</h2>

              {/**
               * ⚠️ `paid` GATES THIS, NOT `hasAccount` OR ANYTHING ELSE. The group is the
               * one thing on this page that hands over something of value the moment it is
               * seen — an invite link works for whoever holds it, and it cannot be taken
               * back short of resetting the group. A pending or failed payment must never
               * render it: the seat is not bought, and the retry card above is what that
               * visitor is here for.
               *
               * It sits above the class link because it is the action that exists *today*.
               * The class link is set by hand once a batch is scheduled, so on a freshly
               * paid confirmation the block below is usually a promise rather than a
               * button — leading with the promise buries the one thing that works.
               */}
              {paid ? (
                <div className="conf-card__group">
                  <a
                    className="btn btn--whatsapp btn--block"
                    href={WHATSAPP_GROUP_URL}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <svg className="icon icon--solid" aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.91-9.91a9.86 9.86 0 0 0-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.82c0 4.54-3.7 8.24-8.25 8.24a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.26-8.24Z" />
                      <path d="M9.36 7.2c-.18-.4-.36-.41-.53-.42h-.45c-.16 0-.42.06-.63.3-.22.24-.83.81-.83 1.98s.85 2.3 .97 2.46c.12.16 1.65 2.65 4.07 3.6 2.01.8 2.42.64 2.86.6.43-.04 1.4-.57 1.6-1.13.2-.55.2-1.03.14-1.13-.06-.1-.22-.16-.46-.28-.24-.12-1.4-.69-1.62-.77-.22-.08-.37-.12-.53.12-.16.24-.61.77-.75.93-.14.16-.28.18-.51.06-.24-.12-1-.37-1.9-1.18-.7-.63-1.18-1.4-1.32-1.64-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.53-1.3-.75-1.78Z" />
                    </svg>
                    Join the group
                  </a>
                  <p className="conf-card__note">For students enrolled in this course.</p>
                </div>
              ) : null}

              {cohort?.joiningLink ? (
                <>
                  <p>Use this link for every session. Save it now.</p>
                  <a
                    className="btn btn--primary btn--block"
                    href={cohort.joiningLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open the class link
                  </a>
                </>
              ) : (
                <p className="conf-card__pending">
                  Your class link comes on <strong>WhatsApp</strong>, to{" "}
                  <strong>{enrolment.guardian.phone}</strong>, before the first session — along
                  with a reminder the day before.
                </p>
              )}
            </section>

            <section className="conf-card">
              <h2>Before the first class</h2>
              <ul className="conf-card__list">
                <li>A laptop or phone with internet.</li>
                <li>
                  The syllabus or textbook for <strong>one</strong> subject — in Week 1{" "}
                  {firstName} picks the subject to work on for the rest of the course.
                </li>
                <li>Nothing to install, and no prior AI knowledge needed.</li>
              </ul>
            </section>

            <section className="conf-card conf-card--muted">
              <h2>Your enrollment</h2>
              <dl className="conf-card__facts">
                <div>
                  <dt>Student</dt>
                  <dd>
                    {enrolment.student.fullName} &middot; Class {enrolment.student.class}
                  </dd>
                </div>
                <div>
                  <dt>Guardian</dt>
                  <dd>
                    {enrolment.guardian.fullName}
                    {enrolment.guardian.relationship ? ` (${enrolment.guardian.relationship})` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>{enrolment.guardian.phone}</dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>
                    <code>{enrolment.reference.slice(0, 8)}</code>
                  </dd>
                </div>
              </dl>
              <p className="conf-card__note">
                Razorpay emails your payment receipt separately. Questions?{" "}
                <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or{" "}
                <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>.
              </p>
            </section>

            {offerAccount ? (
              <section className="conf-card conf-card--wide">
                <h2>Track this online</h2>
                <QuickAccountCreate
                  fullName={enrolment.guardian.fullName}
                  email={enrolment.guardian.email}
                />
              </section>
            ) : null}
          </div>

          <MentorCard />
        </div>
      </main>

      {/* Last in the tree, over everything, and rendered only when there is genuinely no
          way back to this enrolment without it. */}
      {mustSetPassword ? (
        <SetPasswordGate
          fullName={enrolment.guardian.fullName}
          email={enrolment.guardian.email}
        />
      ) : null}

      <SiteFooter />
    </>
  );
}
