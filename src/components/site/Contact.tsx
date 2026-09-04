import EnquiryForm from "@/components/site/EnquiryForm";

export default function Contact() {
  return (
    <section className="section section--tint-2" id="contact" aria-labelledby="contact-title">
      <div className="container">
        <div className="section__head section__head--split">
          <div>
            <p className="eyebrow" data-reveal="">Let&rsquo;s Begin</p>
            <h2 className="section__title section__title--lg" id="contact-title" data-reveal="">
              Let&rsquo;s build an AI-ready institution together
            </h2>
          </div>
          <p className="section__lede" data-reveal="" data-reveal-delay="1">
            Empower your institution with practical AI literacy, responsible technology adoption
            and future-ready learning — designed by professionals who build AI every day.
          </p>
        </div>
    
        <div className="contact">
          <div data-reveal="">
        <EnquiryForm source="Contact section" />
          </div>
    
          <div className="contact__aside" data-reveal="" data-reveal-delay="1">
            <p className="subhead">Direct contact</p>
            <ul className="contact__list">
              <li>
                <span className="contact__ico" aria-hidden="true"><svg className="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg></span>
                <span className="contact__k">Website</span>
                <a className="contact__v" href="https://aiwebinar.innovgeist.com/">aiwebinar.innovgeist.com</a>
              </li>
              <li>
                <span className="contact__ico" aria-hidden="true"><svg className="icon" viewBox="0 0 24 24"><path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" /><rect x="2" y="4" width="20" height="16" rx="2" /></svg></span>
                <span className="contact__k">Email</span>
                <a className="contact__v" href="mailto:support@innovgeist.com">support@innovgeist.com</a>
              </li>
              <li>
                <span className="contact__ico" aria-hidden="true"><svg className="icon" viewBox="0 0 24 24"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" /></svg></span>
                <span className="contact__k">Phone</span>
                <a className="contact__v" href="tel:+918127273162">+91 81272 73162</a>
              </li>
              <li>
                <span className="contact__ico" aria-hidden="true"><svg className="icon" viewBox="0 0 24 24"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg></span>
                <span className="contact__k">Location</span>
                <span className="contact__v">Lucknow, Uttar Pradesh, India</span>
              </li>
            </ul>
    
            <a className="btn btn--onDark btn--block" href="/assets/docs/Innovgeist-AI-Education-Partnership-Proposal.pdf" download={true}>
              <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5" /><path d="M12 15V3" /></svg>
              Download the full proposal (PDF)
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
