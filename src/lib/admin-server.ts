import "server-only";

import { ObjectId, type Db } from "mongodb";
import type { Cohort, CohortStatus, Course, CourseStatus } from "@/lib/course";
import type { Coupon, CouponType } from "@/lib/coupon";
import { normaliseCode } from "@/lib/coupon";
import { getDb, mongoConfigured } from "@/lib/mongodb";
import { placementOf, type Placement } from "@/lib/enrolments-server";

/**
 * Everything the admin panel reads and writes.
 *
 * ⚠️ NOTHING HERE IS SLUG-SPECIFIC. The panel this replaced could publish exactly one
 * hard-coded course, which meant the second course would have needed a code change to go
 * live — the precise thing the data model was built to avoid (PRD §8). Every function takes
 * the identifier as an argument.
 *
 * ⚠️ CALLERS MUST CHECK AUTHORISATION FIRST. These functions do no access control of their
 * own; they are the layer beneath it. Every route that reaches them checks the admin cookie
 * before the first call.
 */

export interface AdminCourseRow {
  slug: string;
  title: string;
  status: CourseStatus;
  listAmount: number;
  discountType: string;
  discountValue: number;
  discountLabel: string;
  cohortCount: number;
  enrolmentCount: number;
}

export async function listCourses(): Promise<AdminCourseRow[]> {
  if (!mongoConfigured) return [];
  const db = await getDb();
  const courses = await db.collection<Course>("courses").find({}).sort({ title: 1 }).toArray();

  return Promise.all(
    courses.map(async (course) => ({
      slug: course.slug,
      title: course.title,
      status: course.status,
      listAmount: course.pricing?.listAmount ?? 0,
      discountType: course.pricing?.discount?.type ?? "none",
      discountValue: course.pricing?.discount?.value ?? 0,
      discountLabel: course.pricing?.discount?.label ?? "",
      cohortCount: await db.collection("cohorts").countDocuments({ courseSlug: course.slug }),
      // Only paid seats count — pending rows are abandoned checkouts, not students.
      enrolmentCount: await db
        .collection("enrolments")
        .countDocuments({ courseSlug: course.slug, status: "confirmed" }),
    })),
  );
}

export async function updateCoursePricing(
  slug: string,
  pricing: {
    listAmount: number;
    discount: { type: string; value: number; label: string };
  },
): Promise<boolean> {
  if (!mongoConfigured) return false;
  const db = await getDb();
  const result = await db.collection("courses").updateOne(
    { slug },
    {
      $set: {
        // Rounded and floored here rather than trusted: this arrives from a form, and a
        // negative or fractional paise value would reach Razorpay unchanged.
        "pricing.listAmount": Math.max(0, Math.round(pricing.listAmount)),
        "pricing.discount.type": pricing.discount.type,
        "pricing.discount.value": Math.max(0, pricing.discount.value),
        "pricing.discount.label": pricing.discount.label.slice(0, 60),
        updatedAt: new Date(),
      },
    },
  );
  return result.matchedCount === 1;
}

export async function updateCourseStatus(
  slug: string,
  status: CourseStatus,
): Promise<boolean> {
  if (!mongoConfigured) return false;
  const db = await getDb();
  const result = await db
    .collection("courses")
    .updateOne({ slug }, { $set: { status, updatedAt: new Date() } });
  return result.matchedCount === 1;
}

/* --------------------------------- cohorts --------------------------------- */

export interface AdminCohortRow extends Cohort {
  confirmedCount: number;
  /**
   * Paid students who were meant for this batch but found it full.
   *
   * ⚠️ NOT COUNTED IN `seatsTaken`, DELIBERATELY. They hold no seat — that is what makes
   * them overflow. Folding them into the seat count would make a full batch read as
   * oversold and let the number drift past its own cap.
   */
  overflowCount: number;
}

export async function listCohorts(courseSlug?: string): Promise<AdminCohortRow[]> {
  if (!mongoConfigured) return [];
  const db = await getDb();
  const filter = courseSlug ? { courseSlug } : {};
  const docs = await db.collection("cohorts").find(filter).sort({ createdAt: -1 }).toArray();

  return Promise.all(
    docs.map(async (doc) => ({
      id: doc._id.toHexString(),
      courseSlug: doc.courseSlug,
      name: doc.name,
      sessions: (doc.sessions ?? []).map((s: { n: number; startsAt: Date | null; durationMinutes: number }) => ({
        n: s.n,
        startsAt: s.startsAt,
        durationMinutes: s.durationMinutes,
      })),
      joiningLink: doc.joiningLink ?? null,
      seatsTotal: doc.seatsTotal ?? null,
      seatsTaken: doc.seatsTaken ?? 0,
      enrolmentClosesAt: doc.enrolmentClosesAt ?? null,
      status: doc.status,
      unlisted: doc.unlisted ?? false,
      confirmedCount: await db
        .collection("enrolments")
        .countDocuments({ cohortId: doc._id.toHexString(), status: "confirmed" }),
      /** Paid students intended for this batch who could not get a seat. */
      overflowCount: await db
        .collection("enrolments")
        .countDocuments({ cohortId: doc._id.toHexString(), status: "confirmed", placement: "overflow" }),
    })),
  ) as Promise<AdminCohortRow[]>;
}

