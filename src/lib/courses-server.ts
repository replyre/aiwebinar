import "server-only";

import { ObjectId, type Db } from "mongodb";
import type { Cohort, CohortStatus, Course } from "@/lib/course";
import { payableAmount } from "@/lib/course";
import { getDb, mongoConfigured } from "@/lib/mongodb";

/**
 * Reading courses and cohorts out of MongoDB.
 *
 * ⚠️ `server-only` AT THE TOP IS LOAD-BEARING. This module reaches the database with
 * credentials; importing it from a client component would be a build error here rather than
 * a connection string in a browser bundle. That is the whole point of the import.
 *
 * Every function tolerates an unconfigured database and returns null/empty rather than
 * throwing, so a missing `MONGODB_URI` degrades the course page to "not available" instead
 * of a 500.
 */

interface CourseDoc extends Omit<Course, "createdAt" | "updatedAt"> {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface CohortDoc {
  _id: ObjectId;
  courseSlug: string;
  name: string;
  sessions: { n: number; startsAt: Date; durationMinutes: number }[];
  joiningLink: string | null;
  seatsTotal: number | null;
  seatsTaken: number;
  enrolmentClosesAt: Date | null;
  status: CohortStatus;
}

let indexesEnsured = false;

/**
 * Idempotent index creation on first use. Not a migration step: a route that heals its own
 * indexes cannot drift from a schema file somebody forgot to run.
 */
export async function ensureCourseIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  await Promise.all([
    db.collection("courses").createIndex({ slug: 1 }, { unique: true }),
    db.collection("courses").createIndex({ status: 1 }),
    db.collection("cohorts").createIndex({ courseSlug: 1, status: 1 }),
    db.collection("cohorts").createIndex({ "sessions.0.startsAt": 1 }),
    db.collection("enrolments").createIndex({ createdAt: -1 }),
    db.collection("enrolments").createIndex({ cohortId: 1 }),
    db.collection("enrolments").createIndex({ "guardian.email": 1 }),
    // Looking an enrolment up by its Razorpay order is the webhook's hot path.
    db
      .collection("enrolments")
      .createIndex({ "payment.razorpayOrderId": 1 }, { sparse: true }),
    db.collection("leads").createIndex({ createdAt: -1 }),
    db.collection("leads").createIndex({ phone: 1 }),
  ]);
  indexesEnsured = true;
}

function toCohort(doc: CohortDoc): Cohort {
  return {
    id: doc._id.toHexString(),
    courseSlug: doc.courseSlug,
    name: doc.name,
    sessions: doc.sessions.map((s) => ({
      n: s.n,
      startsAt: s.startsAt,
      durationMinutes: s.durationMinutes,
    })),
    joiningLink: doc.joiningLink ?? null,
    seatsTotal: doc.seatsTotal ?? null,
    seatsTaken: doc.seatsTaken,
    enrolmentClosesAt: doc.enrolmentClosesAt ?? null,
    status: doc.status,
  };
}

