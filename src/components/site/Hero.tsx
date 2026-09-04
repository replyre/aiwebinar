import AudienceCarousel, { type Slide } from "@/components/site/AudienceCarousel";

/**
 * The three audience slides. Held here rather than inside the carousel so the copy stays
 * server-rendered — only the carousel shell hydrates, and the words are in the HTML for
 * crawlers whether or not JavaScript ever runs.
 */
const SLIDES: Slide[] = [
  {
    label: "AI for Students",
    body: (
      <>
          <span className="carousel__pill">
            <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>
            AI for Students
          </span>
          <h3 className="carousel__h">Turning curiosity into capability</h3>
          <p className="carousel__d">Students learn to use AI as a thinking partner, not a shortcut.</p>
          <ul className="carousel__list">
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Write precise prompts that produce usable answers
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Verify and fact-check before trusting an output
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Build revision notes and prepare smarter for exams
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Use AI ethically &mdash; and see where AI careers are heading
            </li>
          </ul>
          <ul className="carousel__meta">
            <li>
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              90 minutes
            </li>
            <li>
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>
              English + Hindi
            </li>
            <li>
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>
              Classes IX&ndash;XII &amp; UG
            </li>
          </ul>
      </>
    ),
  },
  {
    label: "AI for Faculty",
    body: (
      <>
          <span className="carousel__pill">
            <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 21 5-5 5 5" /></svg>
            AI for Faculty
          </span>
          <h3 className="carousel__h">Teaching and assessing with confidence</h3>
          <p className="carousel__d">Educators build the fluency to use AI — and to govern how students use it.</p>
          <ul className="carousel__list">
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Plan lessons and personalise learning paths faster
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Build question banks, rubrics and feedback with oversight
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Accelerate literature review, drafting and analysis
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Uphold integrity in an AI-enabled classroom
            </li>
          </ul>
          <ul className="carousel__meta">
            <li>
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
              Scoped to your calendar
            </li>
            <li>
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>
              English + Hindi
            </li>
            <li>
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg>
              Educators &amp; academic staff
            </li>
          </ul>
      </>
    ),
  },
  {
    label: "AI for Graduate Students",
    body: (
      <>
          <span className="carousel__pill">
            <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /><path d="M9 14h2" /><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" /><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>
            AI for Graduate Students
          </span>
          <h3 className="carousel__h">Research faster without losing rigour</h3>
          <p className="carousel__d">Postgraduate work gets the speed of AI with the discipline research demands.</p>
          <ul className="carousel__list">
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Survey and cross-check literature at speed
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Draft academic writing that stays your own argument
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Build clear, defensible academic presentations
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Prepare for an AI-enabled research and job market
            </li>
          </ul>
          <ul className="carousel__meta">
            <li>
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
              Scoped to your cohort
            </li>
            <li>
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>
              English + Hindi
            </li>
            <li>
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" /></svg>
              Research &amp; professional development
            </li>
          </ul>
      </>
    ),
  },
];

