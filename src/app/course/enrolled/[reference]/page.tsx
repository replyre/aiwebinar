import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/site/SiteFooter";
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

  return (
    <>
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
        </div>
      </header>

      <main id="main" className="section">
        <div className="container enrolled">
          <div className="enrolled__head">
            <span
              className={`enrolled__tick${
                paid ? "" : status === "failed" ? " enrolled__tick--error" : " enrolled__tick--warn"
              }`}
              aria-hidden="true"
            >
              <svg className="icon" viewBox="0 0 24 24">
                {paid ? (
                  <path d="M20 6 9 17l-5-5" />
                ) : status === "failed" ? (
                  <>
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3.5 2" />
                  </>
                )}
              </svg>
            </span>
            <p className="eyebrow">
              {paid
                ? "Enrollment confirmed"
                : status === "failed"
                  ? "Payment didn't go through"
                  : "Payment pending"}
            </p>
            <h1 className="section__title">
              {paid
                ? `${enrolment.student.fullName.split(" ")[0]} is in.`
                : status === "failed"
                  ? "Almost there — payment didn't complete."
                  : "Almost there — finish your payment."}
            </h1>
            <p className="section__lede">
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
          </div>

          {canRetry ? (
            <div className="enrolled__card enrolled__card--muted enrolled__retry">
              <h2>{formatPrice(enrolment.payment.amount)} due</h2>
              <PayNowButton reference={enrolment.reference} label="Complete payment" />
            </div>
          ) : null}

          <div className="enrolled__grid">
            <section className="enrolled__card">
              <h2>Your four Sundays</h2>
              {dated.length ? (
                <ol className="enrolled__sessions">
                  {dated.map((session) => (
                    <li key={session.n}>
                      <span className="enrolled__week">Week {session.n}</span>
                      <span className="enrolled__when">
                        <strong>{formatSessionDate(session.startsAt)}</strong>
                        {formatSessionTime(session.startsAt)}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="enrolled__pending">
                  Dates are being finalised. We&rsquo;ll send them to your WhatsApp on{" "}
                  <strong>{enrolment.guardian.phone}</strong> as soon as they&rsquo;re set.
                </p>
              )}
            </section>

            <section className="enrolled__card">
              <h2>Joining the class</h2>
              {cohort?.joiningLink ? (
                <>
                  <p>Use this link for every session. Save it now.</p>
                  <a
                    className="btn btn--secondary btn--block"
                    href={cohort.joiningLink}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    Open the class link
                  </a>
                </>
              ) : (
                <p className="enrolled__pending">
                  Your class link comes on <strong>WhatsApp</strong>, to{" "}
                  <strong>{enrolment.guardian.phone}</strong>, before the first session — along
                  with a reminder the day before.
                </p>
              )}
            </section>

            <section className="enrolled__card">
              <h2>Before the first class</h2>
              <ul className="enrolled__list">
                <li>A laptop or phone with internet.</li>
                <li>
                  The syllabus or textbook for <strong>one</strong> subject — in Week 1{" "}
                  {enrolment.student.fullName.split(" ")[0]} picks the subject to work on for
                  all four weeks.
                </li>
                <li>Nothing to install, and no prior AI knowledge needed.</li>
              </ul>
            </section>

            <section className="enrolled__card enrolled__card--muted">
              <h2>Your enrollment</h2>
              <dl className="enrolled__facts">
                <div>
                  <dt>Student</dt>
                  <dd>
                    {enrolment.student.fullName} · Class {enrolment.student.class}
                  </dd>
                </div>
                <div>
                  <dt>Guardian</dt>
                  <dd>
                    {enrolment.guardian.fullName} ({enrolment.guardian.relationship})
                  </dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>
                    <code>{enrolment.reference.slice(0, 8)}</code>
                  </dd>
                </div>
                <div>
                  <dt>{paid ? "Paid" : "Amount"}</dt>
                  <dd>{formatPrice(enrolment.payment.amount)}</dd>
                </div>
              </dl>
              <p className="enrolled__note">
                Razorpay emails your payment receipt separately. Questions?{" "}
                <a href="mailto:support@innovgeist.com">support@innovgeist.com</a> or{" "}
                <a href="tel:+918127273162">+91 81272 73162</a>.
              </p>
            </section>

            {!hasAccount ? (
              <section className="enrolled__card">
                <h2>Track this online</h2>
                <QuickAccountCreate
                  fullName={enrolment.guardian.fullName}
                  email={enrolment.guardian.email}
                />
              </section>
            ) : null}
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
