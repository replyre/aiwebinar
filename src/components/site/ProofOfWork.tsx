import Link from "next/link";
import EventsRail, { type RailEvent } from "@/components/site/EventsRail";
import { coverPhoto, eventDateLabel, listEvents, photoSources } from "@/lib/events";

/**
 * Proof of work — the field record, as a rail of events with a page behind each one.
 *
 * ⚠️ THE SECTION IS FRAMED AROUND THE ROLE, AND EACH CARD CARRIES ITS OWN. The earlier
 * version put "Prize Pool Sponsor" in the section lede, which read as though sponsoring
 * hackathons were the whole offer — it was one role at one event. The standing description
 * is AI engineer, mentor and speaker; sponsorship is a fact about HACK X VID-YOUTH and it
 * now lives on that event's card, where it is true, instead of over all of them.
 *
 * A school's decision-maker is the reader here. What moves them is not a claim but a room:
 * another school, their board, their students, photographed — and a page they can open to
 * check what was actually delivered. Hence the rail rather than a paragraph, and hence
 * every card being a link rather than a dead tile.
 */
export default function ProofOfWork() {
  const events: RailEvent[] = listEvents().map((event) => {
    const photo = coverPhoto(event);
    const sources = photoSources(event, photo);

    return {
      slug: event.slug,
      cardTitle: event.cardTitle,
      role: event.role,
      format: event.format,
      dateLabel: eventDateLabel(event),
      summary: event.summary,
      location: event.host.location,
      crest: event.host.crest,
      cover: {
        src: sources.src,
        srcSet: sources.srcSet,
        webpSrcSet: sources.webpSrcSet,
        alt: sources.alt,
        width: sources.width,
        height: sources.height,
      },
      photoCount: event.photos.length,
    };
  });

  return (
    <section className="section section--tint" id="proof" aria-labelledby="proof-title">
      <div className="container">
        <div className="section__head section__head--split">
          <div>
            <p className="eyebrow" data-reveal="">Proof of Work</p>
            <h2 className="section__title" id="proof-title" data-reveal="">
              AI engineer, mentor and speaker
            </h2>
          </div>
          <p className="section__lede" data-reveal="" data-reveal-delay="1">
            The programmes are not a slide deck we wrote and never used. They come out of
            rooms we have stood in &mdash; school halls, incubation centres and judging
            panels &mdash; where the same material was delivered to real students and held
            up. Every event below has a page with the photographs and what was covered.
          </p>
        </div>

        <div data-reveal="">
          <EventsRail events={events} />
        </div>

        <div className="event-cta" data-reveal="">
          <div>
            <h3>Bring this session to your institution</h3>
            <p>
              The AI awareness session runs in English or Hindi, in your hall, for your whole
              senior school. We will send the outline and what we need from your side.
            </p>
          </div>
          <div className="event-cta__actions">
            <Link className="btn btn--secondary" href="/events">
              All events
            </Link>
            <Link className="btn btn--primary" href="/#contact">
              Discuss a session
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