export default function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true"></div>
    
      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="eyebrow" data-reveal="">AI Education Partnership</p>
          {/* Explicit three-line break. Each .hold is unbreakable, and the line
               breaks between them are forced, so the shape is identical at every
               width above the mobile breakpoint. */}
          <h1 className="hero__title" id="hero-title" data-reveal="" data-reveal-delay="1">
            <span className="hold">Preparing students,</span>
            <span className="hold">educators &amp; institutions</span>
            <span className="hold">for the <em>AI&nbsp;era</em></span>
          </h1>
          <p className="hero__lede" data-reveal="" data-reveal-delay="2">
            Innovgeist Technologies Pvt. Ltd. helps educational institutions adopt Artificial
            Intelligence responsibly — through practical training, AI literacy, and future-ready
            learning initiatives.
          </p>
          <div className="hero__actions" data-reveal="" data-reveal-delay="3">
            <a className="btn btn--primary btn--lg" href="#contact">
              Book a Discussion
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
            <a className="btn btn--secondary btn--lg" href="/assets/docs/Innovgeist-AI-Education-Partnership-Proposal.pdf" download={true}>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></svg>
              Download Proposal
            </a>
          </div>
          <ul className="hero__facts" data-reveal="" data-reveal-delay="4">
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
              DPIIT Recognized Startup
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>
              Schools, colleges &amp; universities
            </li>
            <li>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>
              English &amp; Hindi
            </li>
          </ul>
        </div>
    
        {/* Hero visual: node field + at-a-glance panel + floating chips */}
        <div className="hero__visual" data-reveal="" data-reveal-delay="2">
          <div className="hero__nodes" aria-hidden="true">
            <svg viewBox="0 0 420 420" preserveAspectRatio="xMidYMid slice">
              <path className="n-line" d="M60 90 L170 60 L300 110 L370 70" />
              <path className="n-line" d="M40 220 L150 190 L260 240 L380 200" />
              <path className="n-line" d="M70 350 L190 320 L310 360" />
              <path className="n-line" d="M170 60 L150 190 L190 320" />
              <path className="n-line" d="M300 110 L260 240 L310 360" />
              <path className="n-line" d="M60 90 L40 220 L70 350" />
              <path className="n-line" d="M370 70 L380 200" />
              <circle className="n-dot" cx="60" cy="90" r="3" />
              <circle className="n-dot" cx="370" cy="70" r="3" />
              <circle className="n-dot" cx="40" cy="220" r="3" />
              <circle className="n-dot" cx="380" cy="200" r="3" />
              <circle className="n-dot" cx="70" cy="350" r="3" />
              <circle className="n-dot" cx="310" cy="360" r="3" />
              <circle className="n-dot n-pulse" cx="170" cy="60" r="4" />
              <circle className="n-dot n-pulse" cx="260" cy="240" r="4" />
              <circle className="n-dot n-pulse" cx="190" cy="320" r="4" />
              <circle className="n-dot" cx="300" cy="110" r="3" />
              <circle className="n-dot" cx="150" cy="190" r="3" />
            </svg>
          </div>
    
      <AudienceCarousel slides={SLIDES} />
        </div>
      </div>
    
      {/* Full-bleed credential marquee */}
      <div className="marquee" data-marquee="" aria-label="Innovgeist capabilities and credentials">
        <div className="marquee__track">
          <ul className="marquee__group">
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" /><circle cx="12" cy="8" r="6" /></svg>DPIIT Recognized Startup</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" /></svg>AI Software Development</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><rect width="8" height="8" x="3" y="3" rx="2" /><path d="M7 11v4a2 2 0 0 0 2 2h4" /><rect width="8" height="8" x="13" y="13" rx="2" /></svg>Intelligent Automation</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>Education Technology</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" /><path d="M8.5 2h7" /><path d="M7 16h10" /></svg>Practical AI Learning</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg>Industry-Led Learning</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /></svg>IET Lucknow · Sponsor &amp; Mentor</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="m9 15 2 2 4-4" /></svg>Accreditation Workflow Automation</li>
          </ul>
          {/* Duplicate group makes the -50% translate loop seamless. */}
          <ul className="marquee__group" aria-hidden="true">
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" /><circle cx="12" cy="8" r="6" /></svg>DPIIT Recognized Startup</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><rect width="16" height="16" x="4" y="4" rx="2" /><rect width="6" height="6" x="9" y="9" rx="1" /><path d="M15 2v2" /><path d="M15 20v2" /><path d="M2 15h2" /><path d="M2 9h2" /><path d="M20 15h2" /><path d="M20 9h2" /><path d="M9 2v2" /><path d="M9 20v2" /></svg>AI Software Development</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><rect width="8" height="8" x="3" y="3" rx="2" /><path d="M7 11v4a2 2 0 0 0 2 2h4" /><rect width="8" height="8" x="13" y="13" rx="2" /></svg>Intelligent Automation</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>Education Technology</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" /><path d="M8.5 2h7" /><path d="M7 16h10" /></svg>Practical AI Learning</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg>Industry-Led Learning</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /></svg>IET Lucknow · Sponsor &amp; Mentor</li>
            <li className="marquee__item"><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="m9 15 2 2 4-4" /></svg>Accreditation Workflow Automation</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
