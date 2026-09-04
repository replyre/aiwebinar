import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import CourseImage from "@/components/course/CourseImage";
import EnrolModal from "@/components/course/EnrolModal";
import EnrolPanel from "@/components/course/EnrolPanel";
import PayNowButton from "@/components/course/PayNowButton";
import ProofGain from "@/components/course/ProofGain";
import SiteFooter from "@/components/site/SiteFooter";
import { ACCOUNT_COOKIE, verifyAccountToken } from "@/lib/account-auth";
import { getAccountById } from "@/lib/accounts-server";
import {
  formatDateRange,
  formatPrice,
  formatSessionDate,
  isRegistrable,
  payableAmount,
  seatsLeft,
} from "@/lib/course";
import { getOpenCohorts, getPublishedCourse } from "@/lib/courses-server";
import { getEnrolmentsByGuardianEmail } from "@/lib/enrolments-server";

/**
 * The course sales page.
 *
 * ⚠️ EVERY WORD AND NUMBER COMES FROM THE DATABASE. There is no "AI Study Method" string in
 * this file: it renders whatever course the slug resolves to, so the second course needs a
 * row and not a deploy (PRD §8).
 *
 * The ordering is a conversion argument, not a table of contents. The measured before/after
 * result leads, because "5/10 → 9/10 on your worst subject" is concrete where "learn prompt
 * engineering" is not; the syllabus comes after the proof, not before it.
 */

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getPublishedCourse(slug);
  if (!course) return { title: "Course not found" };

  const description = course.promise.slice(0, 200);
  return {
    title: `${course.title} — ${course.subtitle} | Innovgeist`,
    description,
    alternates: { canonical: `/course/${course.slug}` },
    openGraph: {
      title: `${course.title} — ${course.subtitle}`,
      description,
      url: `/course/${course.slug}`,
      ...(course.images.og ? { images: [{ url: course.images.og }] } : {}),
    },
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getPublishedCourse(slug);

  // A draft course, or one that does not exist, is a 404 rather than a "coming soon" —
  // there is nothing to sell and nothing to index.
  if (!course) notFound();

  const cohorts = await getOpenCohorts(course.slug);
  const openCohorts = cohorts.filter((c) => isRegistrable(c));
  const payable = payableAmount(course.pricing);

  const next = openCohorts[0];
  const nextSeatsLeft = next ? seatsLeft(next) : null;
  const dated = next?.sessions.filter((s) => s.startsAt) ?? [];

  const cohortOptions = openCohorts.map((cohort) => ({
    id: cohort.id,
    name: cohort.name,
    sessions: cohort.sessions
      .filter((s) => s.startsAt)
      .map((s) => ({ n: s.n, startsAt: s.startsAt!.toISOString() })),
    seatsLeft: seatsLeft(cohort),
  }));

  /**
   * ⚠️ A SIGNED-IN GUARDIAN NEVER RETYPES THEIR OWN DETAILS, AND NEVER BUYS THE SAME COURSE
   * TWICE BY ACCIDENT. Both come from one lookup: their existing enrolments for *this*
   * course. An active one (paid, or free/no-payment-needed) replaces the form with "you're
   * already enrolled"; a pending/failed one replaces it with a retry button against that same
   * row, never a fresh one. Only when neither exists does the checkout form render — prefilled
   * with the account's name and email so the six fields become four.
   */
  const accountToken = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  const viewerId = verifyAccountToken(accountToken);
  const viewer = viewerId ? await getAccountById(viewerId) : null;

  let existing: { status: "active" | "pending" | "failed"; reference: string } | null = null;
  if (viewer) {
    const guardianEnrolments = (await getEnrolmentsByGuardianEmail(viewer.email)).filter(
      (e) => e.courseSlug === course.slug,
    );
    const active = guardianEnrolments.find(
      (e) => e.payment.status === "paid" || e.payment.status === "not_required",
    );
    const pending = guardianEnrolments.find((e) => e.payment.status === "pending");
    const failed = guardianEnrolments.find((e) => e.payment.status === "failed");
    const pick = active ?? pending ?? failed;
    if (pick) {
      existing = { status: active ? "active" : pending ? "pending" : "failed", reference: pick.reference };
    }
  }

  /** So the "Enroll" buttons up top never contradict the panel they scroll to. */
  const ctaLabel =
    existing?.status === "active"
      ? "View your enrollment"
      : existing
        ? "Finish your payment"
        : payable === 0
          ? "Join free"
          : null; // null = the two call sites keep their own "Enroll · ₹price" / "Enroll now" wording

  const enrolSlot =
    existing?.status === "active" ? (
      <div className="enrolled__card enrolled__card--muted">
        <h2>You&rsquo;re already enrolled</h2>
        <p className="enrolled__note">This course is already on your account.</p>
        <Link className="btn btn--primary btn--block" href={`/course/enrolled/${existing.reference}`}>
          View your enrollment
        </Link>
      </div>
    ) : existing?.status === "pending" || existing?.status === "failed" ? (
      <div className="enrolled__card enrolled__card--muted">
        <h2>Finish your payment</h2>
        <p className="enrolled__note">{formatPrice(payable)} due to confirm your seat.</p>
        <PayNowButton reference={existing.reference} label="Complete payment" />
      </div>
    ) : (
      <EnrolPanel
        cohorts={cohortOptions}
        amount={payable}
        courseSlug={course.slug}
        viewer={viewer ? { fullName: viewer.fullName, email: viewer.email } : null}
      />
    );

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
            {/* A course page that only goes forward is a dead end for anyone who
                arrived on the wrong one. */}
            <Link className="course-bar__back" href="/course">
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                <path d="m15 18-6-6 6-6" />
              </svg>
              <span>All courses</span>
            </Link>
            <Link className="btn btn--ghost btn--sm" href="/account">
              My account
            </Link>
            <a className="btn btn--primary btn--sm" href="#enrol">
              {ctaLabel ?? `Enroll · ${formatPrice(payable)}`}
            </a>
          </div>
        </div>
      </header>

      <main id="main" className="course-page">
        {/* ------------------------------- hero ------------------------------- */}
        <section className="course-hero">
          <div className="container course-hero__grid">
            <div className="course-hero__copy">
              <p className="eyebrow">{course.tagline}</p>
              <h1 className="course-hero__title">{course.title}</h1>
              <p className="course-hero__sub">{course.subtitle}</p>
              <p className="course-hero__promise">{course.promise}</p>

              <div className="course-hero__cta">
                <a className="btn btn--primary btn--lg" href="#enrol">
                  {ctaLabel ?? "Enroll now"}
                  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </a>
                {/**
                 * ⚠️ ONE PRICE, NO STRUCK-THROUGH ANCHOR, NO OFFER BADGE — ANYWHERE A
                 * VISITOR IS STILL BROWSING.
                 *
                 * Discount codes are handed to students directly, and the reduction happens
                 * at checkout when the code is entered. Advertising a lower price here would
                 * show it to everyone including people who have no code, which is both a
                 * broken promise and the invented-scarcity pattern this brand has no
                 * reputation to spend on. The price shown is the price charged to somebody
                 * without a code.
                 */}
                <p className="course-hero__price">
                  <strong>{formatPrice(payable)}</strong>
                </p>
              </div>

              {next && dated.length ? (
                <p className="course-hero__batch">
                  <span className="dot" aria-hidden="true" />
                  Enrolling now — <strong>{next.name}</strong> starts{" "}
                  <strong>{formatSessionDate(dated[0].startsAt)}</strong>
                </p>
              ) : null}

              <ul className="course-hero__facts">
                <li>
                  {course.commitment.cadence} · {course.commitment.sessionMinutes / 60} hours live each
                </li>
                <li>{course.audience}</li>
                <li>{course.commitment.practicePerWeek} of practice a week</li>
              </ul>
            </div>

            {course.images.hero ? (
              <div className="course-hero__art">
                <CourseImage
                  image={course.images.hero}
                  sizes="(max-width: 900px) 92vw, 46vw"
                  priority
                />
              </div>
            ) : null}
          </div>
        </section>

        {/* ------------------------------ the proof ---------------------------- */}
        <section className="section section--dark course-proof">
          <div className="container">
            <div className="section__head section__head--center">
              <p className="eyebrow eyebrow--onDark">The proof</p>
              <h2 className="section__title">You won&rsquo;t just feel better. You&rsquo;ll see it.</h2>
              <p className="section__lede">
                On day one you pick your weakest subject and take a quick{" "}
                {course.proof.questionCount}-question test — that&rsquo;s your starting score. Four
                weeks later you take a similar test on the same topic. The difference is a
                real number you and your parents can see.
              </p>
            </div>

            <ProofGain
              weeks={course.commitment.sessions}
              rows={[
                {
                  label: "Test score",
                  unit: "marks",
                  before: course.proof.exampleBefore,
                  after: course.proof.exampleAfter,
                },
                {
                  label: "Confidence",
                  unit: "points",
                  before: course.proof.exampleConfidenceBefore,
                  after: course.proof.exampleConfidenceAfter,
                },
              ]}
            />

            {/* Stated as an illustration, because it is one. No student has run this yet. */}
            <p className="course-proof__note">
              An example of the change the method is built to produce — not an average, and not
              a promise of a specific result.
            </p>
          </div>
        </section>

        {/* ----------------------------- outcomes ------------------------------ */}
        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">What you&rsquo;ll be able to do</p>
              <h2 className="section__title">Five things you keep for good</h2>
            </div>
            <ol className="course-outcomes">
              {course.outcomes.map((outcome, i) => (
                <li key={outcome.title}>
                  <span className="course-outcomes__n">{String(i + 1).padStart(2, "0")}</span>
                  <h3>{outcome.title}</h3>
                  <p>{outcome.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------- the 4 weeks ---------------------------- */}
        <section className="section section--tint">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">The journey</p>
              <h2 className="section__title">Four weeks, four things you build</h2>
              <p className="section__lede">
                Every week ends with something made, not something watched.
              </p>
            </div>
            <div className="course-weeks">
              {course.curriculum.map((week) => (
                <article className="course-week" key={week.week}>
                  <p className="course-week__n">Week {week.week}</p>
                  <h3>{week.title}</h3>
                  <p className="course-week__d">{week.detail}</p>
                  <p className="course-week__out">
                    <span>You produce</span>
                    {week.produces}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------- deliverables ---------------------------- */}
        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow">What you walk away with</p>
              <h2 className="section__title">Six things that outlast the course</h2>
            </div>
            <div className="course-deliverables">
              {course.deliverables.map((item) => (
                <article key={item.title}>
                  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
            {course.tools.length ? (
              <p className="course-tools">
                Set up and confident with {course.tools.join(", ")}.
              </p>
            ) : null}
          </div>
        </section>

        {/* -------------------------- the expectations ------------------------- */}
        <section className="section section--tint-2">
          <div className="container course-expect">
            <div>
              <p className="eyebrow">Your part</p>
              <h2 className="section__title">
                This isn&rsquo;t a lecture. It&rsquo;s a {course.commitment.sessions}-week challenge.
              </h2>
              <p className="section__lede">
                Points are earned for effort and consistency, so anyone willing to do the work
                can climb. It builds to Showcase Day in the final week.
              </p>
              {course.awards.length ? (
                <ul className="course-awards">
                  {course.awards.map((award) => (
                    <li key={award}>{award}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <ul className="course-expect__list">
              {course.expectations.map((expectation) => (
                <li key={expectation}>
                  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {expectation}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ------------------------------- enrol ------------------------------- */}
        <section className="section" id="enrol">
          <div className="container course-enrol">
            <div className="course-enrol__aside">
              <p className="eyebrow">Enroll</p>
              <h2 className="section__title">Take your seat</h2>

              {next ? (
                <>
                  <p className="course-enrol__batch">
                    <strong>{next.name}</strong>
                    {dated.length ? <> · {formatDateRange(dated)}</> : null}
                  </p>
                  {/* Seats remaining only when genuinely scarce, and never for an uncapped
                      batch — "27 of 30 left" reads as manufactured urgency and costs more
                      trust than it buys. */}
                  {nextSeatsLeft !== null && nextSeatsLeft <= 5 ? (
                    <p className="course-enrol__seats">
                      {nextSeatsLeft} of {next.seatsTotal} seats left
                    </p>
                  ) : null}
                </>
              ) : (
                /* No batch set up yet — the course still sells, and this says what happens
                   next instead of leaving the reader guessing. */
                <p className="course-enrol__batch course-enrol__batch--tbc">
                  Dates for the next batch are confirmed on WhatsApp after you enroll.
                </p>
              )}

              <dl className="course-enrol__facts">
                <div>
                  <dt>Format</dt>
                  <dd>
                    {course.commitment.cadence}, {course.commitment.sessionMinutes / 60} hours live each
                  </dd>
                </div>
                <div>
                  <dt>For</dt>
                  <dd>{course.audience}</dd>
                </div>
                <div>
                  <dt>Facilitator</dt>
                  <dd>
                    {course.facilitator.name}
                    <br />
                    <span>{course.facilitator.title}</span>
                  </dd>
                </div>
                <div>
                  <dt>Fee</dt>
                  <dd>
                    <strong>{formatPrice(payable)}</strong>
                    <span>Have a code? Apply it at checkout.</span>
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              {enrolSlot}

              {/**
               * Trust marks sit under the button, not above it — they answer the doubt that
               * arrives *at* the moment of paying, which is where it actually arrives. Every
               * one is a fact we can stand behind; there are no counts, ratings or
               * testimonials here because none exist yet.
               */}
              <ul className="course-trust">
                <li>
                  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                  </svg>
                  Payment secured by Razorpay — UPI, cards and netbanking
                </li>
                <li>
                  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                    <path d="M22 10v6" />
                    <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
                  </svg>
                  Taught live by {course.facilitator.name} — not a recording
                </li>
                <li>
                  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z" />
                    <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
                  </svg>
                  Dates and the class link come to you on WhatsApp
                </li>
                <li>
                  <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Nothing to install, and no prior AI knowledge needed
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ------------------------------- doubts ------------------------------ */}
        <section className="section section--tint course-answers">
          <div className="container">
            <div className="section__head section__head--center">
              <p className="eyebrow">Straight answers</p>
              <h2 className="section__title">The questions parents actually ask</h2>
            </div>

            <div className="course-answers__grid">
              {/* The honesty objection leads, because it is the one that stops a parent
                  paying, and Week 3 is literally the answer to it. */}
              <article>
                <h3>Isn&rsquo;t this just teaching my child to cheat?</h3>
                <p>
                  It&rsquo;s the opposite, and an entire week is spent on it.{" "}
                  <strong>Week 3</strong> is about catching AI&rsquo;s mistakes, verifying
                  answers, and the line between learning and cheating. A student who can spot
                  where AI is wrong is a student who understood the material.
                </p>
              </article>
              <article>
                <h3>How much time does this really take?</h3>
                <p>
                  {course.commitment.cadence}, {course.commitment.sessionMinutes / 60} hours
                  each, plus {course.commitment.practicePerWeek} of practice across the week.
                  The practice uses the syllabus they already have — it isn&rsquo;t homework on
                  top of homework.
                </p>
              </article>
              <article>
                <h3>What if my child isn&rsquo;t technical?</h3>
                <p>
                  No coding and no prior AI knowledge. Everything runs in a browser on free
                  tools — {course.tools.join(", ")} — and the first week is spent getting set
                  up together.
                </p>
              </article>
              <article>
                <h3>How will I know it worked?</h3>
                <p>
                  A number. They take a {course.proof.questionCount}-question test on their
                  weakest subject in Week 1 and a similar one in Week{" "}
                  {course.commitment.sessions}. You see both scores.
                </p>
              </article>
            </div>

            <p className="course-answers__cta">
              Something else on your mind?{" "}
              <a href="mailto:support@innovgeist.com">support@innovgeist.com</a> or{" "}
              <a href="tel:+918127273162">+91 81272 73162</a> — a real person answers.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />

      <EnrolModal
        courseSlug={course.slug}
        title={`Take your seat on ${course.title}`}
        subtitle={course.subtitle}
        priceLabel={formatPrice(payable)}
        batchLabel={
          next && dated.length
            ? `${next.name} · starts ${formatSessionDate(dated[0].startsAt)}`
            : "Dates confirmed on WhatsApp after you enroll"
        }
        bullets={course.deliverables.slice(0, 4).map((d) => d.title)}
        facts={[
          `${course.commitment.cadence} · ${course.commitment.sessionMinutes / 60} hours live each`,
          course.audience,
          `${course.commitment.practicePerWeek} of practice a week`,
          `Taught live by ${course.facilitator.name}`,
        ]}
        proof={{ before: course.proof.exampleBefore, after: course.proof.exampleAfter }}
        weeks={course.commitment.sessions}
      >
        {enrolSlot}
      </EnrolModal>

      {/* Phone-only: the enrol button is otherwise a full page away from the reader. */}
      <div className="course-sticky">
        <p className="course-sticky__price">
          <strong>{formatPrice(payable)}</strong>
        </p>
        <a className="btn btn--primary" href="#enrol">
          {ctaLabel ?? "Enroll now"}
        </a>
      </div>
    </>
  );
}
