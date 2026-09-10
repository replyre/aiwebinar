import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/site/SiteFooter";
import CourseImage from "@/components/course/CourseImage";
import MentorCard from "@/components/account/MentorCard";
import PayNowButton from "@/components/course/PayNowButton";
import QuickAccountCreate from "@/components/account/QuickAccountCreate";
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

            {!hasAccount ? (
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

      <SiteFooter />
    </>
  );
}
