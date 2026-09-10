import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SiteFooter from "@/components/site/SiteFooter";
import { ACCOUNT_COOKIE, verifyAccountToken } from "@/lib/account-auth";
import { getAccountById } from "@/lib/accounts-server";
import { formatPrice, formatSessionDate, formatSessionTime } from "@/lib/course";
import { getCohortById, getCourseBySlug } from "@/lib/courses-server";
import { getEnrolmentsByGuardianEmail, type EnrolmentDoc } from "@/lib/enrolments-server";
import CourseImage from "@/components/course/CourseImage";
import MentorCard from "@/components/account/MentorCard";
import SignOutButton from "@/components/account/SignOutButton";
import PayNowButton from "@/components/course/PayNowButton";

/**
 * "Everything you've bought, in one place."
 *
 * ⚠️ `getCourseBySlug`, NOT `getPublishedCourse`. A course archived after someone enrolled in
 * it must still show up here — this is their purchase history, not the live catalogue.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My courses | Innovgeist",
  robots: { index: false, follow: false },
};

/**
 * ⚠️ THE TONE CARRIES THE MEANING, SO IT MUST NOT BE DECORATIVE. "Payment pending" in the
 * same neutral grey as "Confirmed" is the difference between a guardian who finishes paying
 * and one who assumes they already did — amber is the only thing on the card that says
 * *something is still owed from you*. Green confirms, amber asks, red reports a failure.
 */
function statusOf(enrolment: EnrolmentDoc): { label: string; tone: "ok" | "warn" | "bad" | "off" } {
  switch (enrolment.payment.status) {
    case "paid":
    case "not_required":
      return { label: "Confirmed", tone: "ok" };
    case "pending":
      return { label: "Payment pending", tone: "warn" };
    case "failed":
      return { label: "Payment failed", tone: "bad" };
    case "refunded":
      return { label: "Refunded", tone: "off" };
    default:
      return { label: enrolment.payment.status, tone: "off" };
  }
}

export default async function AccountDashboard() {
  const token = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  const accountId = verifyAccountToken(token);
  if (!accountId) redirect("/account");

  const account = await getAccountById(accountId);
  if (!account) redirect("/account");

  const enrolments = await getEnrolmentsByGuardianEmail(account.email);

  const rows = await Promise.all(
    enrolments.map(async (enrolment) => {
      const [course, cohort] = await Promise.all([
        getCourseBySlug(enrolment.courseSlug),
        enrolment.cohortId ? getCohortById(enrolment.cohortId) : null,
      ]);
      return { enrolment, course, cohort };
    }),
  );

  const needsPayment = rows.filter(
    ({ enrolment }) =>
      enrolment.payment.status === "pending" || enrolment.payment.status === "failed",
  ).length;

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
            <SignOutButton />
          </div>
        </div>
      </header>

      <main id="main" className="dash">
        <div className="dash__bg" aria-hidden="true" />

        <div className="container">
          <div className="dash__head">
            <p className="eyebrow">My account</p>
            <h1 className="dash__title">Hi {account.fullName.split(" ")[0]}.</h1>
            <p className="dash__lede">
              {rows.length
                ? "Everything you've enrolled in, with dates and joining links as they're confirmed."
                : "You haven't enrolled in anything yet — the courses are open whenever you are."}
            </p>

            {needsPayment ? (
              <p className="dash__alert">
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
                <span>
                  {needsPayment === 1
                    ? "One enrolment still needs payment. Your seat is held until it clears."
                    : `${needsPayment} enrolments still need payment. Those seats are held until they clear.`}
                </span>
              </p>
            ) : null}
          </div>

          {rows.length ? (
            <div className="dash__grid">
              {rows.map(({ enrolment, course, cohort }) => {
                const dated = (cohort?.sessions ?? []).filter((s) => s.startsAt);
                const status = statusOf(enrolment);
                const owes =
                  enrolment.payment.status === "pending" || enrolment.payment.status === "failed";

                return (
                  <article className="dash-card" key={enrolment._id.toHexString()}>
                    <div className="dash-card__media">
                      {course?.images?.thumbnail ? (
                        <CourseImage
                          image={course.images.thumbnail}
                          sizes="(max-width: 60rem) 92vw, 26rem"
                        />
                      ) : (
                        <div className="dash-card__placeholder" aria-hidden="true">
                          <svg className="icon" viewBox="0 0 24 24">
                            <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                            <path d="M22 10v6" />
                            <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                          </svg>
                        </div>
                      )}
                      <span className={`dash-tag dash-tag--${status.tone}`}>{status.label}</span>
                    </div>

                    <div className="dash-card__body">
                      <h2 className="dash-card__title">{course?.title ?? enrolment.courseSlug}</h2>

                      <ul className="dash-card__meta">
                        <li>{enrolment.student.fullName}</li>
                        <li>Class {enrolment.student.class}</li>
                        <li>{formatPrice(enrolment.payment.amount)}</li>
                      </ul>

                      {dated.length ? (
                        <ol className="dash-card__sessions">
                          {dated.map((session) => (
                            <li key={session.n}>
                              <span className="dash-card__week">Week {session.n}</span>
                              <span className="dash-card__when">
                                <strong>{formatSessionDate(session.startsAt)}</strong>
                                {formatSessionTime(session.startsAt)}
                              </span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="dash-card__pending">
                          Dates are being finalised — we&rsquo;ll message{" "}
                          <strong>{enrolment.guardian.phone}</strong> on WhatsApp.
                        </p>
                      )}

                      <div className="dash-card__actions">
                        {owes ? (
                          <PayNowButton reference={enrolment.reference} label="Complete payment" />
                        ) : null}

                        {cohort?.joiningLink ? (
                          <a
                            className="btn btn--primary btn--block"
                            href={cohort.joiningLink}
                            rel="noopener noreferrer"
                            target="_blank"
                          >
                            Open the class link
                          </a>
                        ) : null}

                        <Link
                          className="btn btn--ghost btn--block"
                          href={`/course/enrolled/${enrolment.reference}`}
                        >
                          View full details
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="dash-empty">
              <h2>Nothing here yet</h2>
              <p>
                Once you enrol, the course, its schedule and the joining link all appear on this
                page.
              </p>
              <Link className="btn btn--primary btn--lg" href="/course">
                See the courses
              </Link>
            </div>
          )}

          <MentorCard />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