export async function updateCohort(
  id: string,
  patch: {
    name?: string;
    /** ISO strings, or empty for "not set yet". Index 0 is week 1. */
    sessionDates?: (string | null)[];
    joiningLink?: string | null;
    /** `null` = uncapped. */
    seatsTotal?: number | null;
    status?: CohortStatus;
    unlisted?: boolean;
  },
): Promise<boolean> {
  if (!mongoConfigured || !ObjectId.isValid(id)) return false;
  const db = await getDb();

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) set.name = patch.name.slice(0, 80);
  if (patch.joiningLink !== undefined) set.joiningLink = patch.joiningLink || null;
  if (patch.seatsTotal !== undefined) {
    set.seatsTotal = patch.seatsTotal === null ? null : Math.max(0, Math.round(patch.seatsTotal));
  }
  if (patch.status !== undefined) set.status = patch.status;
  if (patch.unlisted !== undefined) set.unlisted = patch.unlisted;

  if (patch.sessionDates) {
    /**
     * ⚠️ THE FORM SENDS LOCAL TIME AND THE DATABASE STORES UTC. A `datetime-local` input
     * has no timezone, so the string arrives already carrying the offset the admin typed in
     * — appending `Z` here would silently shift every class by five and a half hours.
     * The route converts before this point; anything invalid becomes `null`, which the
     * public pages already render as "dates coming on WhatsApp".
     */
    set.sessions = patch.sessionDates.map((iso, index) => ({
      n: index + 1,
      startsAt: iso ? new Date(iso) : null,
      durationMinutes: 120,
    }));

    // Enrolment closes when the first session starts, unless it has no date yet.
    const first = patch.sessionDates[0];
    set.enrolmentClosesAt = first ? new Date(first) : null;
  }

  const result = await db.collection("cohorts").updateOne({ _id: new ObjectId(id) }, { $set: set });
  return result.matchedCount === 1;
}

export async function createCohort(courseSlug: string, name: string): Promise<string | null> {
  if (!mongoConfigured) return null;
  const db = await getDb();
  const now = new Date();
  const result = await db.collection("cohorts").insertOne({
    courseSlug,
    name: name.slice(0, 80) || "New batch",
    sessions: [1, 2, 3, 4].map((n) => ({ n, startsAt: null, durationMinutes: 120 })),
    joiningLink: null,
    seatsTotal: null,
    seatsTaken: 0,
    enrolmentClosesAt: null,
    // Starts as a draft so an unfinished batch can never be sold into.
    status: "draft",
    unlisted: false,
    createdAt: now,
    updatedAt: now,
  });
  return result.insertedId.toHexString();
}

/* --------------------------------- coupons --------------------------------- */

export async function listCoupons(): Promise<Coupon[]> {
  if (!mongoConfigured) return [];
  const db = await getDb();
  const docs = await db.collection("coupons").find({}).sort({ code: 1 }).toArray();
  return docs.map((doc) => ({
    code: doc.code,
    type: doc.type,
    value: doc.value,
    label: doc.label ?? "",
    active: doc.active ?? false,
    startsAt: doc.startsAt ?? null,
    endsAt: doc.endsAt ?? null,
    maxUses: doc.maxUses ?? null,
    usesCount: doc.usesCount ?? 0,
    courseSlugs: doc.courseSlugs ?? null,
    cohortId: doc.cohortId ?? null,
  }));
}

