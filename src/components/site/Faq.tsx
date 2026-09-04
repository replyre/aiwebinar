import FaqAccordion from "@/components/site/FaqAccordion";

export default function Faq() {
  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <div className="container">
        <div className="section__head section__head--center">
          <p className="eyebrow" data-reveal="">FAQ</p>
          <h2 className="section__title" id="faq-title" data-reveal="">Institutional questions</h2>
          <p className="section__lede" data-reveal="" data-reveal-delay="1">
            The questions academic leadership asks most often. If yours isn&rsquo;t here,
            <a href="#contact">start a discussion</a> — we&rsquo;ll answer it directly.
          </p>
        </div>
    
      <FaqAccordion>
        <div className="faq__col">
          <details className="faq__item" data-reveal="">
            <summary>Is Innovgeist a coaching institute or a training academy?
              <svg className="icon faq__chev" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="faq__body"><p>
              No. Innovgeist Technologies Pvt. Ltd. is an AI software and intelligent automation
              company that also works as an education technology partner. We build AI products
              and automation systems for real organizations, and our education programs come
              directly out of that implementation work — not from a syllabus written for a
              classroom.
            </p></div>
          </details>
          <details className="faq__item" data-reveal="">
            <summary>How long is a session, and in what format?
              <svg className="icon faq__chev" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="faq__body"><p>
              The flagship <strong>AI for Students</strong> session runs 90 minutes, delivered
              offline and interactively, in English and Hindi. Faculty development and graduate
              tracks are scoped during the discovery discussion so the format matches your
              academic calendar and the depth you need.
            </p></div>
          </details>
          <details className="faq__item" data-reveal="">
            <summary>Can programs be customized to our institution?
              <svg className="icon faq__chev" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="faq__body"><p>
              Yes — customization is a standard step in our process, not an add-on. After the
              discovery discussion we tailor the curriculum to your learners: their stage,
              discipline, existing exposure to AI tools, and the academic workflows they
              actually use.
            </p></div>
          </details>
          <details className="faq__item" data-reveal="">
            <summary>Who are the programs designed for?
              <svg className="icon faq__chev" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="faq__body"><p>
              Three audiences across the full institution: students in Classes IX&ndash;XII and
              undergraduate programs; faculty and academic staff; and graduate students focused
              on research and professional development. Each track is delivered separately so
              the content stays relevant to the room.
            </p></div>
          </details>
          <details className="faq__item" data-reveal="">
            <summary>Do participants need prior AI experience?
              <svg className="icon faq__chev" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="faq__body"><p>
              No prior experience is assumed. Sessions begin from how AI systems actually work
              and build up to hands-on prompt engineering and verification practice. Where
              participants already use AI tools, we focus on correcting habits — weak prompting,
              unverified outputs, over-reliance.
            </p></div>
          </details>
        </div>
  
        <div className="faq__col">
          <details className="faq__item" data-reveal="">
            <summary>What does our institution need to provide?
              <svg className="icon faq__chev" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="faq__body"><p>
              A hall or classroom with a projector or large display, audio for larger groups, and
              internet access for live demonstrations. Requirements are confirmed during schedule
              confirmation so nothing is left to the day of delivery.
            </p></div>
          </details>
          <details className="faq__item" data-reveal="">
            <summary>How do you address academic integrity?
              <svg className="icon faq__chev" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="faq__body"><p>
              Responsible AI is one of our three pillars, not a closing slide. Students work
              through where AI assistance is legitimate and where it undermines their own
              learning. The faculty track goes further, covering practical frameworks for
              upholding honesty in an AI-enabled classroom and the foundations of an
              institutional AI policy.
            </p></div>
          </details>
          <details className="faq__item" data-reveal="">
            <summary>What do participants receive afterwards?
              <svg className="icon faq__chev" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="faq__body"><p>
              A participant guide with takeaways, access to a resource hub, and follow-up
              support. We also review impact with your team afterwards and plan the next
              engagement where a longer-term partnership makes sense.
            </p></div>
          </details>
          <details className="faq__item" data-reveal="">
            <summary>Do you work with institutions beyond workshops?
              <svg className="icon faq__chev" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="faq__body"><p>
              Yes. We collaborate with higher-education institutions on AI-driven digital
              transformation, including accreditation-documentation automation and
              academic-workflow modernization. If your priority is operational rather than
              instructional, that is a conversation worth having.
            </p></div>
          </details>
          <details className="faq__item" data-reveal="">
            <summary>How do we start, and what are the commercial terms?
              <svg className="icon faq__chev" aria-hidden="true" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </summary>
            <div className="faq__body"><p>
              Start with a discovery discussion — no commitment. Because programs are scoped to
              audience, duration and number of participants, commercial terms are shared as a
              written proposal after that conversation, so what you receive reflects your actual
              requirement.
            </p></div>
          </details>
        </div>
      </FaqAccordion>
      </div>
    </section>
  );
}
