import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout from "@/components/site/LegalLayout";
import { COMPANY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy policy | Innovgeist",
  description:
    "What personal data Innovgeist collects when you enrol in a course, why we collect it, who we share it with, and how to have it deleted.",
  alternates: { canonical: "/privacy" },
};

/**
 * ⚠️ MOST OF OUR STUDENTS ARE MINORS, WHICH CHANGES THE LAW THAT APPLIES. Under the Digital
 * Personal Data Protection Act 2023, processing a child's data needs verifiable consent
 * from a parent or guardian, and rules out tracking or behavioural advertising directed at
 * them. That is why enrolment is built around the guardian rather than the student, and why
 * the consent text is versioned in `lib/enrolment.ts`.
 *
 * ⚠️ THIS PAGE MUST DESCRIBE THE FIELDS THE FORM ACTUALLY COLLECTS. It is written against
 * `enrolmentSchema` — if a field is added or dropped there, change it here in the same
 * commit. A privacy policy that under-declares is the kind of thing that only surfaces
 * during a complaint, when it is too late to fix.
 */
export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy policy"
      lede="What we collect, why, who else sees it, and how to get it removed."
    >
      <p>
        This policy explains how {COMPANY.legalName} handles personal data collected through
        this website. We are the data fiduciary for that data. It is written to comply with
        the Digital Personal Data Protection Act, 2023.
      </p>

      <h2>What we collect</h2>
      <p>When you enrol a student in a course, we ask for:</p>
      <ul>
        <li>
          <strong>About the student</strong> &mdash; full name and current class. Optionally,
          and only if you choose to give them, the board, school, city and the subject the
          student wants to work on.
        </li>
        <li>
          <strong>About the parent or guardian</strong> &mdash; full name, email address,
          phone number, and relationship to the student.
        </li>
        <li>
          <strong>Consent</strong> &mdash; a record that the guardian agreed, the exact
          wording they agreed to, and when.
        </li>
        <li>
          <strong>Payment records</strong> &mdash; the amount, the enrolment reference, and
          the identifiers Razorpay returns for the order and the payment.
        </li>
      </ul>
      <p>
        If you create an account to see your enrolments, we also store your email address and
        a cryptographic hash of your password. We never store the password itself.
      </p>
      <p>
        If you use the institutional enquiry form, we store the contact details and the
        message you send.
      </p>

      <h3>What we never collect</h3>
      <p>
        <strong>
          We never see or store your card number, CVV, UPI PIN, net-banking credentials or
          any other payment credential.
        </strong>{" "}
        Payment is handled entirely inside the Razorpay checkout. We receive only a
        confirmation that a payment succeeded and an identifier for it.
      </p>
      <p>
        We do not collect government identity numbers, biometric data, or any special
        category of personal data.
      </p>

      <h2>Why we collect it</h2>
      <ul>
        <li>To create the enrolment and reserve the seat.</li>
        <li>
          To send the batch schedule and joining link &mdash; by email and on WhatsApp, which
          is how our joining details go out.
        </li>
        <li>To run the class: know who is expected, and mark the work.</li>
        <li>To take payment, issue receipts, and process refunds.</li>
        <li>To keep the accounting and tax records the law requires us to keep.</li>
        <li>To answer support requests.</li>
      </ul>
      <p>
        We do not sell personal data. We do not use it for behavioural advertising, and we do
        not run advertising or tracking directed at children.
      </p>

      <h2>Children&rsquo;s data</h2>
      <p>
        Our courses are for school students, most of whom are under 18. A student is{" "}
        <strong>always enrolled by a parent or guardian</strong>, who confirms that they are
        the parent or legal guardian and consents on the child&rsquo;s behalf. We keep that
        consent, and the version of the wording it was given against, as a record.
      </p>
      <p>
        We collect the minimum needed to teach the class. We do not profile children, do not
        track them across sites, and do not show them advertising.
      </p>

      <h2>Who else sees your data</h2>
      <p>We share data only with the service providers who make the site work:</p>
      <ul>
        <li>
          <strong>Razorpay</strong> &mdash; to take payments and process refunds. Razorpay is
          the controller of the payment-instrument data you enter in their checkout, under
          their own privacy policy.
        </li>
        <li>
          <strong>MongoDB Atlas</strong> &mdash; the database where enrolments are stored.
        </li>
        <li>
          <strong>Vercel</strong> &mdash; hosting for this website.
        </li>
        <li>
          <strong>Our email provider</strong> &mdash; to send confirmation and joining
          emails.
        </li>
        <li>
          <strong>Google Meet and WhatsApp</strong> &mdash; for running sessions and sending
          joining details.
        </li>
      </ul>
      <p>
        We may also disclose data where the law requires it. Beyond that, we do not share it
        with anyone.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>
          <strong>Enrolment and student records</strong> &mdash; for the duration of the
          course and up to 3 years afterwards, so we can reissue certificates and answer
          queries.
        </li>
        <li>
          <strong>Payment and invoice records</strong> &mdash; for 8 years, as required by
          tax and company law. These we cannot delete on request.
        </li>
        <li>
          <strong>Enquiry messages</strong> &mdash; up to 2 years.
        </li>
      </ul>

      <h2>Your rights</h2>
      <p>Under the DPDP Act you may ask us to:</p>
      <ul>
        <li>tell you what personal data we hold about you or your child;</li>
        <li>correct anything that is wrong or out of date;</li>
        <li>delete it, except where we are legally required to keep it;</li>
        <li>
          withdraw consent &mdash; although this may mean we can no longer run the course for
          that student;
        </li>
        <li>nominate someone to exercise these rights if you are unable to.</li>
      </ul>
      <p>
        Write to <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> from the email
        address used at enrolment. We respond within {COMPANY.responseWindow} and complete
        the request within 30 days. If you are not satisfied with our answer, you may
        complain to the Data Protection Board of India.
      </p>

      <h2>Security</h2>
      <p>
        The site is served over HTTPS. Passwords are stored only as hashes. Access to the
        database is restricted to the people who need it to run courses. Payments are
        verified server-side with a cryptographic signature, so a payment cannot be faked
        from a browser.
      </p>
      <p>
        No system is perfectly secure. If a breach occurs that affects your data, we will
        notify you and the Data Protection Board as the law requires.
      </p>

      <h2>Cookies</h2>
      <p>
        We use a small number of strictly necessary cookies &mdash; to keep you signed in to
        your account and to keep the enrolment form working across a page load. We do not use
        advertising or cross-site tracking cookies.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We will update this page when our practices change, and the date at the top will
        change with it. For anything material, we will also email people with an active
        enrolment.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy go to{" "}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> or{" "}
        <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>. Postal details are on the{" "}
        <Link href="/contact">contact page</Link>.
      </p>
    </LegalLayout>
  );
}
