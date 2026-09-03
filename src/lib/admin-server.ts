import "server-only";

import { ObjectId } from "mongodb";
import type { Cohort, CohortStatus, Course, CourseStatus } from "@/lib/course";
import type { Coupon, CouponType } from "@/lib/coupon";
import { normaliseCode } from "@/lib/coupon";
import { getDb, mongoConfigured } from "@/lib/mongodb";

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
      confirmedCount: await db
        .collection("enrolments")
        .countDocuments({ cohortId: doc._id.toHexString(), status: "confirmed" }),
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
    createdAt: (doc.createdAt as Date)?.toISOString() ?? "",
  }));
}
