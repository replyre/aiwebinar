import { Noto_Sans_Devanagari } from "next/font/google";
import BrandLogo from "@/components/site/BrandLogo";
import LangSwitch from "@/components/webinar/LangSwitch";
import StickyJoinBar from "@/components/webinar/StickyJoinBar";
import TutorDemo from "@/components/webinar/TutorDemo";
import { organizationJsonLd } from "@/lib/seo";
import { WEBINAR_COPY, WEBINAR_PATH, WEBINAR_PHOTOS, WEBINAR_START, joinHref, type WebinarLang } from "@/lib/webinar";
import "@/styles/webinar.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiwebinar.innovgeist.com";

/**
 * ⚠️ DEVANAGARI IS LOADED HERE, NOT IN THE ROOT LAYOUT. Every other page is English and
 * would pay for a font it never draws. Here it is the body face — Inter covers the Latin
 * runs ("AI", "JEE", numbers) and the browser falls through to this for the Devanagari ones,
 * downloading only the `devanagari` unicode-range file.
 *
 * 400 and 600 only. Headings ask for 600, which Poppins (loaded at 700/800 in the root) maps
 * up to its 700 and this face meets exactly — one fewer file than a third weight would cost.
 */
const devanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-deva",
});

/* -------------------------------------------------------------------------- */
/*  Icons — drawn for this page, 1.8px strokes on a 24 grid.                   */
/* -------------------------------------------------------------------------- */

function WhatsAppIcon() {
  return (
    <svg className="wb-ico" width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .9a4.4 4.4 0 0 1-2.3-2.3l.9-1-1-2Z" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CheckBadge({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="9" cy="9" r="8" fill="currentColor" />
      <path d="M5 9.3 7.8 12 13 6.5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SealIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 30 30" aria-hidden="true">
      <path d="M15 2.5 18 5.2l4-.4.9 3.9 3.5 2-1.7 3.7 1.7 3.6-3.5 2-.9 3.9-4-.4-3 2.7-3-2.7-4 .4-.9-3.9-3.5-2 1.7-3.6-1.7-3.7 3.5-2 .9-3.9 4 .4Z" fill="currentColor" />
      <path d="M10 15.2 13.4 18.5 20 11.8" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M9 1.5 15 4v4.5c0 4-2.6 6.6-6 8-3.4-1.4-6-4-6-8V4Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M6.2 9 8.2 11 12 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="wb-spark" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5 14 10l7.5 2-7.5 2-2 7.5-2-7.5-7.5-2L10 10Z" fill="currentColor" />
    </svg>
  );
}

function CountIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4v16M9.5 4v16M14 4v16M18.5 4v16M3 15 21 9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5.5M12 7.6v.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PointerIcon() {
  return (
    <svg className="wb-pointer" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l.4-.1a1.5 1.5 0 0 1 2.6.9v.4a1.5 1.5 0 0 1 2.6.9v.6a1.5 1.5 0 0 1 2.4 1.2V17a5 5 0 0 1-5 5h-2.2a5 5 0 0 1-3.9-1.9l-3.3-4.2a1.5 1.5 0 0 1 2.3-1.9L9 15.3Z"
        fill="#fff"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5Zm16 0A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

/** The three stages of the tutor diagram: light in, raw materials in, products out. */
const FLOW_ICONS = [
  <svg key="sun" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="4.2" fill="currentColor" />
    <g className="wb-sun-rays" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.5 1.5M17.2 17.2l1.5 1.5M5.3 18.7l1.5-1.5M17.2 6.8l1.5-1.5" />
    </g>
  </svg>,
  <svg key="water" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M9 3.5S4.5 9 4.5 12a4.5 4.5 0 0 0 9 0C13.5 9 9 3.5 9 3.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M15.5 9h5M16.5 13h4.5M15.5 17h3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>,
  <svg key="leaf" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M5 19C5 10 10.5 5 20 4.5 19.5 14 14.5 19.5 5.5 19.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M5 19.5 13 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>,
];

/** Fact-bar and parent-row glyphs, keyed so the copy file never has to carry markup. */
const FACT_ICONS = [
  <CalendarIcon key="date" size={20} />,
  <svg key="mode" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 20h8M12 17v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="11" r="2" fill="currentColor" />
  </svg>,
  <svg key="lang" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 5h9M8.5 3v2M6 5c.6 3 2.6 5.4 5 6.5M11 5c-.6 3.4-3 6-6 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M13 21l4-9 4 9M14.5 18h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
  <svg key="fee" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7 5h10M7 9h10M7 5c5 0 7 1.6 7 4s-2 4-7 4l7 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>,
];

const PARENT_ICONS = [
  FACT_ICONS[3],
  FACT_ICONS[2],
  <svg key="sprout" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21v-9M12 12c0-4 3-6 7-6 0 4-3 6-7 6ZM12 15c0-3-2.4-5-6-5 0 3 2.4 5 6 5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
  </svg>,
];

/* -------------------------------------------------------------------------- */
/*  Photos — the Kalan session, upscaled for this page's full-width layout.    */
/* -------------------------------------------------------------------------- */

const PHOTO_DIR = "/assets/img/webinar";

/**
 * `<picture>` with WebP first and a JPEG fallback, from the renditions in `WEBINAR_PHOTOS`.
 *
 * ⚠️ THE WEBP IS WHAT ACTUALLY LOADS. Every current browser takes the WebP `<source>` and
 * never requests the JPEG — so editing only the `.jpg` changes nothing on screen. Replace
 * the source in `source-assets/webinar/` and re-run the build script; both formats follow.
 */
function WebinarPicture({
  name,
  alt,
  sizes,
  priority = false,
}: {
  name: keyof typeof WEBINAR_PHOTOS;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const photo = WEBINAR_PHOTOS[name];
  const set = (ext: string) => photo.widths.map((w) => `${PHOTO_DIR}/${name}-${w}.${ext} ${w}w`).join(", ");
  const largest = photo.widths[photo.widths.length - 1];
  return (
    <picture>
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      <img
        src={`${PHOTO_DIR}/${name}-${largest}.jpg`}
        srcSet={set("jpg")}
        sizes={sizes}
        width={photo.width}
        height={photo.height}
        alt={alt}
        decoding="async"
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}

/**
 * Copy can write `{wa}` where the word "WhatsApp" goes; it renders as the logo, with the
 * word kept as its accessible name so screen readers still say "WhatsApp".
 */
function withLogo(text: string): React.ReactNode {
  const parts = text.split("{wa}");
  if (parts.length === 1) return text;
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <span key={i} className="wb-wa" role="img" aria-label="WhatsApp">
            <WhatsAppIcon />
          </span>,
          part,
        ],
  );
}

function JoinButton({ href, label, id, compact = false }: { href: string; label: string; id?: string; compact?: boolean }) {
  return (
    <a id={id} className={`wb-btn${compact ? " wb-btn--sm" : ""}`} href={href}>
      <WhatsAppIcon />
      <span>{label}</span>
    </a>
  );
}

function EyebrowArrow({ flip = false }: { flip?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={flip ? { scale: "-1 1" } : undefined}>
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** `both` frames a centred label with an arrow on each side, the right one pointing back in. */
function Eyebrow({
  children,
  tone = "ink",
  both = false,
}: {
  children: React.ReactNode;
  tone?: "ink" | "sky";
  both?: boolean;
}) {
  return (
    <p className={`wb-eyebrow wb-eyebrow--${tone}`}>
      <EyebrowArrow />
      {children}
      {both && <EyebrowArrow flip />}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  Structured data                                                            */
/* -------------------------------------------------------------------------- */

function webinarJsonLd(lang: WebinarLang) {
  const site = SITE_URL.replace(/\/+$/, "");
  const t = WEBINAR_COPY[lang];
  const url = `${site}${WEBINAR_PATH[lang]}`;
  const inLanguage = lang === "hi" ? "hi-IN" : "en-IN";
  const image = `${site}/assets/img/webinar/og-webinar-${lang}.jpg`;

  // The organisation and Atul's Person node are already on the page, from the root layout;
  // these reference them by `@id` rather than describing them a second time.
  const org = organizationJsonLd(site)["@graph"][0]["@id"];
  const person = organizationJsonLd(site)["@graph"][2]["@id"];

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: t.meta.title,
      description: t.meta.description,
      inLanguage,
      isPartOf: { "@id": `${site}/#website` },
      publisher: { "@id": org },
      primaryImageOfPage: image,
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      inLanguage,
      mainEntity: t.faq.items.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  ];

  if (WEBINAR_START) {
    graph.push({
      "@type": "Event",
      "@id": `${url}#event`,
      name: `${t.h1.before}${t.h1.em}${t.h1.after}`.trim(),
      description: t.meta.description,
      startDate: WEBINAR_START,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
      location: { "@type": "VirtualLocation", url },
      isAccessibleForFree: true,
      inLanguage: ["hi-IN", "en-IN"],
      image,
      organizer: { "@id": org },
      performer: { "@id": person },
      audience: { "@type": "EducationalAudience", educationalRole: "student" },
      offers: { "@type": "Offer", price: 0, priceCurrency: "INR", availability: "https://schema.org/InStock", url },
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The webinar join page. One job: get a tap on the green button.
 *
 * ⚠️ NO SITE HEADER, NO NAV, NO SITE FOOTER — DELIBERATELY. This is the destination of paid
 * ads; every link that is not the CTA is a way to spend the click on something else. The
 * only exits are the language switch and the two legal pages the privacy notice points to.
 *
 * ⚠️ THE MOTION IS PROGRESSIVE AND ALMOST ALL OF IT IS CSS. Parallax runs on scroll-driven
 * animations (`animation-timeline`), which the compositor drives off the main thread — on a
 * ₹8,000 Android phone that is the difference between smooth and janky. Browsers without
 * them get the same page, still. Reveals reuse the site-wide `[data-reveal]` observer in
 * `ScrollEffects`. Everything is off under `prefers-reduced-motion`.
 */
export default function WebinarPage({ lang }: { lang: WebinarLang }) {
  const t = WEBINAR_COPY[lang];
  const { tutor, quiz, check } = t.learn;

  return (
    <div className={`wb ${devanagari.variable}`} lang={lang === "hi" ? "hi" : "en"}>
      <a className="skip-link" href="#main">
        {t.skip}
      </a>

      {/* Laid over the hero rather than inside it, so `<main>` can hold the whole page. */}
      <header className="wb-top">
        <div className="wb-wrap wb-top__inner">
          <span className="wb-top__brand">
            <BrandLogo tone="light" width={150} height={25} />
          </span>
          <LangSwitch current={lang} label={t.langLabel} />
        </div>
      </header>

      <main id="main">
        {/* ============================== HERO ============================== */}
        <section className="wb-hero" aria-labelledby="wb-title">
          {/* The photo bleeds off the right edge on a desktop and runs edge to edge under
              the copy on a phone — a real room, not a framed thumbnail. */}
          <div className="wb-hero__media">
            <div className="wb-hero__img">
              <WebinarPicture
                name="students"
                alt={t.trust.photoAlt}
                sizes="(min-width: 960px) 58vw, 100vw"
                priority
              />
            </div>
          </div>

          <div className="wb-wrap wb-hero__inner">
            <div className="wb-hero__copy">
              <h1 id="wb-title" className="wb-h1">
                {t.h1.before}
                <span className="wb-h1__em">{t.h1.em}</span>
                {t.h1.after}
              </h1>

              <p className="wb-lede">
                {t.sub.text}
                <strong>{t.sub.strong}</strong>
              </p>

              <div className="wb-hero__cta">
                <JoinButton id="wb-hero-cta" href={joinHref(lang, "hero")} label={t.cta} />
                <p className="wb-note">
                  <CalendarIcon />
                  {t.ctaNote}
                </p>
              </div>

              <div className="wb-host">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="wb-host__img"
                  src="/assets/img/atul-kumar-verma.webp"
                  srcSet="/assets/img/atul-kumar-verma.webp 1x, /assets/img/atul-kumar-verma@2x.webp 2x"
                  width={48}
                  height={48}
                  alt=""
                  decoding="async"
                />
                <div>
                  <p className="wb-host__name">
                    Atul Kumar Verma <span>· {t.ledBy}</span>
                  </p>
                  <p className="wb-host__role">{t.facilitatorShort}</p>
                  <p className="wb-host__role">{t.facilitatorBadge}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================ FACT BAR ============================ */}
        <div className="wb-wrap wb-facts-wrap">
          <dl className="wb-facts">
            {t.facts.map((fact, i) => (
              <div className="wb-fact" key={fact.label}>
                <span className="wb-fact__icon">{FACT_ICONS[i]}</span>
                <div>
                  <dt>{fact.label}</dt>
                  <dd>{withLogo(fact.value)}</dd>
                </div>
              </div>
            ))}
          </dl>
          <ul className="wb-proof">
            {t.proof.map((item) => (
              <li key={item}>
                <CheckBadge size={15} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* ============================== LEARN ============================== */}
        {/* Three cards that pin and stack as you scroll — each slides up over the last, so
            the three skills are read one at a time instead of skimmed as a row. */}
        <section className="wb-band wb-band--white" aria-labelledby="wb-learn">
          <div className="wb-wrap">
            <div className="wb-head" data-reveal>
              <Eyebrow>{t.learn.eyebrow}</Eyebrow>
              <h2 id="wb-learn" className="wb-h2">
                {t.learn.title}
              </h2>
            </div>

            <ol className="wb-stack">
              <li className="wb-stack__item" style={{ "--i": 0 } as React.CSSProperties}>
                <article className="wb-feature">
                  <div className="wb-feature__text">
                    <span className="wb-feature__num">01</span>
                    <h3>{tutor.title}</h3>
                    <p>{tutor.body}</p>
                  </div>
                  {/* The question is typed into a search bar, a search runs, then the
                      process diagram builds — see TutorDemo. */}
                  <TutorDemo ask={tutor.ask} steps={tutor.steps} icons={FLOW_ICONS} searchIcon={<SearchIcon />} />
                </article>
              </li>

              <li className="wb-stack__item" style={{ "--i": 1 } as React.CSSProperties}>
                <article className="wb-feature">
                  <div className="wb-feature__text">
                    <span className="wb-feature__num">02</span>
                    <h3>{quiz.title}</h3>
                    <p>{quiz.body}</p>
                  </div>
                  {/* A cursor moves to the right answer and taps it; the option locks in and
                      the progress bar advances. Loops while the card is on screen. */}
                  <div className="wb-demo wb-demo--quiz" aria-hidden="true" data-reveal>
                    <div className="wb-quiz__top">
                      <span className="wb-ai">
                        <SparkIcon />
                        {quiz.ai}
                      </span>
                      <span className="wb-quiz__bars">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    </div>
                    <span className="wb-tag wb-quiz__tag">{quiz.tag}</span>
                    <p className="wb-quiz__q">{quiz.question}</p>
                    <div className="wb-quiz__board">
                      <ul className="wb-quiz__opts">
                        {quiz.options.map((option, i) => (
                          <li key={option} className={i === quiz.correct ? "is-correct" : undefined}>
                            {option}
                            {i === quiz.correct && <CheckBadge size={15} />}
                          </li>
                        ))}
                      </ul>
                      <span className="wb-tap" />
                      <PointerIcon />
                    </div>
                    <p className="wb-quiz__feedback">
                      <SparkIcon />
                      <span>{quiz.feedback}</span>
                    </p>
                  </div>
                </article>
              </li>

              <li className="wb-stack__item" style={{ "--i": 2 } as React.CSSProperties}>
                <article className="wb-feature">
                  <div className="wb-feature__text">
                    <span className="wb-feature__num">03</span>
                    <h3>{check.title}</h3>
                    <p>{check.body}</p>
                  </div>
                  {/* Two of AI's mistakes, one after the other: each wrong answer is struck
                      and stamped, then the checked correction slides in underneath. */}
                  <div className="wb-demo wb-demo--check" aria-hidden="true" data-reveal>
                    <div className="wb-check__slides">
                      {check.items.map((item) => (
                        <div className="wb-check__slide" key={item.claim}>
                          <div className="wb-check__answer">
                            <span className="wb-tag">{check.tag}</span>
                            <p>
                              {item.claim}{" "}
                              <span className="wb-check__wrong">
                                {item.wrong}
                                <i className="wb-check__strike" />
                              </span>
                            </p>
                            <span className="wb-check__stamp">
                              <CrossIcon />
                            </span>
                          </div>
                          <div className="wb-check__fix">
                            {item.source === "book" ? <BookIcon /> : <CountIcon />}
                            <span>
                              {item.verified} <strong>{item.right}</strong>
                              {item.word && item.letter && (
                                <span className="wb-spell">
                                  {Array.from(item.word).map((ch, i) =>
                                    ch === item.letter ? <mark key={i}>{ch}</mark> : <span key={i}>{ch}</span>,
                                  )}
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              </li>
            </ol>
          </div>
        </section>

        {/* ============================== TRUST ============================== */}
        <section className="wb-band wb-band--tint" aria-labelledby="wb-trust">
          <div className="wb-wrap">
            <div className="wb-proofband">
              <div className="wb-proofband__img">
                <WebinarPicture
                  name="hall"
                  alt={t.photoAlt}
                  sizes="100vw"
                />
              </div>
              <div className="wb-proofband__shade" aria-hidden="true" />

              <div className="wb-proofband__content" data-reveal>
                <Eyebrow tone="sky">{t.trust.eyebrow}</Eyebrow>
                <h2 id="wb-trust" className="wb-h2">
                  {t.trust.title}
                </h2>
                <p className="wb-proofband__line">{t.trust.line}</p>

                <div className="wb-person">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="wb-person__img"
                    src="/assets/img/atul-kumar-verma.webp"
                    srcSet="/assets/img/atul-kumar-verma.webp 1x, /assets/img/atul-kumar-verma@2x.webp 2x"
                    width={56}
                    height={56}
                    alt="Atul Kumar Verma"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="wb-person__text">
                    <p className="wb-person__name">Atul Kumar Verma</p>
                    <p className="wb-person__role">{t.trust.facilitatorRole}</p>
                  </div>
                  {/* Its own line under the photo and text — on a phone the text column is
                      too narrow to hold the pill without breaking it. */}
                  <p className="wb-badge">
                    <SealIcon />
                    {t.trust.dpiit}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================== HOW TO JOIN =========================== */}
        <section className="wb-band wb-band--white" aria-labelledby="wb-steps">
          <div className="wb-wrap">
            <div className="wb-head wb-head--center" data-reveal>
              <Eyebrow both>{t.steps.eyebrow}</Eyebrow>
              <h2 id="wb-steps" className="wb-h2">
                {t.steps.title}
              </h2>
            </div>
            {/* The rail behind the numbers fills as the list scrolls up the screen. */}
            <div className="wb-steps">
              <span className="wb-steps__rail" aria-hidden="true">
                <span />
              </span>
              <ol>
                {t.steps.items.map((item, i) => (
                  <li key={item} data-reveal data-reveal-delay={String(i)}>
                    <span className="wb-steps__num">{i + 1}</span>
                    <span className="wb-steps__text">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* ========================= PARENTS + FAQ ========================= */}
        <section className="wb-band wb-band--tint" aria-labelledby="wb-parents">
          <div className="wb-wrap wb-split">
            <div>
              <div className="wb-head" data-reveal>
                <Eyebrow>{t.parents.eyebrow}</Eyebrow>
                <h2 id="wb-parents" className="wb-h2">
                  {t.parents.title}
                </h2>
              </div>
              <ul className="wb-assure" data-reveal data-reveal-delay="1">
                {t.parents.items.map((item, i) => (
                  <li key={item}>
                    <span className="wb-assure__icon">{PARENT_ICONS[i]}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="wb-head" data-reveal>
                <Eyebrow>{t.faq.eyebrow}</Eyebrow>
                <h2 id="wb-faq" className="wb-h2">
                  {t.faq.title}
                </h2>
              </div>
              <div className="wb-faq" data-reveal data-reveal-delay="1">
                {t.faq.items.map((item, i) => (
                  <details key={item.q} open={i === 0}>
                    <summary>
                      {item.q}
                      <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ============================ FINAL CTA ============================ */}
        {/* The headline on the left; everything needed to act — the button, the
            in-app-browser tip and the privacy note — together in one card on the right. */}
        <section className="wb-final" aria-labelledby="wb-final">
          <div className="wb-final__bg" aria-hidden="true">
            <WebinarPicture name="students" alt="" sizes="100vw" />
          </div>
          <div className="wb-wrap wb-final__inner">
            <div className="wb-final__copy" data-reveal>
              <Eyebrow tone="sky">{t.final.eyebrow}</Eyebrow>
              <h2 id="wb-final" className="wb-h2">
                {t.final.title}
              </h2>
              <p className="wb-note">
                <CalendarIcon />
                {t.ctaNote}
              </p>
            </div>

            <div className="wb-final__card" data-reveal data-reveal-delay="1">
              <JoinButton id="wb-final-cta" href={joinHref(lang, "final")} label={t.cta} />
              <p className="wb-final__fallback">
                <InfoIcon />
                <span>{t.final.fallback}</span>
              </p>
              <p className="wb-final__privacy">
                <ShieldIcon />
                <span>
                  {t.final.privacy} <a href="/privacy">{t.final.privacyLink}</a>
                </span>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ============================== FOOTER ============================== */}
      <footer id="wb-foot" className="wb-foot">
        <div className="wb-wrap wb-foot__inner">
          <div className="wb-foot__org">
            <p>© 2026 Innovgeist Technologies Pvt. Ltd.</p>
            <p>support@innovgeist.com · +91 81272 73162 · Lucknow</p>
          </div>
          <nav aria-label="Legal" className="wb-foot__nav">
            <a href="/privacy">{t.footer.privacy}</a>
            <a href="/terms">{t.footer.terms}</a>
          </nav>
        </div>
      </footer>

      <StickyJoinBar title={t.sticky.title} meta={t.sticky.meta}>
        <JoinButton href={joinHref(lang, "sticky")} label={t.sticky.cta} compact />
      </StickyJoinBar>

      <script
        type="application/ld+json"
        // Serialised from constants in `lib/webinar.ts` — no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webinarJsonLd(lang)) }}
      />
    </div>
  );
}
