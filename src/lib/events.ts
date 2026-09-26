/**
 * The field record: sessions and events Innovgeist has actually run, in the room.
 *
 * ⚠️ THIS IS THE ONLY COPY OF THESE FACTS. The home-page rail and the `/events/[slug]`
 * detail pages both read from here, so a date corrected in this file is corrected in both
 * places. Adding the next school is a new object in `EVENTS` — not a new component.
 *
 * ⚠️ NOTHING IN HERE IS ESTIMATED. Head counts, feedback quotes and outcome numbers are the
 * things a reader will check hardest and the things we have the least right to guess, so
 * where the record is silent the field is simply absent and the page drops the row. An
 * empty slot is invisible; an invented "500+ students" is a claim a principal can disprove
 * by asking one colleague. `attendance` and `quote` exist as optional fields precisely so
 * real numbers and real words can be dropped in later without touching the markup.
 */

export interface EventPhoto {
  /** Basename under `/assets/img/events/`, without extension or `@2x`. */
  name: string;
  alt: string;
  caption: string;
  /** Intrinsic size of the **1x** rendition — also what sets the box's aspect ratio. */
  width: number;
  height: number;
  /**
   * Intrinsic width of the `@2x` rendition.
   *
   * ⚠️ STATED, NOT DOUBLED. It is exactly `2 * width` for everything built by
   * `scripts/build-event-images.mjs`, but the older hackathon set was cut to whatever its
   * originals allowed — 800w paired with 1504w for one of them and 1600w for the other two.
   * A `srcSet` that claims 1600w for a 1504px file makes the browser pick it at a width it
   * cannot actually fill, which is the exact upscaling this whole pipeline exists to avoid.
   */
  retinaWidth: number;
}

export interface EventHost {
  name: string;
  /** Devanagari name as the institution itself writes it. */
  nameHi?: string;
  /** Path to the institution's own crest, shown at badge size beside its name. */
  crest?: string;
  location: string;
  /** Board or university the institution is affiliated to. */
  affiliation?: string;
  /** Society or trust that runs the institution, where it differs from the name. */
  managedBy?: string;
  website?: string;
}

export interface SiteEvent {
  slug: string;
  /** Short label for the rail card — the venue, not the programme. */
  cardTitle: string;
  title: string;
  /** The role Innovgeist actually played *at this event*, and nowhere else. */
  role: string;
  /** ISO date. Rendered through `formatEventDate` so the timezone is pinned once. */
  date: string;
  /**
   * The closing day, for an event that ran across more than one.
   *
   * ⚠️ IT IS A SECOND DAY, NOT A SPAN. The SIH round ran on the 19th and the 21st —
   * there was no event on the 20th — so `eventDateLabel` joins the two with "&" rather
   * than an en dash. If an event ever genuinely runs straight through, that is a different
   * label and this field is the wrong shape for it.
   */
  dateEnd?: string;
  /** e.g. "AI Awareness Webinar" — what the institution called it. */
  format: string;
  /** One line for the rail card. */
  summary: string;
  /** Lede for the detail page. */
  lede: string;
  host: EventHost;
  /** What was actually covered, as delivered. */
  covered: { title: string; body: string }[];
  /**
   * The standfirst above `covered`, where the page's default does not fit.
   *
   * ⚠️ THE DEFAULT IS WRITTEN FOR A SCHOOL SESSION — "students who had heard of AI and
   * never been shown it". On a hackathon page that sentence is simply untrue, and a
   * paragraph that is visibly about the wrong event undoes exactly the credibility these
   * pages exist to build. Absent, the school wording stands.
   */
  coveredLede?: string;
  /**
   * The closing call to action, same reason: "Run this session at your school" is the
   * right ask under a webinar record and the wrong one under a judging panel.
   */
  cta?: { title: string; body: string };
  photos: EventPhoto[];
  /** The lead photo for the rail card — a name from `photos`. */
  cover: string;
  /**
   * The institution's own write-up.
   *
   * ⚠️ IF `translatedFrom` IS SET, THE PAGE SAYS SO. These are somebody else's words about
   * their own event; running a translation under their name without labelling it puts
   * sentences in their mouth that they never wrote. `language` is what `body` is actually
   * in — it drives the `lang` attribute, so screen readers and the browser's own
   * translator get it right.
   */
  report?: { language: "hi" | "en"; translatedFrom?: "hi" | "en"; body: string };
  /** Confirmed head count. Absent until somebody confirms it — never estimated. */
  attendance?: string;
  /** Attributed words from the host. Absent until we have them in writing. */
  quote?: { text: string; author: string; role: string };
}

