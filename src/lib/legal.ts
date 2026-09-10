/**
 * Business identity, in one place.
 *
 * ⚠️ RAZORPAY READS THESE PAGES BY HAND. Adding a website to an existing Razorpay account
 * puts it through a manual review that checks for six specific pages — About, Contact,
 * Pricing, Terms, Privacy and Cancellation/Refund — and checks that what they say matches
 * the account's KYC. So every value below has to be the real registered detail, not
 * placeholder copy: a mismatch is the usual reason a website review is rejected.
 *
 * Anything still null is a fact only Rahul has. Every reader below drops a null and says
 * less instead, because a wrong CIN on a policy page is worse than an absent one.
 *
 * ⚠️ THE FILLED VALUES ARE COPIED FROM `rakhi-app/src/lib/business.ts`, DELIBERATELY. Both
 * products settle into the same Razorpay account, so a reviewer comparing the two sites
 * sees one business or two — and two sites for one merchant giving different support
 * numbers, hours or response promises is the discrepancy that fails a review. Change a
 * value here and change it there in the same sitting.
 */

export const COMPANY = {
  /**
   * ⚠️ THIS MUST MATCH THE PAN ON THE RAZORPAY ACCOUNT, CHARACTER FOR CHARACTER, and it is
   * the single most common onboarding rejection. `rakhi-app` states the entity name only
   * as the trade name "Innovgeist" with a note that nothing in the codebase confirms the
   * registered one — while this site's footer has printed "Innovgeist Technologies Pvt.
   * Ltd." since the port. Both cannot be right. The footer is kept because it predates
   * this file, but confirm it against the certificate of incorporation before submitting.
   */
  legalName: "Innovgeist Technologies Pvt. Ltd.",
  tradeName: "Innovgeist",
  email: "support@innovgeist.com",

  phone: "+91 81272 73162",
  /** `tel:` needs it unspaced. */
  phoneHref: "+918127273162",

  city: "Lucknow",
  state: "Uttar Pradesh",
  country: "India",

  /**
   * ⚠️ ALL THREE ARE BLANK IN `rakhi-app` TOO — its docs/PROGRESS.md still lists the street
   * address, PIN code and entity type as blocking its own Razorpay application, and no CIN
   * or GSTIN appears anywhere in the workspace. So there is nothing to copy across: these
   * have to come off the certificate of incorporation and the GST certificate.
   */
  addressLines: null as string[] | null,
  cin: null as string | null,
  gstin: null as string | null,

  /**
   * Support hours as actually staffed. Razorpay's reviewers do contact the number, and
   * response-time promises here become the standard a chargeback is judged against.
   */
  supportHours: "Monday to Saturday, 10:00 AM – 7:00 PM IST",
  responseWindow: "2 working days",
} as const;

/**
 * Shown as "Last updated" on every policy page.
 *
 * One constant rather than `new Date()`: a policy that claims to have been updated today,
 * every day, is a policy nobody can cite a version of.
 */
export const POLICY_UPDATED = "10 September 2026";

export const LEGAL_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact us" },
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms & conditions" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/refund", label: "Cancellation & refund" },
] as const;
