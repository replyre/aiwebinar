import type { Metadata } from "next";
import Link from "next/link";
import LegalLayout from "@/components/site/LegalLayout";
import { formatPrice, formatSessionDate } from "@/lib/course";
import { listPublishedCourses } from "@/lib/courses-server";
import { COMPANY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Pricing | Innovgeist",
  description:
    "What Innovgeist courses cost, in Indian Rupees, inclusive of taxes — the full price list with what each course includes.",
  alternates: { canonical: "/pricing" },
};

export const dynamic = "force-dynamic";

/**
 * The published price list.
 *
 * ⚠️ PRICES ARE READ FROM THE DATABASE, NEVER TYPED HERE. A price list that is maintained
 * by hand drifts from the checkout, and a page quoting a different number from the one the
 * customer is charged is exactly what a payment-gateway review is looking for.
 *
 * ⚠️ NO DISCOUNT CODE APPEARS ON THIS PAGE. Codes are handed to students directly and
 * applied inside checkout; publishing one here would make it the price for everybody.
 * `payableAmount` is the list price — the same figure the catalogue and the course pages
 * show — so all four stay in step by construction.
 */
export default async function PricingPage() {
  const courses = await listPublishedCourses();

  return (
    <LegalLayout
      title="Pricing"
      lede="Every course we sell, what it costs, and what the price includes."
      updated={false}
    >
      <h2>Course fees</h2>

      {courses.length ? (
        <div className="legal-table-wrap">
          <table className="legal-table">
            <thead>
              <tr>
                <th scope="col">Course</th>
                <th scope="col">Who it is for</th>
                <th scope="col">Next batch</th>
                <th scope="col">Fee (INR)</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr key={course.slug}>
                  <th scope="row">
                    <Link href={`/course/${course.slug}`}>{course.title}</Link>
                  </th>
                  <td>{course.audience}</td>
                  <td>
                    {course.nextStartsAt
                      ? formatSessionDate(course.nextStartsAt)
                      : "Scheduled on enrolment"}
                  </td>
                  <td>
                    <strong>{formatPrice(course.payableAmount)}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>
          No courses are open for enrolment at the moment. Please check the{" "}
          <Link href="/course">courses page</Link> or write to{" "}
          <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
        </p>
      )}

      <h2>What the fee includes</h2>
      <ul>
        <li>All live online sessions listed for that course.</li>
        <li>The worksheets, prompt libraries and templates used during the sessions.</li>
        <li>Instructor feedback on the work done in class.</li>
        <li>A certificate of completion, where the course lists one.</li>
      </ul>

      <h2>What it does not include</h2>
      <ul>
        <li>
          Paid subscriptions to third-party AI tools. Everything taught can be done on the
          free tiers.
        </li>
        <li>Internet access, a device, or any hardware.</li>
        <li>One-to-one tutoring outside the scheduled sessions.</li>
      </ul>

      <h2>Currency and taxes</h2>
      <p>
        All prices are in <strong>Indian Rupees (INR)</strong> and are the total amount
        payable. Applicable taxes are included in the price shown — there is nothing added
        at checkout. We do not charge a separate registration, platform or convenience fee.
      </p>

      <h2>Payment</h2>
      <p>
        Fees are paid in full at the time of enrolment through Razorpay, which accepts UPI,
        debit and credit cards, net banking and wallets. We do not store your card or UPI
        details — they are handled entirely by Razorpay. We do not offer instalments.
      </p>

      <h2>Discount codes</h2>
      <p>
        We sometimes issue discount codes directly to students, schools and partners. If you
        have one, there is a field to enter it in the enrolment form and the reduced amount
        is shown to you before you pay. Codes are not published on this website.
      </p>

      <h2>Price changes</h2>
      <p>
        We may change course fees at any time. The price shown on the course page at the
        moment you enrol is the price you pay, and a later change never affects an enrolment
        already paid for.
      </p>
    </LegalLayout>
  );
}
