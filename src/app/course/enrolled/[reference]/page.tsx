import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteFooter from "@/components/site/SiteFooter";
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
  const paid = enrolment.payment.status === "paid" || enrolment.payment.status === "not_required";

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
            <span className="enrolled__tick" aria-hidden="true">
              <svg className="icon" viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <p className="eyebrow">{paid ? "Enrollment confirmed" : "Enrollment received"}</p>
            <h1 className="section__title">
              {enrolment.student.fullName.split(" ")[0]} is in.
            </h1>
            <p className="section__lede">
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
            </p>
          </div>

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
          </div>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
