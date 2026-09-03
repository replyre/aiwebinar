export default function Trainer() {
  return (
    <section className="section" id="trainer" aria-labelledby="trainer-title">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow" data-reveal="">Leadership</p>
          <h2 className="section__title" id="trainer-title" data-reveal="">Meet your trainer</h2>
        </div>
    
        <div className="trainer">
          <div className="trainer__media" data-reveal="">
            <div className="trainer__frame">
              <picture>
                <source type="image/webp" srcSet="/assets/img/atul-kumar-verma.webp 480w, /assets/img/atul-kumar-verma@2x.webp 960w" sizes="(max-width: 1140px) 88vw, 420px" />
                <img src="/assets/img/atul-kumar-verma.jpg" srcSet="/assets/img/atul-kumar-verma.jpg 480w, /assets/img/atul-kumar-verma@2x.jpg 960w" sizes="(max-width: 1140px) 88vw, 420px" alt="Portrait of Atul Kumar Verma, Director of Innovgeist Technologies Pvt. Ltd." width="480" height="480" loading="lazy" decoding="async" />
              </picture>
              <div className="trainer__badge">
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" /><circle cx="12" cy="8" r="6" /></svg>
                <span>
                  <b>Prize Pool Sponsor &amp; Mentor</b>
                  <span>HACK X VID-YOUTH · IET Lucknow, 2026</span>
                </span>
              </div>
            </div>
          </div>
    
          <div className="trainer__body" data-reveal="" data-reveal-delay="1">
            <h3 className="trainer__name">Atul Kumar Verma</h3>
            <p className="trainer__role">Director · Innovgeist Technologies Pvt. Ltd.</p>
            <p className="trainer__creds">
              <span>AI Engineer</span><span>Automation Consultant</span><span>EdTech Innovator</span>
            </p>
    
            <div className="trainer__stats">
              <div><b>3+</b><span>Years across AI &amp; automation</span></div>
              <div><b>3</b><span>Learner tracks delivered</span></div>
              <div><b>DPIIT</b><span>Recognized startup, Govt. of India</span></div>
            </div>
    
            <p>
              Atul Kumar Verma brings over three years of professional experience across
              Artificial Intelligence, software engineering, and intelligent automation. His work
              centers on building AI-powered software, automation systems, and
              education-technology solutions that solve real-world challenges in academic and
              organizational settings.
            </p>
            <p>
              As Director of Innovgeist Technologies Pvt. Ltd., he leads the development of
              AI-driven products and practical AI learning initiatives designed to help
              institutions and learners adopt AI responsibly.
            </p>
    
            <blockquote className="trainer__quote">
              Sessions emphasise practical demonstrations, critical thinking and hands-on learning
              — so participants use AI as a tool for deeper understanding rather than dependency.
            </blockquote>
    
            <p className="subhead subhead--tight">Areas of expertise</p>
            <ul className="taglist taglist--lg">
              <li>Artificial Intelligence</li>
              <li>Intelligent Automation</li>
              <li>AI Workflow Design</li>
              <li>Education Technology</li>
              <li>Software Engineering</li>
              <li>AI Productivity Systems</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
