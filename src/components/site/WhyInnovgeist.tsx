export default function WhyInnovgeist() {
  return (
    <section className="section" id="why-innovgeist" aria-labelledby="why-title">
      <div className="container">
        <div className="section__head section__head--split">
          <div>
            <p className="eyebrow" data-reveal="">Credibility</p>
            <h2 className="section__title" id="why-title" data-reveal="">A technology company first</h2>
          </div>
          <p className="section__lede" data-reveal="" data-reveal-delay="1">
            We build the AI products and automation systems we teach institutions to adopt — which
            is why the programs are grounded in real institutional needs, not theory.
          </p>
        </div>
    
        <div className="grid grid--2" data-reveal="">
          <p>
            Innovgeist Technologies Private Limited is a DPIIT-recognized startup under the
            Government of India&rsquo;s Startup India initiative. We develop AI-powered software,
            intelligent automation systems, and technology-driven education programs that help
            institutions prepare for the future of learning and work.
          </p>
          <p>
            We collaborate with higher-education institutions on AI-driven digital transformation —
            including accreditation-documentation automation and academic-workflow modernization.
            This hands-on implementation experience is what our education programs are built on.
          </p>
        </div>
      </div>
    
      {/* Full-bleed counter band */}
      <div className="band band--dark" style={{ marginTop: "var(--section-y)" }}>
        <div className="container">
          <dl className="counters" data-reveal="">
            <div className="counters__item">
              <dt className="counters__v"><span data-count-to="3">0</span>+</dt>
              <dd className="counters__l">Years in AI &amp; intelligent automation</dd>
            </div>
            <div className="counters__item">
              <dt className="counters__v"><span data-count-to="3">0</span></dt>
              <dd className="counters__l">Learner tracks across the institution</dd>
            </div>
            <div className="counters__item">
              <dt className="counters__v"><span data-count-to="90">0</span></dt>
              <dd className="counters__l">Minutes in the flagship session</dd>
            </div>
            <div className="counters__item">
              <dt className="counters__v"><span data-count-to="2">0</span></dt>
              <dd className="counters__l">Languages of delivery — English &amp; Hindi</dd>
            </div>
            <div className="counters__item">
              <dt className="counters__v">DPIIT</dt>
              <dd className="counters__l">Government of India recognition</dd>
            </div>
          </dl>
    
          <div style={{ marginTop: "var(--sp-8)" }}>
            <p className="subhead subhead--onDark" data-reveal="">What sets us apart</p>
            <ul className="taglist taglist--lg taglist--onDark" data-reveal="">
              <li>DPIIT Recognized Startup</li>
              <li>AI Software Development</li>
              <li>Intelligent Automation</li>
              <li>Education Technology</li>
              <li>Industry-Led Learning</li>
              <li>Practical Implementation</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