export async function upsertCoupon(input: {
  code: string;
  type: CouponType;
  value: number;
  label: string;
  active: boolean;
  maxUses: number | null;
  courseSlugs: string[] | null;
  /** Batch every redeemer is placed into. `null` = place by hand, as before. */
  cohortId?: string | null;
}): Promise<boolean> {
  if (!mongoConfigured) return false;
  const code = normaliseCode(input.code);
  if (!code) return false;

  const db = await getDb();
  const now = new Date();
  await db.collection("coupons").updateOne(
    { code },
    {
      $set: {
        code,
        type: input.type,
        value: Math.max(0, Math.round(input.value)),
        label: input.label.slice(0, 60),
        active: input.active,
        maxUses: input.maxUses,
        courseSlugs: input.courseSlugs,
        ...(input.cohortId !== undefined ? { cohortId: input.cohortId || null } : {}),
        updatedAt: now,
      },
      // ⚠️ Never on `$set` — editing a label must not hand back redemptions already spent.
      $setOnInsert: { usesCount: 0, startsAt: null, endsAt: null, createdAt: now },
    },
    { upsert: true },
  );
  return true;
}

export async function deleteCoupon(code: string): Promise<boolean> {
  if (!mongoConfigured) return false;
  const db = await getDb();
  const result = await db.collection("coupons").deleteOne({ code: normaliseCode(code) });
  return result.deletedCount === 1;
}

/* ------------------------------- enrolments -------------------------------- */

export interface AdminEnrolmentRow {
  id: string;
  reference: string;
  courseSlug: string;
  cohortId: string;
  studentName: string;
  studentClass: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  amount: number;
  couponCode: string | null;
  paymentStatus: string;
  status: string;
  /** Where the student ended up: unassigned, assigned, or waiting in overflow. */
  placement: Placement;
  /** Name of `cohortId`, resolved once here so the panel does not join it per row. */
  cohortName: string | null;
  createdAt: string;
}

export async function listEnrolments(limit = 100): Promise<AdminEnrolmentRow[]> {
  if (!mongoConfigured) return [];
  const db = await getDb();
  const docs = await db
    .collection("enrolments")
    .find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(500, limit))
    .toArray();

  /**
   * Batch names resolved in one query rather than one per row. There are a handful of
   * batches and up to 500 enrolments, so the alternative is 500 lookups to print at most a
   * dozen distinct strings.
   */
  const cohortNames = new Map<string, string>(
    (await db.collection("cohorts").find({}).project({ name: 1 }).toArray()).map((c) => [
      c._id.toHexString(),
      c.name as string,
    ]),
  );

  return docs.map((doc) => ({
    id: doc._id.toHexString(),
    reference: doc.reference,
    courseSlug: doc.courseSlug,
    cohortId: doc.cohortId,
    studentName: doc.student?.fullName ?? "",
    studentClass: doc.student?.class ?? "",
    guardianName: doc.guardian?.fullName ?? "",
    guardianPhone: doc.guardian?.phone ?? "",
    guardianEmail: doc.guardian?.email ?? "",
    amount: doc.payment?.amount ?? 0,
    couponCode: doc.payment?.coupon?.code ?? null,
    paymentStatus: doc.payment?.status ?? "unknown",
    status: doc.status,
    placement: placementOf({ placement: doc.placement, cohortId: doc.cohortId ?? null, seatClaimed: !!doc.seatClaimed }),
    cohortName: doc.cohortId ? (cohortNames.get(doc.cohortId) ?? null) : null,
    createdAt: (doc.createdAt as Date)?.toISOString() ?? "",
  }));
}

/* ------------------------- placing and confirming ------------------------- */

/**
 * Recount `seatsTaken` on a batch from the rows that actually hold a seat.
 *
 * ⚠️ A RECOUNT, NEVER AN INCREMENT. Every admin action that touches placement calls this,
 * and admin actions get repeated — a mis-click, a double submit, a second look after a
 * page refresh. `$inc` makes each of those permanently wrong and a capped batch drifts past
 * its own limit with no way to tell by looking. The number of confirmed, seated rows *is*
 * the seat count, so deriving it is both correct and idempotent.
 *
 * The live enrolment path still uses `claimSeat`'s conditional `$inc`, which is the right
 * tool there: it has to be atomic against a simultaneous payment. This runs behind a single
 * admin's click, where a recount is simpler and cannot drift.
 */
async function recountSeats(db: Db, cohortId: string | null): Promise<void> {
  if (!cohortId || !ObjectId.isValid(cohortId)) return;
  const seatsTaken = await db
    .collection("enrolments")
    .countDocuments({ cohortId, status: "confirmed", seatClaimed: true });
  await db
    .collection("cohorts")
    .updateOne({ _id: new ObjectId(cohortId) }, { $set: { seatsTaken, updatedAt: new Date() } });
}

