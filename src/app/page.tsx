import AnnouncementBar from "@/components/site/AnnouncementBar";
import BeforeAfterBand from "@/components/site/BeforeAfterBand";
import Challenges from "@/components/site/Challenges";
import Contact from "@/components/site/Contact";
import Faq from "@/components/site/Faq";
import Hero from "@/components/site/Hero";
import Process from "@/components/site/Process";
import Programs from "@/components/site/Programs";
import PromoModal from "@/components/site/PromoModal";
import ProofOfWork from "@/components/site/ProofOfWork";
import ReadinessModel from "@/components/site/ReadinessModel";
import SessionFlow from "@/components/site/SessionFlow";
import SiteFooter from "@/components/site/SiteFooter";
import SiteHeader from "@/components/site/SiteHeader";
import { formatPrice, formatSessionDate } from "@/lib/course";
import { listPublishedCourses } from "@/lib/courses-server";
import Trainer from "@/components/site/Trainer";
import WhyInnovgeist from "@/components/site/WhyInnovgeist";

/**
 * The institutional partnership page, section for section as it was before the port.
 *
 * Everything here is a server component except `SiteHeader`, `PromoModal` and the four
 * pieces of stateful UI they nest (the carousel, the tabs, the layer stack, the gallery and
 * the form). That split is the point of the port: the copy, the SVGs and the responsive
 * `<picture>` markup — which is most of the page — never reach the client as JavaScript.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  /**
   * Live courses for the nav dropdown. Read here, in the server component, so the header
   * gets a small ready-made list rather than fetching on the client after paint — a menu
   * that appears a second late is a menu people have already moved past.
   */
  const courses = await listPublishedCourses();
  const navCourses = courses.map((course) => ({
    slug: course.slug,
    title: course.title,
    audience: course.audience,
    priceLabel: formatPrice(course.payableAmount),
    startsLabel: course.nextStartsAt ? formatSessionDate(course.nextStartsAt) : null,
  }));

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      {/* Scroll target for the brand link in the header. */}
      <span id="top" aria-hidden="true" />

      <AnnouncementBar />
      <SiteHeader courses={navCourses} />

      <main id="main">
        <Hero />
        <Challenges />
        <BeforeAfterBand />
        <Programs />
        <SessionFlow />
        <ReadinessModel />
        <WhyInnovgeist />
        <Process />
        <Trainer />
        <ProofOfWork />
        <Faq />
        <Contact />
      </main>

      <SiteFooter />
      <PromoModal />
    </>
  );
}
