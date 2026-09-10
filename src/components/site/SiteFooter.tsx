import Link from "next/link";
import { LEGAL_LINKS } from "@/lib/legal";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size logo with a
                hand-authored 2x asset; next/image would re-encode it for no gain. */}
            <img src="/assets/img/innovgeist-logo-light@2x.png" alt="Innovgeist" width="170" height="28" loading="lazy" decoding="async" />
            <p className="site-footer__tagline">AI Software &middot; Intelligent Automation &middot; Education Technology</p>
            <p className="site-footer__line">Building the future with responsible AI.</p>
            <ul className="taglist taglist--onDark">
              <li>DPIIT Recognized</li>
              <li>Startup India</li>
              <li>Lucknow, UP</li>
            </ul>
          </div>
    
          <nav className="site-footer__nav" aria-label="Footer">
            <div>
              <h2 className="site-footer__heading">Programs</h2>
              <ul>
                <li><a href="#programs">AI for Students</a></li>
                <li><a href="#programs">AI for Faculty</a></li>
                <li><a href="#programs">AI for Graduate Students</a></li>
                <li><a href="#session">Inside the Session</a></li>
              </ul>
            </div>
            <div>
              <h2 className="site-footer__heading">Company</h2>
              <ul>
                <li><a href="#why-innovgeist">Why Innovgeist</a></li>
                <li><a href="#architecture">Readiness Model</a></li>
                <li><a href="#trainer">Meet the Trainer</a></li>
                <li><a href="#proof">Proof of Work</a></li>
                <li><a href="#process">How We Work</a></li>
              </ul>
            </div>
            <div>
              <h2 className="site-footer__heading">Contact</h2>
              <ul>
                <li><a href="https://aiwebinar.innovgeist.com/">aiwebinar.innovgeist.com</a></li>
                <li><a href="mailto:support@innovgeist.com">support@innovgeist.com</a></li>
                <li><a href="tel:+918127273162">+91 81272 73162</a></li>
                <li>Lucknow, Uttar Pradesh</li>
              </ul>
            </div>
          </nav>
        </div>
    
        {/* Razorpay's website review checks that all six policy pages are reachable, and
            reachable from anywhere — so they live in the footer rather than on one page. */}
        <nav className="site-footer__legal" aria-label="Policies">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>

        <div className="site-footer__bottom">
          <p>&copy; {new Date().getFullYear()} Innovgeist Technologies Pvt. Ltd. &middot; All rights reserved.</p>
          {/* TODO: confirm the official LinkedIn company URL before launch. */}
          <a className="site-footer__social" href="https://www.linkedin.com/company/innovgeist/" rel="noopener noreferrer" target="_blank">
            <svg className="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
