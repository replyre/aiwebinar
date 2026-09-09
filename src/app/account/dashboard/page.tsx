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

function statusLabel(enrolment: EnrolmentDoc): string {
  switch (enrolment.payment.status) {
    case "paid":
    case "not_required":
      return "Confirmed";
    case "pending":
      return "Payment pending";
    case "failed":
      return "Payment failed";
    case "refunded":
      return "Refunded";
    default:
      return enrolment.payment.status;
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
          <div className="course-bar__right">
            <Link className="course-bar__back" href="/course">
              <span>Browse courses</span>
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main id="main" className="section">
        <div className="container enrolled">
          <div className="enrolled__head">
            <p className="eyebrow">My account</p>
            <h1 className="section__title">Hi {account.fullName.split(" ")[0]}.</h1>
            <p className="section__lede">
              {rows.length
                ? "Here's everything you've enrolled in."
                : "You haven't enrolled in anything yet."}
            </p>
          </div>

          {rows.length ? (
            <div className="enrolled__grid">
              {rows.map(({ enrolment, course, cohort }) => {
                const dated = (cohort?.sessions ?? []).filter((s) => s.startsAt);
                return (
                  <section className="enrolled__card" key={enrolment._id.toHexString()}>
                    <h2>{course?.title ?? enrolment.courseSlug}</h2>
                    <p className="enrolled__note">
                      {enrolment.student.fullName} · Class {enrolment.student.class} ·{" "}
                      {statusLabel(enrolment)} · {formatPrice(enrolment.payment.amount)}
                    </p>

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
                        Dates are being finalised — we&rsquo;ll message{" "}
                        <strong>{enrolment.guardian.phone}</strong> on WhatsApp.
                      </p>
                    )}

                    {enrolment.payment.status === "pending" || enrolment.payment.status === "failed" ? (
                      <PayNowButton reference={enrolment.reference} label="Complete payment" />
                    ) : null}

                    {cohort?.joiningLink ? (
                      <a
                        className="btn btn--secondary btn--block"
                        href={cohort.joiningLink}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Open the class link
                      </a>
                    ) : null}

                    <Link
                      className="course-bar__back"
                      href={`/course/enrolled/${enrolment.reference}`}
                    >
                      <span>View full details</span>
                    </Link>
                  </section>
                );
              })}
            </div>
          ) : (
            <Link className="btn btn--primary" href="/course">
              See courses
            </Link>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