const SVNIC: EventHost = {
  name: "Shri Vishwanath Inter College",
  crest: "/assets/img/events/svnic-crest.png",
  location: "Kalan, Sultanpur, Uttar Pradesh",
  affiliation: "Madhyamik Shiksha Parishad, Uttar Pradesh (UP Board)",
  managedBy: "Shri Aryavart Madhyamik Pathshala, Kalan, Kadipur, Sultanpur",
  website: "https://svnic.in/",
};

export const EVENTS: SiteEvent[] = [
  {
    slug: "sih-2026-hackathon-iet-lucknow",
    cardTitle: "SIH 2026 Hackathon, IET Lucknow",
    title: "Smart India Hackathon 2026 — IET Lucknow",
    role: "Jury Panel · Mentor",
    date: "2026-09-19",
    dateEnd: "2026-09-21",
    format: "Hackathon",
    summary:
      "Seventy-three student teams pitched solutions to national problem statements over " +
      "two days, across two parallel panels — Innovgeist sat on the jury and mentored teams.",
    lede:
      "The Incubation Center at IET Lucknow, with its Institution's Innovation Council, ran " +
      "the qualifying round for Smart India Hackathon 2026 across two days. " +
      "Seventy-three teams presented; two evaluation panels ran in parallel to get through " +
      "them. Innovgeist was on the jury for those rounds and mentoring teams alongside it.",
    host: {
      name: "Incubation Center, IET Lucknow",
      location: "Kalam Hall, NNF Building, IET Lucknow, Uttar Pradesh",
      affiliation: "Dr. A.P.J. Abdul Kalam Technical University",
      managedBy: "In association with the Institution's Innovation Council (IIC)",
    },
    coveredLede:
      "Judging a qualifying round is not scoring a demo. It is deciding which of " +
      "seventy-three ideas is worth another six months of somebody's time — so this is " +
      "what the panel actually pressed each team on.",
    covered: [
      {
        title: "Understanding of the problem",
        body:
          "Whether the team could state the problem statement in their own words, and name " +
          "who actually suffers from it — before they said a word about their solution.",
      },
      {
        title: "Technical approach",
        body:
          "What they had built against what they had described: the stack, the parts that " +
          "were working, and the parts still standing in as a slide.",
      },
      {
        title: "Innovation and feasibility",
        body:
          "Held together deliberately. An idea nobody has tried is worth little if it " +
          "cannot be built by this team in the time SIH actually gives them.",
      },
      {
        title: "Potential impact",
        body:
          "Who uses it, at what scale, and what changes for them — the test a prototype " +
          "has to pass before it is worth taking to the national round or incubating.",
      },
    ],
    photos: [
      {
        name: "sih2026-award",
        alt: "A certificate and memento being presented in Kalam Hall in front of the Smart India Hackathon 2026 slide.",
        caption:
          "Certificate and memento presented in Kalam Hall, under the hackathon slide.",
        width: 800,
        height: 534,
        retinaWidth: 1600,
      },
      {
        name: "sih2026-cohort",
        alt: "Participating teams, faculty and jury members gathered with their certificates outside the NNF Building at IET Lucknow, beside the Smart India Hackathon 2026 banner.",
        caption:
          "Teams, faculty and panel outside the NNF Building at the close of the hackathon.",
        width: 800,
        height: 534,
        retinaWidth: 1600,
      },
    ],
    cover: "sih2026-award",
    report: {
      language: "en",
      body:
        "The Incubation Center, Institute of Engineering and Technology Lucknow, in " +
        "association with IIC, has successfully conducted the SIH 2026 Internal Hackathon " +
        "on 19th and 21st September 2026. A total of 73 student teams presented their " +
        "innovative solutions to real-world problem statements under Smart India Hackathon " +
        "2026. To ensure a smooth and structured evaluation, the presentations were " +
        "conducted over two days with two evaluation panels running in parallel. The teams " +
        "showcased their understanding of the problem, proposed solutions, technical " +
        "approach, innovation, feasibility and potential impact. This is an important step " +
        "towards identifying and nurturing promising student innovations for SIH, prototype " +
        "development and future incubation.",
    },
    attendance: "73 student teams",
    cta: {
      title: "Running a hackathon or an evaluation round?",
      body:
        "We judge, mentor and sponsor student hackathons — the same panel work as above. " +
        "Tell us the dates, the format and the number of teams and we will tell you what " +
        "we can cover.",
    },
  },
  {
    slug: "svnic-kalan-ai-awareness-webinar",
    cardTitle: "Shri Vishwanath Inter College, Kalan",
    title: "AI Awareness Webinar — Shri Vishwanath Inter College, Kalan",
    role: "Speaker",
    date: "2026-09-13",
    format: "AI Awareness Webinar",
    summary:
      "A full-school session on what AI is, how it works, and how students can use it in " +
      "study and daily life — delivered in the college hall by one of its own alumni.",
    lede:
      "Shri Vishwanath Inter College invited Innovgeist to open artificial intelligence up " +
      "for its students — not as a subject on a syllabus, but as something they could start " +
      "using the same week. The session ran in the main hall, in Hindi, to the senior school.",
    host: SVNIC,
    covered: [
      {
        title: "What AI actually is",
        body:
          "Where the term comes from, what separates it from ordinary software, and what a " +
          "model is doing when it answers — set out without jargon and without hype.",
      },
      {
        title: "How it works",
        body:
          "How a system learns from examples rather than from rules, why that makes it " +
          "confident and wrong in the same breath, and what that means for trusting an answer.",
      },
      {
        title: "AI as your personal tutor",
        body:
          "Using AI to explain a concept a third way when the textbook and the teacher have " +
          "both been tried — the students' own weakest subject as the working example.",
      },
      {
        title: "In education and daily life",
        body:
          "Where it already sits in the tools students use, the everyday tasks it genuinely " +
          "helps with, and the line between using it to learn and using it to avoid learning.",
      },
    ],
    photos: [
      {
        name: "svnic-hall",
        alt: "Students filling the main hall at Shri Vishwanath Inter College during the AI Awareness Webinar, with the presentation on screen.",
        caption: "The main hall, senior school seated — the session opens on “AI as your personal tutor”.",
        width: 576,
        height: 260,
        retinaWidth: 1152,
      },
      {
        name: "svnic-students",
        alt: "Students in the front rows listening as Atul Kumar Verma speaks from the floor of the hall.",
        caption: "Delivered from the floor rather than the stage, working the front rows directly.",
        width: 576,
        height: 260,
        retinaWidth: 1152,
      },
      {
        name: "svnic-audience",
        alt: "Wide view of the packed college hall during the AI Awareness Webinar.",
        caption: "The full hall, seated to the back wall.",
        width: 404,
        height: 220,
        retinaWidth: 808,
      },
      {
        name: "svnic-speaker",
        alt: "Atul Kumar Verma addressing students with a microphone, stage placards behind him.",
        caption: "Atul Kumar Verma — AI engineer, and an alumnus of the college.",
        width: 404,
        height: 220,
        retinaWidth: 808,
      },
      {
        name: "svnic-qa",
        alt: "Students standing at the front of the hall in conversation with the speaker during the question round.",
        caption: "The question round — students taking it to the front rather than raising hands.",
        width: 404,
        height: 220,
        retinaWidth: 808,
      },
    ],
    cover: "svnic-hall",
    report: {
      language: "en",
      translatedFrom: "hi",
      body:
        "An AI Awareness Webinar was held today for the students of Shri Vishwanath Inter " +
        "College, Kalan, Sultanpur. On this occasion Shri Atul Kumar Verma — an alumnus of " +
        "the college — explained artificial intelligence to the students in detail. He told " +
        "them what artificial intelligence is, how it works, and how it can be used in " +
        "education and in everyday life.",
    },
  },
  {
    slug: "hack-x-vid-youth-iet-lucknow",
    cardTitle: "HACK X VID-YOUTH, IET Lucknow",
    title: "HACK X VID-YOUTH — Kalam Hall Incubation Center, IET Lucknow",
    role: "Prize Pool Sponsor · Evaluator · Mentor",
    date: "2026-01-01",
    format: "Hackathon",
    summary:
      "Backing the innovation ecosystem directly — funding the prize pool, sitting on the " +
      "evaluation panel, and mentoring teams through the build.",
    lede:
      "Beyond the classroom, Innovgeist backs the innovation ecosystem directly. At HACK X " +
      "VID-YOUTH, hosted at the Kalam Hall Incubation Center, that meant funding the prize " +
      "pool, judging the assessment rounds, and mentoring teams through their builds.",
    host: {
      name: "Kalam Hall Incubation Center, IET Lucknow",
      location: "Lucknow, Uttar Pradesh",
    },
    covered: [
      {
        title: "Prize pool sponsorship",
        body:
          "Innovgeist funded the prize pool for the hackathon, so the teams that built the " +
          "strongest work went home with something more than a certificate.",
      },
      {
        title: "Evaluation panel",
        body:
          "Sitting on the judging panel across the assessment rounds, scoring the builds on " +
          "what they actually did rather than on how they pitched.",
      },
      {
        title: "Mentorship",
        body:
          "Working with teams during the build — scoping problems down to something " +
          "shippable in the hours available, and unblocking the technical dead ends.",
      },
    ],
    photos: [
      {
        name: "hackxvid-certificate",
        alt: "Innovgeist receiving a certificate of appreciation alongside faculty at HACK X VID-YOUTH, IET Lucknow.",
        caption:
          "Certificate of appreciation presented to Innovgeist at HACK X VID-YOUTH, Kalam Hall Incubation Center, IET Lucknow.",
        width: 800,
        height: 534,
        retinaWidth: 1504,
      },
      {
        name: "hackxvid-address",
        alt: "Atul Kumar Verma addressing participants and faculty at HACK X VID-YOUTH, IET Lucknow.",
        caption:
          "Addressing participants and faculty at the HACK X VID-YOUTH hackathon, IET Lucknow.",
        width: 800,
        height: 534,
        retinaWidth: 1600,
      },
      {
        name: "hackxvid-evaluation",
        alt: "Evaluation panel seated ahead of the first assessment round at HACK X VID-YOUTH, IET Lucknow.",
        caption:
          "Evaluation panel ahead of the first assessment round at HACK X VID-YOUTH, IET Lucknow.",
        width: 800,
        height: 534,
        retinaWidth: 1600,
      },
    ],
    cover: "hackxvid-address",
  },
];

