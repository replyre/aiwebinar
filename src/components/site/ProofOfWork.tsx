import Gallery from "@/components/site/Gallery";

export default function ProofOfWork() {
  return (
    <section className="section section--tint" id="proof" aria-labelledby="proof-title">
      <div className="container">
        <div className="section__head section__head--split">
          <div>
            <p className="eyebrow" data-reveal="">Proof of Work</p>
            <h2 className="section__title" id="proof-title" data-reveal="">Innovgeist in the field</h2>
          </div>
          <p className="section__lede" data-reveal="" data-reveal-delay="1">
            Beyond the classroom, Innovgeist backs the innovation ecosystem directly — as a Prize
            Pool Sponsor and mentor at HACK X VID-YOUTH, hosted at the Kalam Hall Incubation
            Center, IET Lucknow.
          </p>
        </div>
    
        <div className="event-card" data-reveal="">
          <span className="event-card__ico" aria-hidden="true">
            <svg className="icon" viewBox="0 0 24 24"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /></svg>
          </span>
          <div>
            <h3>HACK X VID-YOUTH &mdash; Kalam Hall Incubation Center, IET Lucknow</h3>
            <p>Prize Pool Sponsor · Evaluation &amp; Mentorship · 2026</p>
          </div>
          <a className="btn btn--secondary btn--sm" href="#contact">Discuss a collaboration</a>
        </div>
    
      <Gallery>
        <li data-reveal="">
          <button className="gallery__btn" type="button" data-full="/assets/img/gallery/hackxvid-certificate@2x.jpg" data-caption="Certificate of appreciation presented to Innovgeist at HACK X VID-YOUTH, Kalam Hall Incubation Center, IET Lucknow.">
            <picture>
              <source type="image/webp" srcSet="/assets/img/gallery/hackxvid-certificate.webp 800w, /assets/img/gallery/hackxvid-certificate@2x.webp 1504w" sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 480px" />
              <img src="/assets/img/gallery/hackxvid-certificate.jpg" srcSet="/assets/img/gallery/hackxvid-certificate.jpg 800w, /assets/img/gallery/hackxvid-certificate@2x.jpg 1504w" sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 480px" alt="Innovgeist receiving a certificate of appreciation alongside faculty at HACK X VID-YOUTH, IET Lucknow." width="800" height="534" loading="lazy" decoding="async" />
            </picture>
            <span className="gallery__zoom" aria-hidden="true">
              <svg className="icon icon--sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /><path d="M11 8v6" /><path d="M8 11h6" /></svg>
            </span>
            <span className="gallery__overlay">
              <b>Recognition at HACK X VID-YOUTH</b>
              <span>Certificate of appreciation · IET Lucknow</span>
            </span>
          </button>
        </li>
        <li data-reveal="" data-reveal-delay="1">
          <button className="gallery__btn" type="button" data-full="/assets/img/gallery/hackxvid-address@2x.jpg" data-caption="Addressing participants and faculty at the HACK X VID-YOUTH hackathon, IET Lucknow.">
            <picture>
              <source type="image/webp" srcSet="/assets/img/gallery/hackxvid-address.webp 800w, /assets/img/gallery/hackxvid-address@2x.webp 1600w" sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 480px" />
              <img src="/assets/img/gallery/hackxvid-address.jpg" srcSet="/assets/img/gallery/hackxvid-address.jpg 800w, /assets/img/gallery/hackxvid-address@2x.jpg 1600w" sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 480px" alt="Atul Kumar Verma addressing participants and faculty at HACK X VID-YOUTH, IET Lucknow." width="800" height="534" loading="lazy" decoding="async" />
            </picture>
            <span className="gallery__zoom" aria-hidden="true">
              <svg className="icon icon--sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /><path d="M11 8v6" /><path d="M8 11h6" /></svg>
            </span>
            <span className="gallery__overlay">
              <b>Addressing participants &amp; faculty</b>
              <span>Opening session · Kalam Hall</span>
            </span>
          </button>
        </li>
        <li data-reveal="" data-reveal-delay="2">
          <button className="gallery__btn" type="button" data-full="/assets/img/gallery/hackxvid-evaluation@2x.jpg" data-caption="Evaluation panel ahead of the first assessment round at HACK X VID-YOUTH, IET Lucknow.">
            <picture>
              <source type="image/webp" srcSet="/assets/img/gallery/hackxvid-evaluation.webp 800w, /assets/img/gallery/hackxvid-evaluation@2x.webp 1600w" sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 480px" />
              <img src="/assets/img/gallery/hackxvid-evaluation.jpg" srcSet="/assets/img/gallery/hackxvid-evaluation.jpg 800w, /assets/img/gallery/hackxvid-evaluation@2x.jpg 1600w" sizes="(max-width: 700px) 92vw, (max-width: 1200px) 46vw, 480px" alt="Evaluation panel seated ahead of the first assessment round at HACK X VID-YOUTH, IET Lucknow." width="800" height="534" loading="lazy" decoding="async" />
            </picture>
            <span className="gallery__zoom" aria-hidden="true">
              <svg className="icon icon--sm" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /><path d="M11 8v6" /><path d="M8 11h6" /></svg>
            </span>
            <span className="gallery__overlay">
              <b>Evaluation &amp; mentorship panel</b>
              <span>Judging round · 2026</span>
            </span>
          </button>
        </li>
      </Gallery>
      </div>
    </section>
  );
}
