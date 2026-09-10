import { COMPANY } from "@/lib/legal";

/**
 * "Connect with your mentor" — the one human on the other side of a paid enrolment.
 *
 * ⚠️ THIS IS A SUPPORT CHANNEL, NOT A SOCIAL WIDGET. Between paying and the first class
 * there is a gap of days in which a guardian has a receipt, no class yet, and no face — and
 * that gap is where "is this real?" turns into a refund request. A named person with a
 * photo and two profiles anyone can check answers that faster than a support address does.
 *
 * The portrait reuses the renditions already built for the home page's trainer section, so
 * this costs no new bytes for anyone who arrived from there.
 */
export default function MentorCard() {
  return (
    <section className="mentor" aria-labelledby="mentor-title">
      <div className="mentor__media">
        <picture>
          <source
            type="image/webp"
            srcSet="/assets/img/atul-kumar-verma.webp 480w, /assets/img/atul-kumar-verma@2x.webp 960w"
            sizes="(max-width: 40rem) 6rem, 8rem"
          />
          <img
            src="/assets/img/atul-kumar-verma.jpg"
            srcSet="/assets/img/atul-kumar-verma.jpg 480w, /assets/img/atul-kumar-verma@2x.jpg 960w"
            sizes="(max-width: 40rem) 6rem, 8rem"
            alt="Portrait of Atul Kumar Verma"
            width="480"
            height="480"
            loading="lazy"
            decoding="async"
          />
        </picture>
      </div>

      <div className="mentor__body">
        <p className="eyebrow">Connect with your mentor</p>
        <h2 className="mentor__name" id="mentor-title">
          Atul Kumar Verma
        </h2>
        <p className="mentor__role">Director &middot; {COMPANY.legalName}</p>
        <p className="mentor__note">
          Atul leads the sessions. Message him directly if you have a question about the
          course, the schedule, or what your child should prepare.
        </p>

        <div className="mentor__links">
          <a
            className="mentor__link mentor__link--ig"
            href="https://instagram.com/vermaatul_1520"
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <rect width="20" height="20" x="2" y="2" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <path d="M17.5 6.5h.01" />
            </svg>
            <span>
              <strong>Instagram</strong>
              @vermaatul_1520
            </span>
          </a>

          <a
            className="mentor__link mentor__link--li"
            href="https://www.linkedin.com/in/atul-kumar-verma-1514121a3/"
            rel="noopener noreferrer"
            target="_blank"
          >
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
              <rect width="4" height="12" x="2" y="9" />
              <circle cx="4" cy="4" r="2" />
            </svg>
            <span>
              <strong>LinkedIn</strong>
              Atul Kumar Verma
            </span>
          </a>
        </div>

        <p className="mentor__fallback">
          Prefer email or a call? <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> &middot;{" "}
          <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>
        </p>
      </div>
    </section>
  );
}