/**
 * ⚠️ THE HACKATHON PHOTOS LIVE IN `gallery/`, THE SCHOOL PHOTOS IN `events/`. The hackathon
 * set was published before this module existed and is already referenced by that path in
 * the wild, so it keeps it rather than being moved for tidiness.
 */
export function photoDir(event: SiteEvent): string {
  return event.slug === "hack-x-vid-youth-iet-lucknow"
    ? "/assets/img/gallery"
    : "/assets/img/events";
}

/**
 * The four attributes a `<picture>` needs for one photo, built once from the record.
 *
 * `w` descriptors rather than `1x`/`2x`, because the same photo is laid out at three
 * different widths across the site — a 480px rail card, a 560px gallery tile, a full-width
 * hero plate — and only `w` plus a `sizes` attribute lets the browser weigh the real CSS
 * width against the device's pixel ratio. With `2x` descriptors it can only ever guess.
 */
export function photoSources(event: SiteEvent, photo: EventPhoto) {
  const base = `${photoDir(event)}/${photo.name}`;
  return {
    src: `${base}.jpg`,
    srcSet: `${base}.jpg ${photo.width}w, ${base}@2x.jpg ${photo.retinaWidth}w`,
    webpSrcSet: `${base}.webp ${photo.width}w, ${base}@2x.webp ${photo.retinaWidth}w`,
    full: `${base}@2x.jpg`,
    alt: photo.alt,
    caption: photo.caption,
    width: photo.width,
    height: photo.height,
  };
}

