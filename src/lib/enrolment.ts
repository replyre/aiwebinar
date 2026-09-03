import { z } from "zod";

/**
 * What we ask for at checkout, and nothing more.
 *
 * ⚠️ THE LEARNER IS A MINOR (Class 9–12), so this is children's data under the DPDP Act
 * 2023 and the collection is deliberately thin: no address, no date of birth, no school ID.
 * A guardian is required — they consent and they pay — and the consent is recorded with its
 * text version, timestamp and IP so it can be evidenced later.
 *
 * Same schema on the client and the server. The client copy decides where the red text
 * goes; the server copy is the one that decides anything.
 */

const text = (max: number) => z.string().trim().max(max);

export const STUDENT_CLASSES = ["9", "10", "11", "12"] as const;
export const BOARDS = ["CBSE", "ICSE / ISC", "State Board", "IB / IGCSE", "Other"] as const;
export const RELATIONSHIPS = ["Mother", "Father", "Guardian"] as const;

/**
 * The exact wording the guardian agrees to. Versioned, because consent is only evidence of
 * what was on the screen at the time — if the wording changes, old records must still say
 * what those people actually agreed to.
 */
export const CONSENT_VERSION = "2026-09-03.v1";
export const CONSENT_TEXT =
  "I am the parent or legal guardian of this student. I consent to Innovgeist Technologies " +
  "Pvt. Ltd. collecting and processing my child's details for the purpose of delivering " +
  "this course, and I consent to my child taking part in it.";

/**
 * ⚠️ THE CLIENT NAMES A COURSE AND MAYBE A BATCH — NEVER AN AMOUNT. The price and any
 * discount are looked up server-side from the slug. A client that could name its own amount
 * could buy a ₹999 seat for ₹1.
 *
 * ⚠️ `cohortId` IS OPTIONAL, AND THAT IS THE POINT. Batches and dates are arranged over
 * WhatsApp, so a published course sells whether or not a batch has been set up yet — the
 * student is enrolled against the course and placed into a batch later. Requiring a batch
 * here is what made a live course show "enrolment isn't open yet" and take no money.
 */
export const enrolmentSchema = z.object({
  courseSlug: text(80).min(1, "Missing course."),
  cohortId: text(64).optional().default(""),

  /**
   * ⚠️ SIX FIELDS, NOT TEN. Board, school, city and the guardian's relationship were all
   * required or shown at checkout, and every one of them is a question we can just as
   * easily ask over WhatsApp *after* the money has moved. A payment form is not a place to
   * finish building a student record — each extra field is a place to abandon.
   *
   * They stay in the schema as optional so an admin or a later step can fill them without
   * a migration.
   */
  student: z.object({
    fullName: text(120).min(1, "This field is required."),
    class: z.enum(STUDENT_CLASSES, { message: "Choose a class." }),
    board: text(40).optional().default(""),
    school: text(160).optional().default(""),
    city: text(80).optional().default(""),
    /** The one subject the student commits to in Week 1. Chosen in the first class. */
    subject: text(80).optional().default(""),
  }),

  guardian: z.object({
    fullName: text(120).min(1, "This field is required."),
    relationship: text(20).optional().default(""),
    email: text(200).min(1, "This field is required.").pipe(
      z.email("Enter a valid email address."),
    ),
    /**
     * Loose on purpose. The joining link goes out over WhatsApp, so this number matters
     * more than the email — and a strict `+91 XXXXXXXXXX` pattern rejects the perfectly
     * real ways people type their own number. Ten digits somewhere in the string is the
     * check worth making.
     */
    phone: text(24)
      .min(1, "This field is required.")
      .refine((v) => (v.replace(/\D/g, "").length >= 10), "Enter a valid phone number."),
  }),

  /**
   * Optional discount code, as typed. Only the string crosses the wire — never the
   * discounted amount, which the server recomputes from the code.
   */
  couponCode: text(40).optional().default(""),

  /** Must be ticked. `z.literal(true)` is what makes an unticked box an error. */
  consent: z.literal(true, { message: "Please confirm to continue." }),

  /** Honeypot. Any value means a bot. */
  _honey: z.string().max(200).optional().default(""),
});

export type EnrolmentInput = z.input<typeof enrolmentSchema>;
export type Enrolment = z.output<typeof enrolmentSchema>;

export const PAYMENT_STATUSES = [
  "not_required",
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ENROLMENT_STATUSES = ["pending", "confirmed", "cancelled"] as const;
export type EnrolmentStatus = (typeof ENROLMENT_STATUSES)[number];

/** What `POST /api/course/enrol` answers with. */
export interface EnrolResponse {
  ok: boolean;
  errors?: Record<string, string>;
  message?: string;
  /** Present when payment is needed — everything Checkout has to be opened with. */
  order?: {
    enrolmentId: string;
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
    isTestMode: boolean;
    prefill: { name: string; email: string; contact: string };
    /** What the server actually applied — null if the code was dropped. */
    appliedCoupon: { code: string; savedAmount: number } | null;
  };
  /** Present when the course was free, or a discount took it to zero. */
  confirmedUrl?: string;
}

/**
 * Flattens Zod issues into `{ "guardian.email": "…" }`, which is the key the form uses to
 * put a message under the right field.
 */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
