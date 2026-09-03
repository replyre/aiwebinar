export default function AnnouncementBar() {
  return (
    <div className="topbar">
      <div className="topbar__viewport">
        <div className="topbar__track">
          <div className="topbar__group">
            <span className="topbar__dot" aria-hidden="true"></span>
            <span><strong>Now scheduling</strong> AI literacy sessions for the 2026&ndash;27 academic year</span>
            <a href="#contact">
              Reserve a slot
              <svg className="icon icon--sm" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </a>
          </div>
          {/* Second copy so the mobile marquee loops seamlessly at -50%. Inert:
               the link is a span here, so it is neither focusable nor announced. */}
          <div className="topbar__group topbar__group--loop" aria-hidden="true">
            <span className="topbar__dot"></span>
            <span><strong>Now scheduling</strong> AI literacy sessions for the 2026&ndash;27 academic year</span>
            <span className="topbar__cta">
              Reserve a slot
              <svg className="icon icon--sm" viewBox="0 0 24 24"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
