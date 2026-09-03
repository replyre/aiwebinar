import LayerStack, { type Layer } from "@/components/site/LayerStack";

/**
 * Top of the stack first, foundation last — the visual order of the diagram. `LayerStack`
 * opens the last one, which is why the foundation reads as the thing everything rests on.
 */
const LAYERS: Layer[] = [
  {
    id: "4",
    head: (
      <>
        <span className="layer__n">04</span>
        <span className="layer__ico" aria-hidden="true">
          <svg className="icon" viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /></svg>
        </span>
        <span className="layer__text">
          <h3>Institutional policy &amp; governance</h3>
          <p>A responsible-AI position the whole institution can stand behind.</p>
        </span>
      </>
    ),
    body: (
      <>
        <ul className="layer__pad">
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Foundations for responsible AI policy</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Disclosure and citation standards</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Academic-integrity frameworks</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Review and revision cycles</li>
        </ul>
      </>
    ),
  },
  {
    id: "3",
    head: (
      <>
        <span className="layer__n">03</span>
        <span className="layer__ico" aria-hidden="true">
          <svg className="icon" viewBox="0 0 24 24"><rect width="8" height="8" x="3" y="3" rx="2" /><path d="M7 11v4a2 2 0 0 0 2 2h4" /><rect width="8" height="8" x="13" y="13" rx="2" /></svg>
        </span>
        <span className="layer__text">
          <h3>Academic workflows &amp; automation</h3>
          <p>Where AI stops being a classroom topic and starts saving institutional time.</p>
        </span>
      </>
    ),
    body: (
      <>
        <ul className="layer__pad">
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Accreditation-documentation automation</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Academic-workflow modernization</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Reporting and evidence compilation</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Administrative process automation</li>
        </ul>
      </>
    ),
  },
  {
    id: "2",
    head: (
      <>
        <span className="layer__n">02</span>
        <span className="layer__ico" aria-hidden="true">
          <svg className="icon" viewBox="0 0 24 24"><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 21 5-5 5 5" /></svg>
        </span>
        <span className="layer__text">
          <h3>Faculty capability</h3>
          <p>Educators fluent enough to teach, assess and govern AI use credibly.</p>
        </span>
      </>
    ),
    body: (
      <>
        <ul className="layer__pad">
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Lesson planning and personalization</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Assessment, rubrics and feedback</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Research productivity</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Classroom integrity practice</li>
        </ul>
      </>
    ),
  },
  {
    id: "1",
    head: (
      <>
        <span className="layer__n">01</span>
        <span className="layer__ico" aria-hidden="true">
          <svg className="icon" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>
        </span>
        <span className="layer__text">
          <h3>Student AI literacy</h3>
          <p>The foundation — because this is where AI use is already happening.</p>
        </span>
      </>
    ),
    body: (
      <>
        <ul className="layer__pad">
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Prompt engineering</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Verification and fact-checking</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Study, revision and exam workflows</li>
          <li><svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>Ethics, integrity and AI careers</li>
        </ul>
      </>
    ),
  },
];

export default function ReadinessModel() {
  return (
    <section className="section section--dark" id="architecture" aria-labelledby="arch-title">
      <div className="container">
        <div className="section__head section__head--wide">
          <p className="eyebrow eyebrow--onDark" data-reveal="">The Readiness Model</p>
          <h2 className="section__title" id="arch-title" data-reveal="">How an AI-ready institution is built</h2>
          <p className="section__lede" data-reveal="" data-reveal-delay="1">
            AI readiness is not a single workshop. It is four layers, built from the classroom
            upward — each one making the next one possible.
          </p>
        </div>
    
        <p className="layers__hint" data-reveal="">
          <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /></svg>
          Select any layer to see what it covers.
        </p>
    
      <LayerStack layers={LAYERS} />
      </div>
    </section>
  );
}
