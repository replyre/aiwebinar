import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout from "@/components/site/LegalLayout";
import { COMPANY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "About us | Innovgeist",
  description:
    "Innovgeist Technologies Pvt. Ltd. builds AI software and runs practical AI education programmes for students, faculty and institutions from Lucknow, Uttar Pradesh.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalLayout
      title="About us"
      lede="Who runs this site, what we sell, and who we sell it to."
      updated={false}
    >
      <h2>Who we are</h2>
      <p>
        {COMPANY.legalName} (&ldquo;{COMPANY.tradeName}&rdquo;) is a technology company
        registered in {COMPANY.city}, {COMPANY.state}, {COMPANY.country}. We are recognised
        by DPIIT under the Startup India programme.
      </p>
      <p>
        We work in two areas: AI software and intelligent automation for businesses, and
        practical AI education for students, faculty and institutions.
      </p>

      <h2>What we sell on this website</h2>
      <p>
        This website sells <strong>paid online courses in artificial intelligence for
        school and college students</strong>, delivered live over video call by an
        instructor. A course is a fixed number of scheduled live sessions together with
        the worksheets, prompts and templates used in them.
      </p>
      <p>
        We also run training programmes and workshops for schools, colleges and
        universities. Those are arranged directly with the institution and are not sold
        through the checkout on this site.
      </p>
      <p>
        Every course currently open for enrolment, with its price and what it includes, is
        listed on the <Link href="/course">courses page</Link>.
      </p>

      <h2>How the courses run</h2>
      <ul>
        <li>Sessions are live and online. They are not pre-recorded video.</li>
        <li>
          After you pay, we contact you on the WhatsApp number given at checkout with the
          batch schedule and the joining link.
        </li>
        <li>
          Class sizes are kept small so that every student gets to ask questions and gets
          their work looked at.
        </li>
        <li>
          Students under 18 enrol through a parent or guardian, who is the person we
          contact and the person who pays.
        </li>
      </ul>

      <h2>What we teach, and what we do not</h2>
      <p>
        Our courses teach students to use AI as a study and thinking tool — to break a
        problem down, check an answer, and build something with it. We do not teach or
        encourage students to have AI produce work that they then submit as their own.
      </p>

      <h2>Contact</h2>
      <p>
        Write to <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or call{" "}
        <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>. Full details and support
        hours are on the <Link href="/contact">contact page</Link>.
      </p>
    </LegalLayout>
  );
}
