import type { Metadata } from "next";
import BrandLogo from "@/components/site/BrandLogo";
import Link from "next/link";
import CourseImage from "@/components/course/CourseImage";
import SiteFooter from "@/components/site/SiteFooter";
import { formatPrice, formatSessionDate } from "@/lib/course";
import { listPublishedCourses } from "@/lib/courses-server";

/**
 * The course catalogue.
 *
 * ⚠️ EVERY CARD IS A ROW IN `courses`. Nothing about "The AI Study Method" appears in this
 * file, so the second and tenth courses need data and not a deploy (PRD §8).
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Courses | Innovgeist",
  description:
    "Live, practical AI courses from Innovgeist Technologies — built so students learn to think with AI, not outsource their thinking to it.",
  alternates: { canonical: "/course" },
};

export default async function CourseCatalogue() {
  const courses = await listPublishedCourses();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <header className="course-bar">
        <div className="container course-bar__inner">
          <Link className="course-bar__brand" href="/" aria-label="Innovgeist — home">
            <BrandLogo width={150} height={25} />
          </Link>
          <div className="course-bar__right">
            <Link className="btn btn--ghost btn--sm course-bar__account" href="/account">
              My account
            </Link>
            <Link className="btn btn--ghost btn--sm" href="/#contact">
              For institutions
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="catalogue-hero">
          <div className="container catalogue-hero__inner">
            {/* Eyebrow and heading are one column; the lede sits beside them. Same split
                the home page uses for its section heads. */}
            <div>
              <p className="eyebrow">Courses</p>
              <h1 className="catalogue-hero__title">Learn to think with AI, not outsource to it.</h1>
            </div>
            <p className="catalogue-hero__lede">
              Live, hands-on courses for students. Every one ends with something built and a
              result you can measure — not a certificate for showing up.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            {courses.length ? (
              /**
               * ⚠️ ONE COURSE GETS A DIFFERENT SHAPE, NOT A NARROWER GRID. `.catalogue` is
               * `auto-fit`, so a lone card stretches to the full container — on a 1080p
               * screen that is a banner image nearly two thousand pixels wide above three
               * lines of text, which reads as a layout fault rather than as a catalogue.
               * The modifier turns that single card on its side: art beside the text, both
               * filling the row honestly. It comes off by itself the moment a second course
               * is published.
               */
              <div className={`catalogue${courses.length === 1 ? " catalogue--single" : ""}`}>
                {courses.map((course) => (
                  <article className="catalogue-card" key={course.slug}>
                    <Link
                      className="catalogue-card__link"
                      href={`/course/${course.slug}`}
                      aria-label={`${course.title} — see details and enroll`}
                    >
                      {course.thumbnail ? (
                        <div className="catalogue-card__art">
                          <CourseImage
                            image={course.thumbnail}
                            sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30rem"
                          />
                        </div>
                      ) : null}

                      <div className="catalogue-card__body">
                        <p className="catalogue-card__tag">{course.tagline}</p>
                        <h2>{course.title}</h2>
                        <p className="catalogue-card__sub">{course.subtitle}</p>
                        <p className="catalogue-card__promise">{course.promise}</p>

                        <ul className="catalogue-card__facts">
                          <li>{course.audience}</li>
                          {course.nextStartsAt ? (
                            <li>Starts {formatSessionDate(course.nextStartsAt)}</li>
                          ) : (
                            <li>Dates announced soon</li>
                          )}
                        </ul>
                      </div>

                      <div className="catalogue-card__foot">
                        {/* One price, no anchor and no badge — see the note in
                            course/[slug]/page.tsx. Codes are applied at checkout. */}
                        <p className="catalogue-card__price">
                          <strong>{formatPrice(course.payableAmount)}</strong>
                        </p>
                        <span className="catalogue-card__cta">
                          {course.hasOpenBatch ? "Enroll" : "See details"}
                          <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                          </svg>
                        </span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              /* Honest rather than a fake "coming soon" list — there is genuinely nothing
                 open, and the useful thing is a way to hear when there is. */
              <div className="catalogue-empty">
                <h2>No courses are open right now.</h2>
                <p>
                  The next batch hasn&rsquo;t been announced yet. Email{" "}
                  <a href="mailto:support@innovgeist.com">support@innovgeist.com</a> and
                  we&rsquo;ll tell you first.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
