/**
 * A published, fully-priced course with real dates, so the enrolment and payment flow can
 * be exercised end to end before the real one has a price.
 *
 *   node scripts/seed-test-course.mjs          # create/refresh the test course
 *   node scripts/seed-test-course.mjs --drop   # remove it and its cohort entirely
 *
 * ⚠️ THIS IS A TEST FIXTURE AND IT SAYS SO IN ITS OWN TITLE. The slug is `test-…`, the
 * title carries "(TEST)", and the price is ₹10 — so if it ever reaches a real visitor the
 * mistake is obvious on screen rather than being a plausible-looking live product. Delete
 * it with `--drop` before launch.
 *
 * Unlike `seed-course.mjs`, this one DOES overwrite price and status on every run: it is a
 * fixture, so resetting it to a known state is the entire point.
 */

import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";

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

const SLUG = "test-ai-study-method";

/**
 * The next four Sundays at 11:00 IST.
 *
 * ⚠️ BUILT IN UTC, DISPLAYED IST. 11:00 IST is 05:30 UTC — India is UTC+5:30, the half hour
 * being exactly the offset people forget. Dates are stored as UTC instants and the display
 * helpers pin `Asia/Kolkata`, so this renders as 11:00 AM IST wherever the server runs.
 */
function nextFourSundays() {
  const out = [];
  const cursor = new Date();
  cursor.setUTCHours(5, 30, 0, 0);
  // 0 = Sunday. Step to the next one, then take four weekly.
  do {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  } while (cursor.getUTCDay() !== 0);

  for (let n = 1; n <= 4; n++) {
    out.push({
      n,
      startsAt: new Date(cursor),
      durationMinutes: 120,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return out;
}

const env = loadEnv();
if (!env.MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env.local");
  process.exit(1);
}

const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db(env.MONGODB_DB || "innovgeist");

if (process.argv.includes("--drop")) {
  const c = await db.collection("courses").deleteOne({ slug: SLUG });
  const h = await db.collection("cohorts").deleteMany({ courseSlug: SLUG });
  const e = await db.collection("enrolments").deleteMany({ courseSlug: SLUG });
  console.log(
    `dropped: ${c.deletedCount} course, ${h.deletedCount} cohort(s), ${e.deletedCount} enrolment(s)`,
  );
  await client.close();
  process.exit(0);
}

// Start from the real course's copy so the test exercises the real page, then override
// what makes it a fixture.
const real = await db.collection("courses").findOne({ slug: "ai-study-method" });
if (!real) {
  console.error("Run `node scripts/seed-course.mjs` first — the real course is missing.");
  await client.close();
  process.exit(1);
}

const { _id, createdAt, ...copy } = real;
void _id;
void createdAt;

const now = new Date();
const testCourse = {
  ...copy,
  slug: SLUG,
  title: "The AI Study Method (TEST)",
  status: "published",
  // ₹10 list, 20% off → ₹8 payable. Small enough that a real card is never a concern,
  // and non-round so the discount arithmetic is visible in the UI.
  pricing: {
    listAmount: 1000,
    discount: { type: "percentage", value: 20, label: "Launch cohort" },
  },
  // Artwork is inherited from the real course via `...copy`, so the fixture exercises the
  // same banner the live page will show.
  updatedAt: now,
};

await db
  .collection("courses")
  .updateOne({ slug: SLUG }, { $set: testCourse, $setOnInsert: { createdAt: now } }, { upsert: true });

const sessions = nextFourSundays();

await db.collection("cohorts").updateOne(
  { courseSlug: SLUG, name: "Test Batch" },
  {
    $set: {
      courseSlug: SLUG,
      name: "Test Batch",
      sessions,
      // The real joining link is sent over WhatsApp; this is here so the confirmation
      // page has something to render while testing.
      joiningLink: "https://meet.google.com/test-abcd-efg",
      seatsTotal: 30,
      enrolmentClosesAt: sessions[0].startsAt,
      status: "open",
      updatedAt: now,
    },
    // ⚠️ `seatsTaken` only on insert. Re-running the seed must not wipe seats claimed by
    // test enrolments — that is exactly the counter the concurrency guard protects.
    $setOnInsert: { seatsTaken: 0, createdAt: now },
  },
  { upsert: true },
);

const fmt = (d) =>
  new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(d);

console.log(`seeded /course/${SLUG} — published, ₹10 list, 20% off → ₹8 payable`);
console.log("sessions (IST):");
for (const s of sessions) console.log(`  week ${s.n}: ${fmt(s.startsAt)}`);
console.log("\nRemove it with: node scripts/seed-test-course.mjs --drop");

await client.close();
