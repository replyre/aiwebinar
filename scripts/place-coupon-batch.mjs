/**
 * Give a discount code its own batch, and move everyone who already used it into it.
 *
 *   node scripts/place-coupon-batch.mjs SVNIC50 --name "SVNIC Kalan — Batch 1" --dry
 *   node scripts/place-coupon-batch.mjs SVNIC50 --name "SVNIC Kalan — Batch 1"
 *
 * Flags:
 *   --name <text>   batch name; reused if a batch with this name already exists
 *   --seats <n>     seat cap. Omitted means uncapped, which is the default
 *   --listed        leave the batch in the public picker (default: unlisted)
 *   --dry           print what would change and write nothing
 *
 * ⚠️ RE-RUNNABLE, AND THAT IS NOT A CONVENIENCE. It finds the batch by name instead of
 * inserting blindly, sets `seatsTaken` to a *recount* rather than incrementing it, and only
 * claims seats for enrolments that do not already hold one. Run it twice and the second run
 * is a no-op; the alternative is a script that silently doubles a seat count every time
 * somebody is unsure whether it worked.
 *
 * ⚠️ IT WRITES A BACKUP FIRST. Every document it is about to touch is dumped to
 * `scripts/.backup-<code>-<timestamp>.json` before anything changes. These are real paid
 * enrolments; there is no undo without it.
 */

import { MongoClient } from "mongodb";
import { readFileSync, writeFileSync } from "node:fs";

function loadEnv() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  return Object.fromEntries(
    raw
      .split("\n")
      .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
      .map((line) => {
        const at = line.indexOf("=");
        return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
      }),
  );
}

const args = process.argv.slice(2);
const code = (args[0] ?? "").trim().toUpperCase();
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1] ?? "";
};
const has = (name) => args.includes(`--${name}`);

if (!code || code.startsWith("--")) {
  console.error(
    'usage: node scripts/place-coupon-batch.mjs <CODE> --name "Batch name" [--seats <n>] [--listed] [--dry]',
  );
  process.exit(1);
}

const batchName = flag("name") || `${code} batch`;
const seatsTotal = flag("seats") === null ? null : Math.max(0, Number(flag("seats")));
const unlisted = !has("listed");
const dry = has("dry");

const env = loadEnv();
const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db(env.MONGODB_DB);

const coupon = await db.collection("coupons").findOne({ code });
if (!coupon) {
  console.error(`No such code: ${code}`);
  await client.close();
  process.exit(1);
}

// The code is course-scoped, so its batch belongs to that course. A code valid on every
// course has no single course to hang a batch off, which is a decision for a human.
const courseSlug = coupon.courseSlugs?.[0];
if (!courseSlug) {
  console.error(
    `${code} is not restricted to one course, so there is no course to create a batch on.\n` +
      `Set its course in the admin panel first.`,
  );
  await client.close();
  process.exit(1);
}

const enrolments = await db
  .collection("enrolments")
  .find({ "payment.coupon.code": code })
  .toArray();

const paid = enrolments.filter((e) => e.status === "confirmed");

console.log(`code        ${code}  (${coupon.type}, ${coupon.usesCount} redeemed)`);
console.log(`course      ${courseSlug}`);
console.log(`batch       ${batchName}  ${seatsTotal === null ? "(uncapped)" : `(${seatsTotal} seats)`}${unlisted ? " unlisted" : " listed"}`);
console.log(`enrolments  ${enrolments.length} total, ${paid.length} paid`);

if (!dry) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = new URL(`./.backup-${code}-${stamp}.json`, import.meta.url);
  writeFileSync(path, JSON.stringify({ coupon, enrolments }, null, 2));
  console.log(`backup      ${path.pathname.split("/").pop()}`);
}

/* ------------------------------- the batch ------------------------------- */

let cohort = await db.collection("cohorts").findOne({ courseSlug, name: batchName });

if (cohort) {
  console.log(`\n· batch "${batchName}" already exists — reusing ${cohort._id.toHexString()}`);
} else if (dry) {
  console.log(`\n· would create batch "${batchName}"`);
} else {
  const now = new Date();
  const { insertedId } = await db.collection("cohorts").insertOne({
    courseSlug,
    name: batchName,
    sessions: [1, 2, 3, 4].map((n) => ({ n, startsAt: null, durationMinutes: 120 })),
    joiningLink: null,
    seatsTotal,
    seatsTaken: 0,
    enrolmentClosesAt: null,
    // Open, because a coupon can only place students into a batch that takes seats.
    status: "open",
    unlisted,
    createdAt: now,
    updatedAt: now,
  });
  cohort = await db.collection("cohorts").findOne({ _id: insertedId });
  console.log(`\n· created batch ${insertedId.toHexString()}`);
}

if (!dry && cohort) {
  await db.collection("cohorts").updateOne(
    { _id: cohort._id },
    { $set: { seatsTotal, unlisted, status: "open", updatedAt: new Date() } },
  );
}

const cohortId = cohort ? cohort._id.toHexString() : "(new)";

/* ------------------------------ the coupon ------------------------------- */

if (coupon.cohortId === cohortId) {
  console.log(`· ${code} already points at this batch`);
} else if (dry) {
  console.log(`· would point ${code} at ${cohortId}`);
} else {
  await db
    .collection("coupons")
    .updateOne({ code }, { $set: { cohortId, updatedAt: new Date() } });
  console.log(`· ${code} now places redeemers into ${cohortId}`);
}

/* ---------------------------- the enrolments ----------------------------- */

let moved = 0;
let seated = 0;

for (const e of enrolments) {
  const alreadyHere = e.cohortId === cohortId;
  /**
   * ⚠️ ONLY PAID ENROLMENTS TAKE A SEAT. The unpaid ones are still pointed at the batch —
   * so that if one of them ever completes payment they land with their classmates rather
   * than nowhere — but an abandoned checkout must not consume a seat or be counted as a
   * student. `placement` is left alone for them; it is set when the money arrives.
   */
  const isPaid = e.status === "confirmed";

  if (dry) {
    if (!alreadyHere) moved++;
    if (isPaid && !e.seatClaimed) seated++;
    continue;
  }

  const set = { cohortId, updatedAt: new Date() };
  if (isPaid) {
    set.seatClaimed = true;
    set.placement = "assigned";
  }

  await db.collection("enrolments").updateOne({ _id: e._id }, { $set: set });
  if (!alreadyHere) moved++;
  if (isPaid && !e.seatClaimed) seated++;
}

console.log(`· ${moved} enrolment(s) ${dry ? "would move" : "moved"} into the batch`);
console.log(`· ${paid.length} paid student(s) ${dry ? "would be" : ""} seated`);

/**
 * ⚠️ `seatsTaken` IS RECOUNTED, NOT INCREMENTED. This is what makes the script safe to run
 * twice: an `$inc` would add the same students again on every run and push a capped batch
 * past its own limit. The count of confirmed enrolments holding a seat *is* the number.
 */
if (!dry && cohort) {
  const taken = await db
    .collection("enrolments")
    .countDocuments({ cohortId, status: "confirmed", seatClaimed: true });
  await db.collection("cohorts").updateOne({ _id: cohort._id }, { $set: { seatsTaken: taken } });
  console.log(`· seatsTaken recounted to ${taken}`);
}

console.log(dry ? "\nDRY RUN — nothing was written." : "\nDone.");
await client.close();
