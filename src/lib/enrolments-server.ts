import "server-only";

import { ObjectId, type Db } from "mongodb";
import type { Cohort, Course } from "@/lib/course";
import type { Enrolment, EnrolmentStatus, PaymentStatus } from "@/lib/enrolment";
import { claimSeat } from "@/lib/courses-server";
import { redeemCoupon } from "@/lib/coupons-server";
import { getDb } from "@/lib/mongodb";

/** An enrolment as it is stored: the honeypot is a gate, never a field. */
type StoredEnrolment = Omit<Enrolment, "_honey">;

/**
 * What a coupon did, frozen onto the enrolment.
 *
 * ⚠️ A SNAPSHOT, NOT A REFERENCE. Recording only the code would mean the price this parent
 * actually paid becomes unreadable the moment the coupon is edited or deleted — and "what
 * did we charge them and why" is precisely the question a refund or a dispute asks.
 */
export interface AppliedCoupon {
  code: string;
  label: string;
  type: string;
  value: number;
  /** Paise taken off by the coupon alone. */
  savedAmount: number;
}

/**
 * Writing and confirming enrolments.
 *
 * ⚠️ THE ORDER OF OPERATIONS HERE IS THE PRODUCT. An enrolment row is created *before*
 * Razorpay is ever called, in `pending`, so a payment can always be traced back to a person
 * — including one that fails, which is exactly the row you need when a parent says "it took
 * my money". Only a verified payment flips it to `confirmed`, and only then is a seat
 * claimed.
 */

