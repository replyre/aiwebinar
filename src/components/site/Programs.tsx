import Tabs, { type TabItem } from "@/components/site/Tabs";
import Link from "next/link";

/**
 * Tab labels and panel bodies stay in this server component; `Tabs` only owns which one
 * is showing. All three panels ship in the HTML, so the copy is crawlable and switching
 * tabs is one `hidden` attribute rather than one fetch.
 */
const PROGRAMS: TabItem[] = [
  {
    id: "students",
    button: (
      <>
        <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>
        AI for Students
      </>
    ),
    panel: (
      <>
        <div className="track">
          <div className="track__aside">
            <span className="track__ico" aria-hidden="true">
              <svg className="icon" viewBox="0 0 24 24"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /><path d="M22 10v6" /><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" /></svg>
            </span>
            <h3 className="track__name">AI for Students</h3>
            <p className="track__who">Classes IX&ndash;XII &amp; Undergraduate</p>
            <p className="track__desc">
              An interactive, hands-on session that turns curiosity into capability — teaching
              students to use AI as a thinking partner, not a shortcut.
            </p>
            <div className="track__meta">
              <div>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                <span>Duration <b>90 minutes</b></span>
              </div>
              <div>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>
                <span>Language <b>English + Hindi</b></span>
              </div>
              <div>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>
                <span>Mode <b>Offline · Interactive</b></span>
              </div>
            </div>
          </div>

          <div>
            <p className="subhead">What students learn to do</p>
            <div className="modules">
              <div className="module"><span className="module__n">01</span><div><h4 className="module__t">Write effective prompts</h4><p className="module__d">Precise, structured questions that produce usable answers.</p></div></div>
              <div className="module"><span className="module__n">02</span><div><h4 className="module__t">Verify &amp; fact-check</h4><p className="module__d">Test AI responses instead of trusting them.</p></div></div>
              <div className="module"><span className="module__n">03</span><div><h4 className="module__t">Build study notes</h4><p className="module__d">Turn material into revision assets that actually stick.</p></div></div>
              <div className="module"><span className="module__n">04</span><div><h4 className="module__t">Prepare for exams</h4><p className="module__d">Practice, self-testing and targeted revision workflows.</p></div></div>
              <div className="module"><span className="module__n">05</span><div><h4 className="module__t">Strengthen research skills</h4><p className="module__d">Find, evaluate and synthesise sources responsibly.</p></div></div>
              <div className="module"><span className="module__n">06</span><div><h4 className="module__t">Think independently</h4><p className="module__d">Use AI to sharpen reasoning, not to outsource it.</p></div></div>
              <div className="module"><span className="module__n">07</span><div><h4 className="module__t">Explore AI careers</h4><p className="module__d">Where the emerging roles are and what they demand.</p></div></div>
              <div className="module"><span className="module__n">08</span><div><h4 className="module__t">Use AI ethically</h4><p className="module__d">Disclosure, honesty and academic integrity in practice.</p></div></div>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "faculty",
    button: (
      <>
        <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 21 5-5 5 5" /></svg>
        AI for Faculty
      </>
    ),
    panel: (
      <>
        <div className="track">
          <div className="track__aside">
            <span className="track__ico" aria-hidden="true">
              <svg className="icon" viewBox="0 0 24 24"><path d="M2 3h20" /><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" /><path d="m7 21 5-5 5 5" /></svg>
            </span>
            <h3 className="track__name">AI for Faculty</h3>
            <p className="track__who">Educators &amp; Academic Staff</p>
            <p className="track__desc">
              Empowering educators to integrate AI responsibly across teaching, research and
              academic administration — building institutional readiness from within.
            </p>
            <div className="track__meta">
              <div>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
                <span>Format <b>Scoped to your calendar</b></span>
              </div>
              <div>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>
                <span>Language <b>English + Hindi</b></span>
              </div>
              <div>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><rect width="20" height="14" x="2" y="6" rx="2" /></svg>
                <span>Focus <b>Teaching, research &amp; policy</b></span>
              </div>
            </div>
          </div>

          <div>
            <p className="subhead">Learning outcomes</p>
            <div className="modules">
              <div className="module"><span className="module__n">01</span><div><h4 className="module__t">AI in lesson planning</h4><p className="module__d">Design lessons, activities and learning paths faster, with more personalization.</p></div></div>
              <div className="module"><span className="module__n">02</span><div><h4 className="module__t">Creating teaching resources</h4><p className="module__d">Generate slides, worksheets and examples aligned to your curriculum.</p></div></div>
              <div className="module"><span className="module__n">03</span><div><h4 className="module__t">Assessment support</h4><p className="module__d">Build question banks, rubrics and feedback with human oversight.</p></div></div>
              <div className="module"><span className="module__n">04</span><div><h4 className="module__t">Research productivity</h4><p className="module__d">Accelerate literature review, drafting and analysis responsibly.</p></div></div>
              <div className="module"><span className="module__n">05</span><div><h4 className="module__t">Academic integrity</h4><p className="module__d">Practical frameworks to uphold honesty in an AI-enabled classroom.</p></div></div>
              <div className="module"><span className="module__n">06</span><div><h4 className="module__t">Institutional AI readiness</h4><p className="module__d">Foundations for responsible AI policies across the institution.</p></div></div>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "graduate",
    button: (
      <>
        <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /><path d="M9 14h2" /><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" /><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>
        AI for Graduate Students
      </>
    ),
    panel: (
      <>
        <div className="track">
          <div className="track__aside">
            <span className="track__ico" aria-hidden="true">
              <svg className="icon" viewBox="0 0 24 24"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /><path d="M9 14h2" /><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" /><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>
            </span>
            <h3 className="track__name">AI for Graduate Students</h3>
            <p className="track__who">Research &amp; Professional Development</p>
            <p className="track__desc">
              Applying AI across research and professional work — from literature review
              through to career preparation — with the rigour postgraduate work demands.
            </p>
            <div className="track__meta">
              <div>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M6 18h8" /><path d="M3 22h18" /><path d="M14 22a7 7 0 1 0 0-14h-1" /><path d="M9 14h2" /><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" /><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" /></svg>
                <span>Focus <b>Research &amp; productivity</b></span>
              </div>
              <div>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="m5 8 6 6" /><path d="m4 14 6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" /><path d="m22 22-5-10-5 10" /><path d="M14 18h6" /></svg>
                <span>Language <b>English + Hindi</b></span>
              </div>
              <div>
                <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>
                <span>Format <b>Scoped to your cohort</b></span>
              </div>
            </div>
          </div>

          <div>
            <p className="subhead">Areas covered</p>
            <div className="modules">
              <div className="module"><span className="module__n">01</span><div><h4 className="module__t">Research</h4><p className="module__d">Framing questions and structuring enquiry with AI support.</p></div></div>
              <div className="module"><span className="module__n">02</span><div><h4 className="module__t">Literature review</h4><p className="module__d">Survey, summarise and cross-check a body of work faster.</p></div></div>
              <div className="module"><span className="module__n">03</span><div><h4 className="module__t">Academic writing</h4><p className="module__d">Draft and refine while keeping the argument your own.</p></div></div>
              <div className="module"><span className="module__n">04</span><div><h4 className="module__t">Presentations</h4><p className="module__d">Build clear, defensible academic presentations.</p></div></div>
              <div className="module"><span className="module__n">05</span><div><h4 className="module__t">Career preparation</h4><p className="module__d">Position postgraduate skills for an AI-enabled job market.</p></div></div>
              <div className="module"><span className="module__n">06</span><div><h4 className="module__t">AI productivity</h4><p className="module__d">Personal systems that compound across a research programme.</p></div></div>
            </div>
          </div>
        </div>
      </>
    ),
  },
];

export default function Programs() {
  return (
    <section className="section" id="programs" aria-labelledby="programs-title">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow" data-reveal="">Programs</p>
          <h2 className="section__title" id="programs-title" data-reveal="">AI learning programs for every stage</h2>
          <p className="section__lede" data-reveal="" data-reveal-delay="1">
            A structured curriculum spanning the full institution — from school and undergraduate
            students to faculty and advanced graduate learners. Each track is practical, hands-on,
            and grounded in real academic workflows.
          </p>
          <Link className="btn btn--primary btn--sm" href="/course/ai-study-method">
            Explore AI Study Method
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
    
      <Tabs label="AI learning programs" items={PROGRAMS} />
      </div>
    </section>
  );
}