/** The record's cover photo, or its first, so a card always has something to show. */
export function coverPhoto(event: SiteEvent): EventPhoto {
  return event.photos.find((photo) => photo.name === event.cover) ?? event.photos[0];
}

export function getEvent(slug: string): SiteEvent | undefined {
  return EVENTS.find((event) => event.slug === slug);
}

/** Newest first — the rail leads with the most recent work, which is the point of it. */
export function listEvents(): SiteEvent[] {
  return [...EVENTS].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Pinned to `Asia/Kolkata` for the same reason the course helpers are: the audience, the
 * venue and the office are all IST, and a server in another region must not shift a date
 * that people will compare against their own memory of the day.
 */
export function formatEventDate(iso: string): string {
  return new Date(`${iso}T06:00:00Z`).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Year alone, for the events whose exact day we have not confirmed. */
export function formatEventYear(iso: string): string {
  return iso.slice(0, 4);
}

/**
 * The one date string every surface prints.
 *
 * ⚠️ IT LIVES HERE BECAUSE IT USED TO LIVE IN THREE PLACES. The rail, the index and the
 * detail page each had their own `dateLabel` with the same `-01-01` check copy-pasted into
 * it, so the two-day SIH round would have had to be taught to all three separately — and
 * the fourth surface would have got it wrong. One event, one label.
 *
 * `-01-01` is the sentinel for "we have the year and not the day" (the hackathon record),
 * and it prints the year alone rather than inventing a New Year's Day session.
 */
export function eventDateLabel(event: SiteEvent): string {
  if (event.date.endsWith("-01-01")) return formatEventYear(event.date);

  const start = formatEventDate(event.date);
  if (!event.dateEnd) return start;

  // "19 & 21 September 2026" — the second day carries the month and year, so the first is
  // cut back to its day number. Across a month boundary that shortening would lose the
  // month, so both dates are printed in full instead.
  const end = formatEventDate(event.dateEnd);
  const sameMonth = event.date.slice(0, 7) === event.dateEnd.slice(0, 7);
  return sameMonth ? `${start.split(" ")[0]} & ${end}` : `${start} & ${end}`;
}
