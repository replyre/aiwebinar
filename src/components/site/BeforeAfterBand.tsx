export default function BeforeAfterBand() {
  return (
    <section className="band band--dark" aria-labelledby="ba-title">
      <div className="container">
        <div className="section__head section__head--center">
          <p className="eyebrow eyebrow--onDark" data-reveal="">The Shift</p>
          <h2 className="section__title" id="ba-title" data-reveal="">What changes when AI literacy is built in</h2>
          <p className="section__lede" data-reveal="" data-reveal-delay="1">
            The same tools, the same learners — a completely different outcome.
          </p>
        </div>
    
        <div className="ba">
          <div className="ba__col" data-reveal="">
            <span className="ba__label">
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
              Without AI literacy
            </span>
            <h3 className="ba__title">AI as a shortcut</h3>
            <ul className="ba__list">
              <li>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                Blind dependence on AI outputs
              </li>
              <li>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                Poorly framed prompts and weak results
              </li>
              <li>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                Erosion of critical thinking
              </li>
              <li>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                Exposure to misinformation
              </li>
              <li>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                Academic-integrity risks
              </li>
            </ul>
          </div>
    
          <div className="ba__arrow" data-reveal="" data-reveal-delay="1" aria-hidden="true">
            <svg className="icon" viewBox="0 0 24 24"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
          </div>
    
          <div className="ba__col ba__col--after" data-reveal="" data-reveal-delay="2">
            <span className="ba__label">
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
              With AI literacy
            </span>
            <h3 className="ba__title">AI as a thinking partner</h3>
            <ul className="ba__list">
              <li>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                Better questioning and sharper reasoning
              </li>
              <li>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                Faster, deeper learning
              </li>
              <li>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                Independent critical thinking
              </li>
              <li>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                Responsible, ethical usage
              </li>
              <li>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
                Future-ready skills for study and work
              </li>
            </ul>
          </div>
        </div>
    
        <figure className="pullquote" data-reveal="">
          <blockquote>
            The goal is not to replace learning with AI — it is to help learners think better
            with AI.
          </blockquote>
          <figcaption>Innovgeist Technologies Pvt. Ltd.</figcaption>
        </figure>
      </div>
    </section>
  );
}
