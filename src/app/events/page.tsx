import type { Metadata } from "next";
import BrandLogo from "@/components/site/BrandLogo";
import Link from "next/link";
import SiteFooter from "@/components/site/SiteFooter";
import {
  coverPhoto,
  formatEventDate,
  formatEventYear,
  listEvents,
  photoSources,
  type SiteEvent,
} from "@/lib/events";

/**
 * The field record index.
 *
 * ⚠️ THE LAYOUT IS BUILT FOR THE COUNT WE HAVE, NOT THE COUNT WE WANT. With two events a
 * three-column grid puts one card on a row of its own beside two columns of white space,
 * which reads as a page that failed to load rather than as a young company. So the newest
 * event is promoted to a full-width feature and everything after it is a wide horizontal
 * row — both of which fill their line at any count, including one. Nothing here needs
 * revisiting when the third school lands; the same two shapes still hold.
 */

export const metadata: Metadata = {
  title: "Events | Innovgeist",
  description:
    "Sessions, workshops and hackathons Innovgeist has run with schools, colleges and " +
    "incubation centres — with the photographs and what was covered at each one.",
  alternates: { canonical: "/events" },
};

/**
 * ⚠️ THE CAP IS WHY THIS PAGE SAYS "LATEST". Past this many the index stops being
 * scannable and starts being an archive, which is a different page with a different job
 * (filters, years, pagination). Until we are anywhere near it, the slice is a no-op and
 * every event we have is on the page.
 */
const MAX_LISTED = 12;

function dateLabel(event: SiteEvent): string {
  return event.date.endsWith("-01-01") ? formatEventYear(event.date) : formatEventDate(event.date);
}

export default function EventsIndexPage() {
  const all = listEvents();
  const [featured, ...rest] = all.slice(0, MAX_LISTED);

  const featuredCover = photoSources(featured, coverPhoto(featured));

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
        {/* ---------------------------------------------------------------- Hero */}
        <section className="ehero ehero--index">
          <div className="container">
            <p className="eyebrow eyebrow--onDark">Field record</p>
            <h1 className="ehero__title">Where we have already done this</h1>
            <p className="ehero__lede">
              Every session below happened in a real hall, in front of real students, with
              photographs to show for it. Open any one of them to see what was covered, who
              hosted it, and what the room actually looked like.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------ Featured */}
        <section className="section" aria-labelledby="latest-title">
          <div className="container">
            <div className="section__head">
              <p className="eyebrow" data-reveal="">Most recent</p>
              <h2 className="section__title" id="latest-title" data-reveal="">
                {featured.cardTitle}
              </h2>
            </div>

            <article className="efeature" data-reveal="">
              <div className="efeature__media">
                <picture>
                  <source
                    type="image/webp"
                    srcSet={featuredCover.webpSrcSet}
                    sizes="(max-width: 950px) 92vw, 640px"
                  />
                  <img
                    src={featuredCover.src}
                    srcSet={featuredCover.srcSet}
                    sizes="(max-width: 950px) 92vw, 640px"
                    alt={featuredCover.alt}
                    width={featuredCover.width}
                    height={featuredCover.height}
                    decoding="async"
                  />
                </picture>
                <span className="ecard__role">{featured.role}</span>
              </div>

              <div className="efeature__body">
                <p className="ecard__meta">
                  <span>{featured.format}</span>
                  <span aria-hidden="true">·</span>
                  <span>{dateLabel(featured)}</span>
                </p>

                <h3 className="efeature__title">
                  <Link className="ecard__link" href={`/events/${featured.slug}`}>
                    {featured.title}
                  </Link>
                </h3>

                <p className="efeature__lede">{featured.lede}</p>

                <dl className="efeature__facts">
                  <div>
                    <dt>Hosted by</dt>
                    <dd>{featured.host.name}</dd>
                  </div>
                  <div>
                    <dt>Location</dt>
                    <dd>{featured.host.location}</dd>
                  </div>
                  <div>
                    <dt>Photographs</dt>
                    <dd>{featured.photos.length}</dd>
                  </div>
                </dl>

                <p className="ecard__cta">
                  See the full record
                  <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </p>
              </div>
            </article>
          </div>
        </section>

        {/* ---------------------------------------------------------- Everything else */}
        {rest.length ? (
          <section className="section section--tint" aria-labelledby="more-title">
            <div className="container">
              <div className="section__head">
                <p className="eyebrow" data-reveal="">Also on the record</p>
                <h2 className="section__title" id="more-title" data-reveal="">
                  Earlier events
                </h2>
              </div>

              <div className="elist">
                {rest.map((event, i) => {
                  const cover = photoSources(event, coverPhoto(event));
                  return (
                    <article className="erow" key={event.slug} data-reveal="" data-reveal-delay={i % 3}>
                      <div className="erow__media">
                        <picture>
                          <source
                            type="image/webp"
                            srcSet={cover.webpSrcSet}
                            sizes="(max-width: 800px) 92vw, 340px"
                          />
                          <img
                            src={cover.src}
                            srcSet={cover.srcSet}
                            sizes="(max-width: 800px) 92vw, 340px"
                            alt={cover.alt}
                            width={cover.width}
                            height={cover.height}
                            loading="lazy"
                            decoding="async"
                          />
                        </picture>
                      </div>

                      <div className="erow__body">
                        <p className="ecard__meta">
                          <span>{event.format}</span>
                          <span aria-hidden="true">·</span>
                          <span>{dateLabel(event)}</span>
                        </p>

                        <h3 className="erow__title">
                          <Link className="ecard__link" href={`/events/${event.slug}`}>
                            {event.cardTitle}
                          </Link>
                        </h3>

                        <p className="erow__summary">{event.summary}</p>

                        <p className="erow__foot">
                          <span className="erow__role">{event.role}</span>
                          <span className="ecard__cta">
                            See the full record
                            <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24">
                              <path d="M5 12h14" />
                              <path d="m12 5 7 7-7 7" />
                            </svg>
                          </span>
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* ---------------------------------------------------------------- Close */}
        <section className="section">
          <div className="container">
            <div className="event-cta event-cta--lg">
              <div>
                <h3>Bring a session to your institution</h3>
                <p>
                  The AI awareness session runs in English or Hindi, in your hall, for your
                  whole senior school. Tell us the year groups and the date you have in mind
                  and we will send the outline, the technical requirements and what we need
                  from your side.
                </p>
              </div>
              <Link className="btn btn--primary" href="/#contact">
                Discuss a session
                <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