export interface EnrolmentDoc {
  _id: ObjectId;
  courseSlug: string;
  /** `null` until a batch is assigned — batches are arranged over WhatsApp. */
  cohortId: string | null;
  student: Enrolment["student"];
  guardian: Enrolment["guardian"];
  consent: { textVersion: string; text: string; at: Date; ip: string };
  payment: {
    status: PaymentStatus;
    /** What we asked for, in paise, computed server-side at order time. */
    amount: number;
    currency: "INR";
    listAmount: number;
    discountAmount: number;
    coupon: AppliedCoupon | null;
    razorpayOrderId: string | null;
    razorpayPaymentId: string | null;
    paidAt: Date | null;
  };
  status: EnrolmentStatus;
  /** Set once a seat has actually been taken, so it can never be double-counted. */
  seatClaimed: boolean;
  /** Random, unguessable — this is what the confirmation URL is keyed on. */
  reference: string;
  meta: { ip: string; userAgent: string };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The confirmation page's address.
 *
 * ⚠️ NOT THE MONGO `_id`. An ObjectId is largely a timestamp plus a counter, so one valid
 * confirmation URL makes its neighbours guessable — and this page shows a child's name,
 * their school and a guardian's phone number. 24 random hex characters are not walkable.
 */
function makeReference(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createPendingEnrolment(input: {
  course: Course;
  cohort: Cohort | null;
  enrolment: StoredEnrolment;
  consentText: string;
  consentVersion: string;
  ip: string;
  userAgent: string;
  /**
   * The already-validated coupon, or null. Passed in rather than looked up here so that
   * the route does the validating in one place and this function stays a writer.
   */
  coupon: AppliedCoupon | null;
  /** The final charge in paise, computed by the route. Must match the Razorpay order. */
  amount: number;
}): Promise<EnrolmentDoc> {
  const db = await getDb();
  const now = new Date();
  const { amount } = input;

  const doc: Omit<EnrolmentDoc, "_id"> = {
    courseSlug: input.course.slug,
    cohortId: input.cohort?.id ?? null,
    student: input.enrolment.student,
    guardian: input.enrolment.guardian,
    consent: {
      textVersion: input.consentVersion,
      // The wording is stored alongside the version, not just referenced by it — a
      // version number is only useful if the text it names still exists somewhere.
      text: input.consentText,
      at: now,
      ip: input.ip,
    },
    payment: {
      status: amount === 0 ? "not_required" : "pending",
      amount,
      currency: "INR",
      listAmount: input.course.pricing.listAmount,
      discountAmount: input.course.pricing.listAmount - amount,
      coupon: input.coupon,
      razorpayOrderId: null,
      razorpayPaymentId: null,
      paidAt: null,
    },
    status: "pending",
    seatClaimed: false,
    reference: makeReference(),
    meta: { ip: input.ip, userAgent: input.userAgent.slice(0, 400) },
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("enrolments").insertOne(doc);
  return { ...doc, _id: result.insertedId } as EnrolmentDoc;
}

/**
 * Reopen a `pending` or `failed` enrolment against a fresh Razorpay order — used to let a
 * guardian retry a payment that never went through, instead of starting a brand new
 * enrolment (and duplicate row) from scratch.
 *
 * ⚠️ RESETS `failed` BACK TO `pending`. `confirmPayment`'s atomic guard only flips a row that
 * is still `pending`, so a retried order attached to a still-`failed` row would confirm
 * silently to nobody — the payment would succeed and the seat would never be claimed.
 */
export async function reopenEnrolmentForPayment(
  enrolmentId: ObjectId,
  razorpayOrderId: string,
): Promise<void> {
  const db = await getDb();
  await db.collection("enrolments").updateOne(
    { _id: enrolmentId, "payment.status": { $in: ["pending", "failed"] } },
    {
      $set: {
        "payment.status": "pending",
        "payment.razorpayOrderId": razorpayOrderId,
        updatedAt: new Date(),
      },
    },
  );
}

export async function attachOrderId(
  enrolmentId: ObjectId,
  razorpayOrderId: string,
): Promise<void> {
  const db = await getDb();
  await db
    .collection("enrolments")
    .updateOne(
      { _id: enrolmentId },
      { $set: { "payment.razorpayOrderId": razorpayOrderId, updatedAt: new Date() } },
    );
}

export async function getEnrolmentByReference(
  reference: string,
): Promise<EnrolmentDoc | null> {
  if (!/^[0-9a-f]{24}$/.test(reference)) return null;
  const db = await getDb();
  return (await db
    .collection<EnrolmentDoc>("enrolments")
    .findOne({ reference })) as EnrolmentDoc | null;
}

/**
 * Every enrolment a guardian has made, newest first — the dashboard's whole query.
 *
 * ⚠️ CASE-INSENSITIVE ON PURPOSE. Account emails are lowercased at signup (`account.ts`),
 * but `guardian.email` on an enrolment is stored exactly as typed at checkout — matching a
 * plain lowercase equality here would silently hide a purchase made as "Jane@x.com".
 */
export async function getEnrolmentsByGuardianEmail(email: string): Promise<EnrolmentDoc[]> {
  const db = await getDb();
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (await db
    .collection<EnrolmentDoc>("enrolments")
    .find({ "guardian.email": { $regex: `^${escaped}$`, $options: "i" } })
    .sort({ createdAt: -1 })
    .toArray()) as EnrolmentDoc[];
}

export async function getEnrolmentByOrderId(
  razorpayOrderId: string,
): Promise<EnrolmentDoc | null> {
  const db = await getDb();
  return (await db
    .collection<EnrolmentDoc>("enrolments")
    .findOne({ "payment.razorpayOrderId": razorpayOrderId })) as EnrolmentDoc | null;
}

/**
 * Mark an enrolment paid and take its seat. Safe to call twice.
 *
 * ⚠️ IDEMPOTENT BY CONSTRUCTION, BECAUSE IT IS CALLED TWICE BY DESIGN — once by the
 * browser handler and once by the webhook, in whichever order they arrive. The guard is the
 * conditional filter on `payment.status`: only a row that is still `pending` is moved, so
 * the second caller updates nothing and, crucially, does not claim a second seat.
 *
 * Returns the confirmed row either way, so both callers can render the same answer.
 */
export async function confirmPayment(input: {
  enrolmentId: ObjectId;
  razorpayPaymentId: string;
  /** What Razorpay says was actually paid, in paise. */
  amountPaid: number;
}): Promise<{ enrolment: EnrolmentDoc | null; newlyConfirmed: boolean }> {
  const db = await getDb();
  const now = new Date();

  const result = await db.collection<EnrolmentDoc>("enrolments").findOneAndUpdate(
    { _id: input.enrolmentId, "payment.status": "pending" },
    {
      $set: {
        "payment.status": "paid",
        "payment.razorpayPaymentId": input.razorpayPaymentId,
        "payment.paidAt": now,
        status: "confirmed",
        updatedAt: now,
      },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    // Already confirmed by the other path — return the existing row, claim nothing.
    const existing = await db
      .collection<EnrolmentDoc>("enrolments")
      .findOne({ _id: input.enrolmentId });
    return { enrolment: existing as EnrolmentDoc | null, newlyConfirmed: false };
  }

  /**
   * ⚠️ THE SEAT IS CLAIMED AFTER THE MONEY IS CONFIRMED, NEVER BEFORE. Reserving on
   * checkout-open would need a release-on-timeout job to give back seats from abandoned
   * carts, and a job that fails quietly sells out a cohort that is half empty.
   *
   * An oversubscribed claim is not refused here — the student has already paid, so refusing
   * would take their money and give nothing. It is logged loudly for Rahul to resolve
   * manually, which is the correct trade at this scale.
   */
  // No batch means no seat to claim — the student is placed by hand over WhatsApp. This
  // is the normal path for a course whose batches have not been set up yet.
  if (!result.seatClaimed && result.cohortId) {
    const claimed = await claimSeat(result.cohortId);
    await db
      .collection("enrolments")
      .updateOne({ _id: result._id }, { $set: { seatClaimed: claimed } });
    if (!claimed) {
      console.error(
        `[enrolment] PAID BUT NO SEAT — enrolment ${result._id.toHexString()} ` +
          `(${result.guardian.email}) paid for cohort ${result.cohortId}, which is full or closed. ` +
          `Resolve manually: add a seat or refund.`,
      );
    }
  }

  /**
   * ⚠️ THE COUPON IS COUNTED HERE, NOT WHEN IT WAS TYPED. Counting on "apply" would let
   * abandoned checkouts eat a capped promotion — fifty people trying the code and not
   * paying would exhaust a fifty-use offer while nobody had enrolled. It sits inside the
   * `newlyConfirmed` branch, so the webhook arriving after the browser handler does not
   * count the same redemption twice.
   */
  if (result.payment.coupon?.code) {
    await redeemCoupon(result.payment.coupon.code);
  }

  return { enrolment: result as EnrolmentDoc, newlyConfirmed: true };
}

/** A free seat, or one a discount took to zero — no Razorpay round trip at all. */
export async function confirmFreeEnrolment(
  enrolmentId: ObjectId,
): Promise<EnrolmentDoc | null> {
  const db = await getDb();
  const now = new Date();
  const result = await db.collection<EnrolmentDoc>("enrolments").findOneAndUpdate(
    { _id: enrolmentId, status: "pending" },
    { $set: { status: "confirmed", updatedAt: now } },
    { returnDocument: "after" },
  );
  if (!result) return null;

  if (!result.seatClaimed && result.cohortId) {
    const claimed = await claimSeat(result.cohortId);
    await db
      .collection("enrolments")
      .updateOne({ _id: result._id }, { $set: { seatClaimed: claimed } });
  }
  return result as EnrolmentDoc;
}

export async function markPaymentFailed(razorpayOrderId: string): Promise<void> {
  const db = await getDb();
  await db.collection("enrolments").updateOne(
    { "payment.razorpayOrderId": razorpayOrderId, "payment.status": "pending" },
    { $set: { "payment.status": "failed", updatedAt: new Date() } },
  );
}

export async function ensureEnrolmentIndexes(db: Db): Promise<void> {
  await db.collection("enrolments").createIndex({ reference: 1 }, { unique: true });
}
