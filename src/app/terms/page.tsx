import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout from "@/components/site/LegalLayout";
import { COMPANY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms & conditions | Innovgeist",
  description:
    "The terms on which Innovgeist Technologies Pvt. Ltd. sells and delivers online AI courses through this website.",
  alternates: { canonical: "/terms" },
};

/**
 * ⚠️ KEEP THE PROMISES HERE NARROWER THAN THE MARKETING COPY, NOT WIDER. The course pages
 * are allowed to be persuasive; this page is what we can be held to. Anywhere the two
 * disagree, this one is the version that gets read out in a dispute.
 */
export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms &amp; conditions"
      lede="The agreement between you and Innovgeist when you enrol in a course."
    >
      <p>
        These terms govern your use of this website and any course you buy through it. The
        website is operated by {COMPANY.legalName}, {COMPANY.city}, {COMPANY.state},{" "}
        {COMPANY.country} (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By enrolling, you accept
        these terms.
      </p>

      <h2>1. Who can enrol</h2>
      <p>
        Our courses are for school students. If the student is under 18, the enrolment must
        be made by a parent or legal guardian, who accepts these terms on the
        student&rsquo;s behalf and is responsible for paying the fee. By ticking the consent
        box at checkout you confirm that you are that parent or guardian.
      </p>

      <h2>2. What we provide</h2>
      <p>
        A course is a set number of <strong>live, scheduled, online sessions</strong> led by
        an instructor, together with the worksheets and templates used in them. The number
        of sessions, the level, and what is covered are stated on the course page.
      </p>
      <p>
        Sessions run over a video-conferencing tool such as Google Meet. Batch timings and
        the joining link are sent to the WhatsApp number and email address given at
        enrolment, before the course begins.
      </p>

      <h2>3. What we do not promise</h2>
      <p>
        We teach a method and give feedback on how it is applied. We do{" "}
        <strong>not guarantee any particular examination result, score, grade, rank,
        admission or career outcome</strong>. Any figures shown on this website describe what
        past students have done; they are not a forecast of what any individual student will
        achieve.
      </p>

      <h2>4. Enrolment and payment</h2>
      <ul>
        <li>An enrolment is confirmed only when the fee has been received in full.</li>
        <li>
          Fees are shown on the <Link href="/pricing">pricing page</Link> and on each course
          page, in Indian Rupees, inclusive of applicable taxes.
        </li>
        <li>
          Payment is processed by Razorpay. Your payment is also subject to Razorpay&rsquo;s
          own terms.
        </li>
        <li>
          The price displayed at the moment you enrol is the price that applies to you. A
          later price change does not affect an enrolment already paid for.
        </li>
        <li>
          A seat is personal to the named student and cannot be transferred to another
          person without our written agreement.
        </li>
      </ul>

      <h2>5. Discount codes</h2>
      <p>
        Discount codes are issued by us directly and are valid only for the courses, the
        period and the number of uses we set. A code must be entered at checkout; we cannot
        apply one to a payment already made. We may withdraw a code at any time, but never
        for an enrolment already completed with it.
      </p>

      <h2>6. Scheduling and changes</h2>
      <p>
        We may change the timing of a session, the instructor, or the order in which topics
        are covered, and will tell you in advance where we can. If we must cancel a course or
        a batch outright, the{" "}
        <Link href="/refund">cancellation &amp; refund policy</Link> applies.
      </p>

      <h2>7. Conduct in class</h2>
      <p>
        Students are expected to join on time, take part, and treat the instructor and other
        students with respect. We may remove a student from a session or from the course for
        abusive behaviour, disruption, or sharing course access with people who have not paid.
        A removal for these reasons does not entitle you to a refund.
      </p>

      <h2>8. Course material and recordings</h2>
      <p>
        All course material &mdash; slides, worksheets, prompt libraries, templates and any
        recordings &mdash; is our intellectual property. It is licensed to the enrolled
        student for their personal study only. You may not copy, resell, publish, or share it
        with anyone else, and you may not record a live session without our written
        permission.
      </p>

      <h2>9. Academic honesty</h2>
      <p>
        Our courses teach students to use AI as a study tool. Whether a school, board or
        university permits AI assistance in assessed work is a matter for that institution,
        and it is the student&rsquo;s responsibility to follow its rules. We are not
        responsible for any consequence of a student submitting AI-assisted work in breach of
        their institution&rsquo;s policy.
      </p>

      <h2>10. Requirements at your end</h2>
      <p>
        You need a device with a working camera and microphone, and a stable internet
        connection. We cannot refund sessions missed because of a problem with your device or
        connection.
      </p>

      <h2>11. Third-party AI tools</h2>
      <p>
        Courses reference third-party AI tools. We do not own or control them, and their
        availability, pricing, age requirements and terms are set by their providers and can
        change. Everything we teach can be done on the free tiers available at the time the
        course runs.
      </p>

      <h2>12. Liability</h2>
      <p>
        Nothing in these terms excludes any liability that cannot be excluded by law. Subject
        to that, our total liability arising out of a course is limited to the fee you paid
        for it, and we are not liable for indirect or consequential loss.
      </p>

      <h2>13. Suspension of the website</h2>
      <p>
        We may change, suspend or withdraw any part of this website at any time. We will not
        withdraw a course that enrolled students have already paid for without either running
        it or refunding it.
      </p>

      <h2>14. Governing law</h2>
      <p>
        These terms are governed by the laws of India. The courts at {COMPANY.city},{" "}
        {COMPANY.state} have exclusive jurisdiction over any dispute.
      </p>

      <h2>15. Changes to these terms</h2>
      <p>
        We may update these terms. The version in force for your enrolment is the one
        published on the day you paid, and the date at the top of this page shows when it was
        last changed.
      </p>

      <h2>16. Contact</h2>
      <p>
        Questions about these terms go to{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or{" "}
        <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>. See the{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    </LegalLayout>
  );
}