export async function getPublishedCourse(slug: string): Promise<Course | null> {
  if (!mongoConfigured) return null;
  try {
    const db = await getDb();
    await ensureCourseIndexes(db);
    const doc = await db
      .collection<CourseDoc>("courses")
      .findOne({ slug, status: "published" });
    if (!doc) return null;
    const { _id, ...course } = doc;
    void _id;
    return course as Course;
  } catch (error) {
    console.error("[courses] lookup failed", error);
    return null;
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (!mongoConfigured) return null;
  try {
    const db = await getDb();
    const doc = await db.collection<CourseDoc>("courses").findOne({ slug });
    if (!doc) return null;
    const { _id, ...course } = doc;
    void _id;
    return course as Course;
  } catch (error) {
    console.error("[courses] admin lookup failed", error);
    return null;
  }
}

export async function setCourseStatus(slug: string, status: Course["status"]): Promise<boolean> {
  if (!mongoConfigured) return false;
  try {
    const db = await getDb();
    const result = await db.collection<CourseDoc>("courses").updateOne({ slug }, { $set: { status, updatedAt: new Date() } });
    return result.matchedCount === 1;
  } catch (error) {
    console.error("[courses] admin status update failed", error);
    return false;
  }
}

/**
 * Cohorts a visitor could still join, soonest first.
 *
 * ⚠️ `open` ONLY, and the seat/closing-date checks happen in `isRegistrable` at render
 * time. Listing `draft` cohorts here would advertise dates that are not confirmed.
 */
export async function getOpenCohorts(courseSlug: string): Promise<Cohort[]> {
  if (!mongoConfigured) return [];
  try {
    const db = await getDb();
    const docs = await db
      .collection<CohortDoc>("cohorts")
      .find({ courseSlug, status: "open" })
      .sort({ "sessions.0.startsAt": 1 })
      .limit(12)
      .toArray();
    return docs.map(toCohort);
  } catch (error) {
    console.error("[cohorts] lookup failed", error);
    return [];
  }
}

export async function getCohortById(id: string): Promise<Cohort | null> {
  if (!mongoConfigured || !ObjectId.isValid(id)) return null;
  try {
    const db = await getDb();
    const doc = await db
      .collection<CohortDoc>("cohorts")
      .findOne({ _id: new ObjectId(id) });
    return doc ? toCohort(doc) : null;
  } catch (error) {
    console.error("[cohorts] lookup by id failed", error);
    return null;
  }
}

/**
 * Claim one seat, atomically.
 *
 * ⚠️ THE `$expr` IS THE WHOLE POINT — read-then-write cannot do this. Two parents paying at
 * the same instant both read `seatsTaken: 29` of 30, both decide there is room, and both
 * write 30: one seat sold twice. Here the comparison and the increment are a single
 * document update, so the database serialises them and the loser gets `null`.
 *
 * Called only after a payment is *verified* — the seat is claimed on confirmed money, not
 * on someone opening Checkout, which is what removes the need for a release-on-timeout job.
 */
export async function claimSeat(cohortId: string): Promise<boolean> {
  if (!ObjectId.isValid(cohortId)) return false;
  const db = await getDb();
  const result = await db.collection("cohorts").findOneAndUpdate(
    {
      _id: new ObjectId(cohortId),
      status: "open",
      // An uncapped batch (`seatsTotal: null`) always has room; a capped one is compared
      // inside the same update so the check and the increment cannot be interleaved.
      $or: [{ seatsTotal: null }, { $expr: { $lt: ["$seatsTaken", "$seatsTotal"] } }],
    },
    { $inc: { seatsTaken: 1 } },
    { returnDocument: "after" },
  );

  if (!result) return false;

  // Flip to `full` once the last seat goes, so the listing stops offering it. Uncapped
  // batches never reach this.
  if (result.seatsTotal !== null && result.seatsTaken >= result.seatsTotal) {
    await db
      .collection("cohorts")
      .updateOne({ _id: result._id }, { $set: { status: "full" } });
  }
  return true;
}

/** Give a seat back — a refund, or an admin cancelling an enrolment. */
export async function releaseSeat(cohortId: string): Promise<void> {
  if (!ObjectId.isValid(cohortId)) return;
  const db = await getDb();
  await db.collection("cohorts").updateOne(
    { _id: new ObjectId(cohortId), seatsTaken: { $gt: 0 } },
    // Re-opening a `full` cohort is safe; a `closed` or `completed` one must stay shut,
    // which is why the status is only touched when it is exactly `full`.
    { $inc: { seatsTaken: -1 } },
  );
  await db
    .collection("cohorts")
    .updateOne({ _id: new ObjectId(cohortId), status: "full" }, { $set: { status: "open" } });
}

/**
 * Every published course, for the catalogue and the nav dropdown.
 *
 * ⚠️ RETURNS A SUMMARY, NOT WHOLE COURSE DOCUMENTS. The nav renders this on every page load;
 * shipping four full curricula — five outcomes, six deliverables, four weeks each — to draw
 * a dropdown with three lines in it is a lot of bytes for nothing.
 */
export interface CourseSummary {
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  audience: string;
  promise: string;
  /** The full price. Kept for reference; the public UI shows `payableAmount` only. */
  listAmount: number;
  /** What a visitor without a discount code pays — and the only price any public page shows. */
  payableAmount: number;
  thumbnail: Course["images"]["thumbnail"];
  /** Soonest open batch, if any — this is what makes the card say "starts 6 Sept". */
  nextStartsAt: Date | null;
  hasOpenBatch: boolean;
}

export async function listPublishedCourses(): Promise<CourseSummary[]> {
  if (!mongoConfigured) return [];
  try {
    const db = await getDb();
    const docs = await db
      .collection<CourseDoc>("courses")
      .find({ status: "published" })
      .sort({ createdAt: 1 })
      .limit(24)
      .toArray();

    return Promise.all(
      docs.map(async (doc) => {
        const cohorts = await db
          .collection<CohortDoc>("cohorts")
          .find({ courseSlug: doc.slug, status: "open" })
          .sort({ "sessions.0.startsAt": 1 })
          .toArray();

        // Uncapped batches (null) always have room.
        const registrable = cohorts.filter(
          (c) => c.seatsTotal === null || c.seatsTotal === undefined || (c.seatsTaken ?? 0) < c.seatsTotal,
        );
        const next = registrable.find((c) => c.sessions?.[0]?.startsAt) ?? null;

        return {
          slug: doc.slug,
          title: doc.title,
          subtitle: doc.subtitle,
          tagline: doc.tagline,
          audience: doc.audience,
          promise: doc.promise,
          listAmount: doc.pricing?.listAmount ?? 0,
          payableAmount: payableAmount(doc.pricing),
          thumbnail: doc.images?.thumbnail ?? null,
          nextStartsAt: next?.sessions?.[0]?.startsAt ?? null,
          /** A published course always sells; this only drives card wording. */
          hasOpenBatch: registrable.length > 0,
        };
      }),
    );
  } catch (error) {
    console.error("[courses] catalogue lookup failed", error);
    return [];
  }
}
