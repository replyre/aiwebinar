import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout from "@/components/site/LegalLayout";
import { COMPANY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contact us | Innovgeist",
  description:
    "Reach Innovgeist Technologies Pvt. Ltd. by email, phone or WhatsApp for course enquiries, payment questions and support.",
  alternates: { canonical: "/contact" },
};

/**
 * ⚠️ THE REVIEWER WILL USE THESE. Razorpay's website review contacts the number and the
 * address on this page, and a support channel that does not answer is a rejection. Do not
 * list a channel here that nobody watches.
 */
export default function ContactPage() {
  return (
    <LegalLayout
      title="Contact us"
      lede="How to reach a person at Innovgeist, and how long it takes."
      updated={false}
    >
      <h2>Registered entity</h2>
      <p>
        <strong>{COMPANY.legalName}</strong>
      </p>
      {COMPANY.addressLines ? (
        <p>
          {COMPANY.addressLines.map((line) => (
            <span key={line}>
              {line}
              <br />
            </span>
          ))}
        </p>
      ) : (
        <p>
          {COMPANY.city}, {COMPANY.state}, {COMPANY.country}
        </p>
      )}
      {COMPANY.cin ? (
        <p>
          CIN: <strong>{COMPANY.cin}</strong>
        </p>
      ) : null}
      {COMPANY.gstin ? (
        <p>
          GSTIN: <strong>{COMPANY.gstin}</strong>
        </p>
      ) : null}

      <h2>Get in touch</h2>
      <dl className="legal-dl">
        <div>
          <dt>Email</dt>
          <dd>
            <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
          </dd>
        </div>
        <div>
          <dt>Phone and WhatsApp</dt>
          <dd>
            <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>
          </dd>
        </div>
        <div>
          <dt>Support hours</dt>
          <dd>{COMPANY.supportHours}</dd>
        </div>
        <div>
          <dt>Response time</dt>
          <dd>We reply within {COMPANY.responseWindow}.</dd>
        </div>
      </dl>

      <h2>What to write to us about</h2>
      <ul>
        <li>
          <strong>Course and enrolment questions</strong> — what a course covers, whether it
          suits a particular student, batch timings.
        </li>
        <li>
          <strong>Payment problems</strong> — money debited but no confirmation, a failed
          payment, or a duplicate charge. Quote the enrolment reference from your
          confirmation email so we can find it immediately.
        </li>
        <li>
          <strong>Cancellations and refunds</strong> — see the{" "}
          <Link href="/refund">cancellation &amp; refund policy</Link> first, then write to us
          from the email address used at checkout.
        </li>
        <li>
          <strong>Privacy requests</strong> — to see, correct or delete the personal data we
          hold. See the <Link href="/privacy">privacy policy</Link>.
        </li>
        <li>
          <strong>Schools, colleges and universities</strong> — use the{" "}
          <Link href="/#contact">institutional enquiry form</Link> on the home page.
        </li>
      </ul>

      <h2>A note on payment queries</h2>
      <p>
        If a payment left your account but you did not receive a confirmation, do not pay
        again. Bank authorisations sometimes settle late. Write to us with the date, the
        amount and the last four digits of the payment method, and we will trace it and
        either confirm the seat or return the money.
      </p>
    </LegalLayout>
  );
}
