export default function Challenges() {
  return (
    <section className="section section--tint" id="challenges" aria-labelledby="challenges-title">
      <div className="container">
        <div className="section__head section__head--split">
          <div>
            <p className="eyebrow" data-reveal="">The Case for Action</p>
            <h2 className="section__title" id="challenges-title" data-reveal="">
              Access to AI tools is no longer the differentiator — capability is
            </h2>
          </div>
          <p className="section__lede" data-reveal="" data-reveal-delay="1">
            Every institution already has AI in its classrooms, whether it planned for it or not.
            These are the six gaps that show up first — and the gap between institutions that
            build AI literacy and those that do not will widen quickly.
          </p>
        </div>
    
        <div className="grid grid--cards">
          {/* 01 — scattered, unguided use */}
          <article className="challenge" data-reveal="">
            <span className="challenge__num" aria-hidden="true">01</span>
            {/* Eight independent classrooms, each doing its own thing: no shared
                 standard, mixed outcomes, nothing joining them up. */}
            <div className="challenge__art" aria-hidden="true">
              <svg viewBox="0 0 232 116">
                <g>
                  <rect className="fig-panel" x="16" y="16" width="44" height="36" rx="6" />
                  <circle className="fig-acc" cx="27" cy="27" r="4" />
                  <rect className="fig-soft" x="24" y="38" width="26" height="3" rx="1.5" />
                  <rect className="fig-soft" x="24" y="44" width="16" height="3" rx="1.5" />
                </g>
                <g>
                  <rect className="fig-panel" x="68" y="16" width="44" height="36" rx="6" />
                  <circle className="fig-mid" cx="79" cy="27" r="4" />
                  <rect className="fig-soft" x="76" y="38" width="26" height="3" rx="1.5" />
                  <rect className="fig-soft" x="76" y="44" width="12" height="3" rx="1.5" />
                </g>
                <g>
                  <rect className="fig-panel" x="120" y="16" width="44" height="36" rx="6" />
                  <circle className="fig-neg-fill" cx="131" cy="27" r="4" />
                  <rect className="fig-soft" x="128" y="38" width="20" height="3" rx="1.5" />
                  <rect className="fig-soft" x="128" y="44" width="26" height="3" rx="1.5" />
                </g>
                <g>
                  <rect className="fig-panel" x="172" y="16" width="44" height="36" rx="6" />
                  <circle className="fig-mid" cx="183" cy="27" r="4" />
                  <rect className="fig-soft" x="180" y="38" width="16" height="3" rx="1.5" />
                  <rect className="fig-soft" x="180" y="44" width="26" height="3" rx="1.5" />
                </g>
                <g>
                  <rect className="fig-panel" x="16" y="64" width="44" height="36" rx="6" />
                  <circle className="fig-mid" cx="27" cy="75" r="4" />
                  <rect className="fig-soft" x="24" y="86" width="20" height="3" rx="1.5" />
                  <rect className="fig-soft" x="24" y="92" width="26" height="3" rx="1.5" />
                </g>
                <g>
                  <rect className="fig-panel" x="68" y="64" width="44" height="36" rx="6" />
                  <circle className="fig-acc" cx="79" cy="75" r="4" />
                  <rect className="fig-soft" x="76" y="86" width="26" height="3" rx="1.5" />
                  <rect className="fig-soft" x="76" y="92" width="14" height="3" rx="1.5" />
                </g>
                <g>
                  <rect className="fig-panel" x="120" y="64" width="44" height="36" rx="6" />
                  <circle className="fig-neg-fill" cx="131" cy="75" r="4" />
                  <rect className="fig-soft" x="128" y="86" width="16" height="3" rx="1.5" />
                  <rect className="fig-soft" x="128" y="92" width="24" height="3" rx="1.5" />
                </g>
                <g>
                  <rect className="fig-panel" x="172" y="64" width="44" height="36" rx="6" />
                  <circle className="fig-mid" cx="183" cy="75" r="4" />
                  <rect className="fig-soft" x="180" y="86" width="24" height="3" rx="1.5" />
                  <rect className="fig-soft" x="180" y="92" width="18" height="3" rx="1.5" />
                </g>
              </svg>
            </div>
            <h3>Unguided use is already happening</h3>
            <p>
              Students and faculty use AI daily with no shared standard for when it helps, when it
              harms, and when it must be disclosed.
            </p>
            <p className="challenge__tag">
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Addressed in AI for Students &amp; Faculty
            </p>
          </article>
    
          {/* 02 — weak prompting */}
          <article className="challenge" data-reveal="" data-reveal-delay="1">
            <span className="challenge__num" aria-hidden="true">02</span>
            {/* Vague prompt in, thin result out. Precise prompt in, full result
                 out. Same tool, different input. */}
            <div className="challenge__art" aria-hidden="true">
              <svg viewBox="0 0 232 116">
                {/* weak */}
                <rect className="fig-soft" x="16" y="20" width="52" height="22" rx="6" />
                <rect className="fig-mid" x="24" y="29" width="26" height="4" rx="2" />
                <path className="fig-dash" d="M76 31 h22" />
                <path className="fig-neg" d="M99 27 l5 4 -5 4" />
                <rect className="fig-panel" x="112" y="20" width="38" height="22" rx="6" />
                <path className="fig-neg" d="M126 27 l8 8 M134 27 l-8 8" />
    
                {/* strong */}
                <rect className="fig-tint" x="16" y="66" width="104" height="26" rx="7" />
                <rect className="fig-acc" x="26" y="72" width="60" height="4" rx="2" />
                <rect className="fig-acc" x="26" y="82" width="38" height="4" rx="2" opacity=".55" />
                <path className="fig-stroke" d="M128 79 h22" />
                <path className="fig-stroke" d="M151 75 l5 4 -5 4" />
                <rect className="fig-panel" x="164" y="66" width="52" height="26" rx="7" />
                <path className="fig-stroke" d="M176 79 l5 5 9 -10" style={{ stroke: "var(--accent)" }} />
                <rect className="fig-soft" x="196" y="77" width="12" height="4" rx="2" />
              </svg>
            </div>
            <h3>Prompting is a skill nobody teaches</h3>
            <p>
              Poorly framed questions produce weak answers — and learners conclude the tool is
              useless rather than that the input was.
            </p>
            <p className="challenge__tag">
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Prompt engineering lab
            </p>
          </article>
    
          {/* 03 — no verification */}
          <article className="challenge" data-reveal="" data-reveal-delay="2">
            <span className="challenge__num" aria-hidden="true">03</span>
            {/* The AI answer and the source are never held up against each other,
                 so the mismatch goes unnoticed. */}
            <div className="challenge__art" aria-hidden="true">
              <svg viewBox="0 0 232 116">
                <rect className="fig-panel" x="16" y="18" width="86" height="80" rx="8" />
                <rect className="fig-acc" x="28" y="30" width="22" height="4" rx="2" />
                <rect className="fig-soft" x="28" y="44" width="62" height="4" rx="2" />
                <rect className="fig-soft" x="28" y="56" width="62" height="4" rx="2" />
                <rect className="fig-soft" x="28" y="68" width="40" height="4" rx="2" />
                <rect className="fig-soft" x="28" y="80" width="52" height="4" rx="2" />
    
                {/* not-equal */}
                <path className="fig-neg" d="M110 52 h12 M110 62 h12 M112 68 l8 -22" />
    
                {/* right: the verified source, held as the correct version */}
                <rect className="fig-pos-panel" x="130" y="18" width="86" height="80" rx="8" />
                <rect className="fig-pos-fill" x="142" y="30" width="30" height="4" rx="2" />
                <rect className="fig-pos-soft" x="142" y="44" width="62" height="4" rx="2" />
                <rect className="fig-pos-soft" x="142" y="56" width="46" height="4" rx="2" />
                <rect className="fig-pos-soft" x="142" y="68" width="62" height="4" rx="2" />
                <rect className="fig-pos-soft" x="142" y="80" width="34" height="4" rx="2" />
              </svg>
            </div>
            <h3>Outputs go unverified</h3>
            <p>
              Answers are accepted at face value. Without fact-checking habits, misinformation
              enters coursework and citations quietly.
            </p>
            <p className="challenge__tag">
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Verification &amp; fact-checking drills
            </p>
          </article>
    
          {/* 04 — critical thinking erosion */}
          <article className="challenge" data-reveal="">
            <span className="challenge__num" aria-hidden="true">04</span>
            {/* Two series read over the same six terms: AI reliance climbing
                 (bars) against independent reasoning slipping (line). They cross
                 mid-course, unnoticed, and the gap is only ever measured at the
                 end — in assessments. */}
            <div className="challenge__art" aria-hidden="true">
              <svg viewBox="0 0 232 116">
                <path className="fig-base" d="M16 100 H216" />
    
                {/* reliance on AI, term by term */}
                <rect className="fig-soft" x="22" y="74" width="20" height="26" rx="4" />
                <rect className="fig-soft" x="54" y="66" width="20" height="34" rx="4" />
                <rect className="fig-mid" x="86" y="58" width="20" height="42" rx="4" />
                <rect className="fig-mid" x="118" y="48" width="20" height="52" rx="4" />
                <rect className="fig-acc" x="150" y="38" width="20" height="62" rx="4" opacity=".28" />
                <rect className="fig-acc" x="182" y="28" width="20" height="72" rx="4" opacity=".42" />
    
                {/* independent reasoning, sampled at the same six bar centres:
                     barely moves at first, then falls away */}
                <path className="fig-neg" d="M32 26 L64 29 L96 35 L128 47 L160 64 L192 84" />
                {/* barbs mirrored about the line's 32° exit angle */}
                <path className="fig-neg" d="M187 76 L192 84 L182 83" />
                <circle className="fig-neg-fill" cx="32" cy="26" r="3.4" />
                <circle className="fig-neg-fill" cx="64" cy="29" r="2.4" />
                <circle className="fig-neg-fill" cx="96" cy="35" r="2.4" />
                <circle className="fig-neg-fill" cx="160" cy="64" r="2.4" />
    
                {/* the crossover: reliance overtakes reasoning, quietly */}
                <circle className="fig-neg-ring" cx="128" cy="47" r="4.2" />
              </svg>
            </div>
            <h3>Critical thinking erodes quietly</h3>
            <p>
              Dependence replaces reasoning gradually — and it usually surfaces late, in
              assessments, when it is expensive to correct.
            </p>
            <p className="challenge__tag">
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Think-with-AI, not for-AI framing
            </p>
          </article>
    
          {/* 05 — faculty policing untrained tool */}
          <article className="challenge" data-reveal="" data-reveal-delay="1">
            <span className="challenge__num" aria-hidden="true">05</span>
            {/* The policy is written and certified (left, blue seal) and is handed
                 on to be enforced. The educator carries the same seal slot — but it
                 is empty: no practical fluency to enforce the rulebook with. */}
            <div className="challenge__art" aria-hidden="true">
              <svg viewBox="0 0 232 116">
                {/* the policy: drafted, signed off, in force */}
                <rect className="fig-panel" x="16" y="16" width="76" height="84" rx="8" />
                <rect className="fig-soft" x="28" y="30" width="40" height="4" rx="2" />
                <rect className="fig-soft" x="28" y="42" width="52" height="4" rx="2" />
                <rect className="fig-soft" x="28" y="54" width="52" height="4" rx="2" />
                <rect className="fig-soft" x="28" y="66" width="34" height="4" rx="2" />
                <circle className="fig-acc" cx="86" cy="90" r="11" />
                <path d="M81 90 l4 4 7 -8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    
                {/* handed across to be enforced */}
                <path className="fig-dash" d="M100 58 H124" />
                <path className="fig-stroke" d="M124 53 l5 5 -5 5" />
    
                {/* the educator, holding the same seal slot — unfilled */}
                <path className="fig-mid" d="M144 96 a26 26 0 0 1 52 0 Z" />
                <circle className="fig-mid" cx="170" cy="55" r="14" />
                <circle cx="200" cy="88" r="11" fill="#fff" />
                <circle className="fig-dash" cx="200" cy="88" r="11" />
                <path className="fig-neg" d="M196 84 l8 8 M204 84 l-8 8" />
              </svg>
            </div>
            <h3>Faculty are asked to police an untrained tool</h3>
            <p>
              An integrity policy written without practical AI fluency is unenforceable. Educators
              need the capability before the rulebook.
            </p>
            <p className="challenge__tag">
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Faculty development track
            </p>
          </article>
    
          {/* 06 — documentation load */}
          <article className="challenge" data-reveal="" data-reveal-delay="2">
            <span className="challenge__num" aria-hidden="true">06</span>
            {/* The evidence stack deepens every cycle and the trend keeps
                 climbing, while the work stays manual. */}
            <div className="challenge__art" aria-hidden="true">
              <svg viewBox="0 0 232 116">
                <rect className="fig-soft" x="16" y="34" width="58" height="66" rx="7" />
                <rect className="fig-mid" x="26" y="26" width="58" height="66" rx="7" />
                <rect className="fig-panel" x="36" y="18" width="58" height="66" rx="7" />
                <rect className="fig-soft" x="46" y="32" width="34" height="4" rx="2" />
                <rect className="fig-soft" x="46" y="44" width="38" height="4" rx="2" />
                <rect className="fig-soft" x="46" y="56" width="24" height="4" rx="2" />
                <rect className="fig-soft" x="46" y="68" width="32" height="4" rx="2" />
    
                {/* the load itself, sitting on top of the written pages —
                     ring first so the plate covers where the two meet */}
                <circle className="fig-weight-ring" cx="65" cy="48" r="3.4" />
                <path className="fig-weight" d="M56 63 L59 51 H71 L74 63 Z" />
    
                <path className="fig-base" d="M116 100 H216" />
                <rect className="fig-soft" x="126" y="72" width="18" height="28" rx="4" />
                <rect className="fig-mid" x="156" y="56" width="18" height="44" rx="4" />
                <rect className="fig-acc" x="186" y="40" width="18" height="60" rx="4" opacity=".35" />
                <path className="fig-neg" d="M122 60 L152 44 L196 22" />
                {/* barbs mirrored about the line's 26.5° exit angle */}
                <path className="fig-neg" d="M186 22 L196 22 L190 30" />
              </svg>
            </div>
            <h3>Documentation load keeps rising</h3>
            <p>
              Accreditation and reporting demands grow every cycle while internal AI capacity stays
              unbuilt — so the work stays manual.
            </p>
            <p className="challenge__tag">
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>
              Academic-workflow modernization
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
