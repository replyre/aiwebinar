import type { Metadata } from "next";
import BrandLogo from "@/components/site/BrandLogo";
import Link from "next/link";
import { notFound } from "next/navigation";
import Gallery from "@/components/site/Gallery";
import SiteFooter from "@/components/site/SiteFooter";
import { coverPhoto, eventDateLabel, getEvent, photoSources } from "@/lib/events";

/**
 * The full record of one event.
 *
 * ⚠️ THIS PAGE IS THE REFERENCE A SCHOOL CHECKS BEFORE SAYING YES, so it is built to be
 * checkable. The host is named with their own crest and their own board affiliation, their
 * write-up is reproduced in the language they wrote it in, and the photographs are the
 * whole hall rather than three flattering crops. Everything on it is something the reader
 * could verify by making one phone call — which is the only kind of proof worth printing.
 *
 * Statically rendered: the content is a module, not a query, so there is nothing to fetch
 * per request and no reason to make a visitor wait for a server round trip.
 */

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * ⚠️ NO `generateStaticParams` HERE, DELIBERATELY. Prerendering two pages off a module
 * constant saves nothing measurable, and it runs in a Jest worker that dies under memory
 * pressure — taking every route in this segment down with it, including the 404, which
 * starts returning 500. Rendering on request costs an object lookup.
 */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Event not found" };

  const cover = photoSources(event, coverPhoto(event));
  return {
    title: `${event.title} | Innovgeist`,
    description: event.summary,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      type: "article",
      title: event.title,
      description: event.summary,
      url: `/events/${event.slug}`,
      images: [{ url: cover.full, alt: cover.alt }],
    },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  /**
   * The hero photo is the cover, in colour.
   *
   * ⚠️ NO DUOTONE. An earlier version ran a navy plate here to hide the source's JPEG
   * artefacts. It hid them, and it also read as a blue wash sitting over the photograph
   * rather than as the photograph — which on a page whose entire job is "this really
   * happened, here is the room" is the wrong trade. The compression is the honest cost of
   * a phone capture; the colour is what makes it look like evidence.
   */
  const hero = photoSources(event, coverPhoto(event));

  const when = eventDateLabel(event);

  /**
   * `Event` schema, so a search result for the host's name can surface this page.
   *
   * ⚠️ THE HOST IS THE ORGANIZER, NOT US. An earlier version named Innovgeist here, which
   * on the SIH page would have been a machine-readable claim that we ran Smart India
   * Hackathon's internal round at IET Lucknow. We were on its jury. `contributor` is the
   * honest slot for that, and `performer` is added only where we actually took the room.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationEvent",
    name: event.title,
    description: event.summary,
    startDate: event.date,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.host.name,
      address: { "@type": "PostalAddress", addressLocality: event.host.location, addressCountry: "IN" },
    },
    organizer: { "@type": "Organization", name: event.host.name },
    contributor: { "@type": "Organization", name: "Innovgeist Technologies Private Limited" },
    ...(event.role.includes("Speaker")
      ? { performer: { "@type": "Person", name: "Atul Kumar Verma" } }
      : {}),
  };

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <script
        type="application/ld+json"
        // Serialised from a module constant — no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="course-bar">
        <div className="container course-bar__inner">
          <Link className="course-bar__brand" href="/" aria-label="Innovgeist — home">
            <BrandLogo width={150} height={25} />
          </Link>
          <div className="course-bar__right">
            <Link className="btn btn--ghost btn--sm" href="/events">
              All events
            </Link>
            <Link className="btn btn--ghost btn--sm" href="/#contact">
              For institutions
            </Link>
          </div>
        </div>
      </header>

      <main id="main">
        {/* ---------------------------------------------------------------- Hero */}
        <section className="ehero">
          <div className="container ehero__inner">
            <div className="ehero__text">
              <p className="eyebrow eyebrow--onDark">{event.format}</p>
              {/**
               * ⚠️ THE VENUE, NOT `event.title`. The full title is "AI Awareness Webinar —
               * Shri Vishwanath Inter College, Kalan": 58 characters, which at hero size
               * breaks across three ragged lines, and whose first half is already sitting
               * immediately above it in the eyebrow. Dropping the repeated half makes the
               * heading both shorter and non-redundant. `event.title` still carries the
               * full string wherever it has no eyebrow beside it — `<title>`, the OG tags
               * and the JSON-LD.
               */}
              <h1 className="ehero__title">{event.cardTitle}</h1>
              <p className="ehero__lede">{event.lede}</p>

              <dl className="ehero__facts">
                <div>
                  <dt>Date</dt>
                  <dd>{when}</dd>
                </div>
                <div>
                  <dt>Venue</dt>
                  <dd>{event.host.name}</dd>
                </div>
                <div>
                  <dt>Our role</dt>
                  <dd>{event.role}</dd>
                </div>
                {event.attendance ? (
                  <div>
                    <dt>Attendance</dt>
                    <dd>{event.attendance}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <figure className="ehero__plate">
              <picture>
                <source type="image/webp" srcSet={hero.webpSrcSet} sizes="(max-width: 900px) 92vw, 560px" />
                <img
                  src={hero.src}
                  srcSet={hero.srcSet}
                  sizes="(max-width: 900px) 92vw, 560px"
                  alt={hero.alt}
                  width={hero.width}
                  height={hero.height}
                  decoding="async"
                />
              </picture>
            </figure>
          </div>
        </section>

        {/* ------------------------------------------------------ What was covered */}
        <section className="section" aria-labelledby="covered-title">
          <div className="container">
            <div className="section__head section__head--split">
              <div>
                <p className="eyebrow" data-reveal="">On the day</p>
                <h2 className="section__title" id="covered-title" data-reveal="">
                  What was covered
                </h2>
              </div>
              <p className="section__lede" data-reveal="" data-reveal-delay="1">
                {event.coveredLede ??
                  "The session was built for students who had heard of AI and never been shown it — so it starts at what the thing is and ends at what to do on Monday."}
              </p>
            </div>

            <ol className="covered">
              {event.covered.map((item, i) => (
                <li className="covered__item" key={item.title} data-reveal="" data-reveal-delay={i % 3}>
                  <span className="covered__n" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ------------------------------------------------------- The institution */}
        <section className="band band--dark" aria-labelledby="host-title">
          <div className="container section">
            <div className="host">
              {event.host.crest ? (
                <span className="host__crest">
                  {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size crest. */}
                  <img
                    src={event.host.crest}
                    alt={`${event.host.name} crest`}
                    width="120"
                    height="112"
                    loading="lazy"
                    decoding="async"
                  />
                </span>
              ) : null}

              <div className="host__body">
                <p className="subhead subhead--onDark" id="host-title">
                  Hosted by
                </p>
                <h2 className="host__name">{event.host.name}</h2>
                {event.host.nameHi ? <p className="host__name-hi" lang="hi">{event.host.nameHi}</p> : null}

                <dl className="host__facts">
                  <div>
                    <dt>Location</dt>
                    <dd>{event.host.location}</dd>
                  </div>
                  {event.host.affiliation ? (
                    <div>
                      <dt>Affiliated to</dt>
                      <dd>{event.host.affiliation}</dd>
                    </div>
                  ) : null}
                  {event.host.managedBy ? (
                    <div>
                      <dt>Managed by</dt>
                      <dd>{event.host.managedBy}</dd>
                    </div>
                  ) : null}
                </dl>

                {event.host.website ? (
                  <a
                    className="btn btn--secondary btn--sm btn--onDark"
                    href={event.host.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit {event.host.name}
                    <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M7 17 17 7" />
                      <path d="M8 7h9v9" />
                    </svg>
                  </a>
                ) : null}
              </div>
            </div>

            {event.report ? (
              <figure className="report" lang={event.report.language}>
                <blockquote className="report__body">{event.report.body}</blockquote>
                <figcaption className="report__by">
                  {event.host.name} &mdash; their own account of the day
                  {event.report.translatedFrom === "hi" ? ", translated from Hindi" : null}
                </figcaption>
              </figure>
            ) : null}

            {event.quote ? (
              <figure className="pullquote">
                <blockquote>&ldquo;{event.quote.text}&rdquo;</blockquote>
                <figcaption>
                  {event.quote.author}, {event.quote.role}
                </figcaption>
              </figure>
            ) : null}
          </div>
        </section>

        {/* ------------------------------------------------------------- The room */}
        <section className="section section--tint" aria-labelledby="photos-title">
          <div className="container">
            <div className="section__head section__head--split">
              <div>
                <p className="eyebrow" data-reveal="">The room</p>
                <h2 className="section__title" id="photos-title" data-reveal="">
                  Photographs from the session
                </h2>
              </div>
              <p className="section__lede" data-reveal="" data-reveal-delay="1">
                Shot on the day, uncropped and unstaged. Select any photograph to open it
                full size.
              </p>
            </div>

            {/* The wrapper is what `.event-gallery` hangs off — `Gallery` owns its own
                `ul.gallery` and takes no className, so the wide crop is applied from
                outside rather than by threading a prop through a shared component. */}
            <div className="event-gallery">
              <Gallery>
              {event.photos.map((photo, i) => {
                const source = photoSources(event, photo);
                return (
                  <li key={photo.name} data-reveal="" data-reveal-delay={i % 3}>
                    <button
                      className="gallery__btn"
                      type="button"
                      data-full={source.full}
                      data-caption={source.caption}
                    >
                      <picture>
                        <source
                          type="image/webp"
                          srcSet={source.webpSrcSet}
                          sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 480px"
                        />
                        <img
                          src={source.src}
                          srcSet={source.srcSet}
                          sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 480px"
                          alt={source.alt}
                          width={source.width}
                          height={source.height}
                          loading="lazy"
                          decoding="async"
                        />
                      </picture>
                      <span className="gallery__zoom" aria-hidden="true">
                        <svg className="icon icon--sm" viewBox="0 0 24 24">
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.5-3.5" />
                          <path d="M11 8v6" />
                          <path d="M8 11h6" />
                        </svg>
                      </span>
                      <span className="gallery__overlay">
                        <b>{source.caption}</b>
                      </span>
                    </button>
                  </li>
                );
              })}
              </Gallery>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- Close */}
        <section className="section">
          <div className="container">
            <div className="event-cta event-cta--lg">
              <div>
                <h3>{event.cta?.title ?? "Run this session at your school"}</h3>
                <p>
                  {event.cta?.body ??
                    "Same session, your hall, English or Hindi. Tell us the year groups and the date you have in mind and we will send the outline, the technical requirements and what we need from your side."}
                </p>
              </div>
              <Link className="btn btn--primary" href="/#contact">
                {event.cta ? "Talk to us" : "Discuss a session"}
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