/**
 * Move one enrolment into a batch, or out of every batch when `cohortId` is null.
 *
 * ⚠️ A CAPPED BATCH IS RESPECTED, BUT NEVER BY REFUSING. If the target is full the student
 * still moves — they land as `overflow` rather than taking a seat that does not exist. An
 * admin dragging a paid student somewhere is making a decision with context this function
 * does not have; its job is to record that decision accurately, not to veto it. The seat
 * count stays honest because overflow rows are not counted.
 *
 * Seats are recounted on both the batch left and the batch joined, so moving the last
 * student out of a full batch reopens it.
 */
export async function assignEnrolmentBatch(
  enrolmentId: string,
  cohortId: string | null,
): Promise<boolean> {
  if (!mongoConfigured || !ObjectId.isValid(enrolmentId)) return false;
  const db = await getDb();

  const enrolment = await db.collection("enrolments").findOne({ _id: new ObjectId(enrolmentId) });
  if (!enrolment) return false;

  const previous: string | null = enrolment.cohortId ?? null;
  const target =
    cohortId && ObjectId.isValid(cohortId)
      ? await db.collection("cohorts").findOne({ _id: new ObjectId(cohortId) })
      : null;

  if (cohortId && !target) return false;

  const confirmed = enrolment.status === "confirmed";
  let seatClaimed = false;
  let placement: Placement = "unassigned";

  if (target && confirmed) {
    // Seats already held by *other* students — this one's own seat must not count against it.
    const seated = await db.collection("enrolments").countDocuments({
      cohortId,
      status: "confirmed",
      seatClaimed: true,
      _id: { $ne: enrolment._id },
    });
    const room = target.seatsTotal === null || target.seatsTotal === undefined || seated < target.seatsTotal;
    seatClaimed = room;
    placement = room ? "assigned" : "overflow";
  }

  const update: Record<string, unknown> = {
    cohortId: target ? cohortId : null,
    seatClaimed,
    updatedAt: new Date(),
  };

  /**
   * `placement` describes a *seat*, so it is only meaningful once the money has arrived.
   * An unpaid row pointed at a batch is an intention, not a placement — the field is
   * cleared so it is set for real when the payment lands.
   */
  const write = confirmed
    ? { $set: { ...update, placement } }
    : { $set: update, $unset: { placement: "" } };

  await db.collection("enrolments").updateOne({ _id: enrolment._id }, write);

  await recountSeats(db, previous);
  if (cohortId !== previous) await recountSeats(db, cohortId);

  return true;
}

/**
 * Confirm an enrolment whose money arrived outside Razorpay — cash, UPI, a bank transfer.
 *
 * ⚠️ NO RAZORPAY ID IS ASKED FOR, AND THAT IS THE POINT. There isn't one: Razorpay never saw
 * this money. Requiring the field would mean an admin inventing a value to get past it, and
 * a fabricated payment id is strictly worse than none — it makes the row indistinguishable
 * from a real gateway payment the next time anybody reconciles takings against Razorpay's
 * own report. `method: "manual"` says plainly why this is marked paid with no gateway id.
 *
 * ⚠️ THE NOTE IS REQUIRED. This function marks money as received without any external system
 * agreeing, which is the one action here that cannot be verified from the record alone. A
 * sentence saying what arrived and when is the whole audit trail, so it is not optional.
 */
export async function confirmManualPayment(
  enrolmentId: string,
  note: string,
  externalRef?: string,
): Promise<boolean> {
  if (!mongoConfigured || !ObjectId.isValid(enrolmentId)) return false;

  const trimmed = note.trim();
  if (!trimmed) return false;

  const db = await getDb();
  const enrolment = await db.collection("enrolments").findOne({ _id: new ObjectId(enrolmentId) });
  if (!enrolment) return false;
  if (enrolment.status === "confirmed") return true; // already done; not an error

  const now = new Date();
  await db.collection("enrolments").updateOne(
    { _id: enrolment._id },
    {
      $set: {
        status: "confirmed",
        "payment.status": "paid",
        "payment.paidAt": enrolment.payment?.paidAt ?? now,
        "payment.method": "manual",
        "payment.note": trimmed.slice(0, 300),
        ...(externalRef?.trim() ? { "payment.externalRef": externalRef.trim().slice(0, 120) } : {}),
        updatedAt: now,
      },
    },
  );

  /**
   * Now that the row is confirmed it may be owed a seat in the batch it was already
   * pointed at. Re-running the placement settles that and recounts the batch, rather than
   * leaving a paid student attached to a batch with no seat and no overflow flag.
   */
  if (enrolment.cohortId) {
    await assignEnrolmentBatch(enrolmentId, enrolment.cohortId);
  }

  return true;
}
