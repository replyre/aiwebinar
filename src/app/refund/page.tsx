import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout from "@/components/site/LegalLayout";
import { COMPANY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cancellation & refund policy | Innovgeist",
  description:
    "When an Innovgeist course fee can be cancelled and refunded, how much is returned, and how long the money takes to reach you.",
  alternates: { canonical: "/refund" },
};

/**
 * ⚠️ THIS IS THE PAGE A CHARGEBACK IS JUDGED AGAINST. When a customer disputes a payment,
 * Razorpay and the card network read this page and decide whether we did what we said. So
 * the windows below have to be the windows we actually honour — a policy more generous
 * than our practice loses disputes, and one stricter than our practice is unenforceable.
 *
 * TODO(rahul): confirm the 7-day / before-first-session window and the 50% part-refund
 * before this goes to Razorpay. These are the standard terms for live cohort courses, but
 * they are a commercial decision, not a technical one.
 */
export default function RefundPage() {
  return (
    <LegalLayout
      title="Cancellation &amp; refund policy"
      lede="When you can cancel a course enrolment, what you get back, and how long it takes."
    >
      <p>
        This policy applies to course fees paid to {COMPANY.legalName} through this website.
        Our courses are live, scheduled, small-group sessions, so a seat taken is a seat
        another student could not have.
      </p>

      <h2>Cancellation by you</h2>
      <div className="legal-table-wrap">
        <table className="legal-table">
          <thead>
            <tr>
              <th scope="col">When you ask to cancel</th>
              <th scope="col">What is refunded</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Within 7 days of paying, and before the first live session</th>
              <td>
                <strong>100% of the fee.</strong> No reason needed.
              </td>
            </tr>
            <tr>
              <th scope="row">
                More than 7 days after paying, but before the first live session
              </th>
              <td>
                <strong>50% of the fee.</strong>
              </td>
            </tr>
            <tr>
              <th scope="row">After the first live session has taken place</th>
              <td>
                <strong>No refund</strong>, because the course material has been delivered.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Cancellation by us</h2>
      <p>
        If we cancel a course or a batch, or cannot run it for any reason, you get a{" "}
        <strong>full refund of everything you paid</strong>, regardless of the table above.
        You may instead choose to move to a later batch at no extra cost.
      </p>
      <p>
        If we have to reschedule a single session, we will offer a replacement session. A
        rescheduled session is not, on its own, grounds for a refund.
      </p>

      <h2>Missed sessions</h2>
      <p>
        We do not refund sessions a student does not attend. Where a recording or a catch-up
        session is available, we will share it, but we cannot promise one for every session.
      </p>

      <h2>How to request a cancellation</h2>
      <ol>
        <li>
          Email <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> from the email
          address used at checkout, or message us on{" "}
          <a href={`tel:${COMPANY.phoneHref}`}>{COMPANY.phone}</a>.
        </li>
        <li>
          Include the <strong>enrolment reference</strong> from your confirmation email and
          the student&rsquo;s name.
        </li>
        <li>
          We acknowledge every request within {COMPANY.responseWindow} and tell you what
          will be refunded before we process it.
        </li>
      </ol>

      <h2>How the money comes back</h2>
      <p>
        Approved refunds are processed through Razorpay to the{" "}
        <strong>original payment method only</strong> — the same card, UPI ID or bank
        account the payment came from. We cannot send a refund to a different account, and
        we do not refund in cash or as credit.
      </p>
      <p>
        We initiate the refund within <strong>3 working days</strong> of approving it. It
        then normally takes <strong>5 to 7 working days</strong> to appear in your account,
        depending on your bank. Any transaction fee charged by the payment gateway is borne
        by us and is not deducted from your refund.
      </p>

      <h2>Failed and duplicate payments</h2>
      <p>
        If a payment failed but money left your account, it is normally returned
        automatically by your bank within 5 to 7 working days. If it does not, write to us
        and we will trace it. Duplicate payments for the same enrolment are refunded in
        full, and you do not need to ask — but telling us makes it faster. See the{" "}
        <Link href="/contact">contact page</Link>.
      </p>

      <h2>Discounted enrolments</h2>
      <p>
        Where a discount code was applied, any refund is calculated on the amount actually
        paid, not on the list price.
      </p>
    </LegalLayout>
  );
}
