/**
 * Seed "The AI Study Method" and its first cohort.
 *
 *   node scripts/seed-course.mjs            # create or update the course
 *   node scripts/seed-course.mjs --cohort   # also create a placeholder first cohort
 *
 * ⚠️ THE COPY HERE IS TRANSCRIBED FROM `aicourse/AI_Study_Method_What_You_Get.pdf` AND
 * NOTHING IS INVENTED. Where the brief is silent — price, dates, class size — the seed
 * writes a deliberately unsellable placeholder (`status: "draft"`, `priceAmount: 0`,
 * `seatsTotal: 0`) rather than a plausible-looking guess. A guessed price that reaches a
 * live page is a commercial mistake; a draft that refuses to publish is a visible one.
 *
 * Re-running is safe: the course is upserted by slug, and `--cohort` refuses to add a
 * second placeholder if one already exists.
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

const COURSE = {
  slug: "ai-study-method",
  title: "The AI Study Method",
  subtitle: "Think Better. Learn Faster.",
  tagline: "A 4-week live course · Class 9–12",
  promise:
    "In 4 weeks, you'll build your own AI study system — and prove it works on your own " +
    "weakest subject. You'll revise faster, understand more, and score higher, so you move " +
    "ahead of your class instead of falling behind.",
  audience: "Class 9–12",
  mode: "live_cohort",

  // ⚠️ Draft until Rahul sets a price and a cohort date. `getPublishedCourse` filters on
  // `status: "published"`, so the public page 404s until then — by design.
  status: "draft",

  pricing: { listAmount: 0, discount: { type: "none", value: 0 } },
  currency: "INR",

  // Renditions generated from `source-assets/ai-study-method-banner-source.png`
  // (1672×941, 1.6 MB) down to 35 KB at 800w. See scripts/build-course-images.mjs.
  images: {
    thumbnail: {
      src: "/assets/img/course/ai-study-method-banner.jpg",
      srcSet:
        "/assets/img/course/ai-study-method-banner.jpg 800w, /assets/img/course/ai-study-method-banner@2x.jpg 1600w",
      webpSrcSet:
        "/assets/img/course/ai-study-method-banner.webp 800w, /assets/img/course/ai-study-method-banner@2x.webp 1600w",
      width: 800,
      height: 450,
      alt: "The AI Study Method — Think Better. Learn Faster. With Atul Verma, AI Educator & Study Strategist.",
    },
    hero: {
      src: "/assets/img/course/ai-study-method-banner@2x.jpg",
      srcSet:
        "/assets/img/course/ai-study-method-banner.jpg 800w, /assets/img/course/ai-study-method-banner@2x.jpg 1600w",
      webpSrcSet:
        "/assets/img/course/ai-study-method-banner.webp 800w, /assets/img/course/ai-study-method-banner@2x.webp 1600w",
      width: 1600,
      height: 900,
      alt: "The AI Study Method — Think Better. Learn Faster. With Atul Verma, AI Educator & Study Strategist.",
    },
    og: "/assets/img/course/ai-study-method-banner-og.jpg",
  },

  facilitator: {
    name: "Atul Kumar Verma",
    title: "Director, Innovgeist Technologies Pvt. Ltd. & AI Consultant",
  },

  commitment: {
    sessions: 4,
    sessionMinutes: 120,
    practicePerWeek: "about 30–45 minutes",
    cadence: "4 Sundays",
  },

  outcomes: [
    {
      title: "Turn AI into your personal tutor",
      detail:
        "Get any topic explained step by step, in language you understand — anytime, at home.",
    },
    {
      title: "Revise any chapter faster with a quiz coach",
      detail:
        "Make AI test you before an exam, so revision becomes active, not just re-reading.",
    },
    {
      title: "Study from your own notes with AI",
      detail:
        "Upload your chapter and instantly get summaries, quizzes and audio built from YOUR syllabus.",
    },
    {
      title: "Catch AI's mistakes and use it honestly",
      detail:
        "Spot when AI is wrong, verify answers, and stay on the right side of the line — the edge without the risk.",
    },
    {
      title: "Use AI for projects, presentations and your future",
      detail:
        "Go beyond exams — build projects, explore careers, and keep a skill most classmates don't have yet.",
    },
  ],

  deliverables: [
    {
      title: "Your personal AI Study System",
      detail: "A simple daily method you'll actually use — not theory, a working routine.",
    },
    {
      title: "Your own Prompt Playbook",
      detail:
        "A personal collection of tested prompts you build across all 4 weeks and keep forever.",
    },
    {
      title: "4 weekly Practice Packs",
      detail:
        "Ready-to-use prompts, tool links and a real challenge to complete after every class.",
    },
    {
      title: "Your before & after proof",
      detail:
        "A real, measured improvement on your chosen subject — a number you and your parents can see.",
    },
    {
      title: "Your free AI Toolkit",
      detail:
        "Set up and confident with Gemini, ChatGPT and NotebookLM — plus a curated bonus tools list.",
    },
    {
      title: "Certificate + recognition",
      detail:
        "A completion certificate, and a shot at Most Improved, Best Study System or Most Consistent.",
    },
  ],

  curriculum: [
    {
      week: 1,
      title: "Talk to AI properly + pick your battle",
      detail:
        "Learn to ask AI the right way. Choose the one subject you want to get ahead in, and set your starting score.",
      produces: "Your accounts, your first prompts, your baseline score",
    },
    {
      week: 2,
      title: "Build your study system",
      detail:
        "Turn AI into your tutor and quiz coach, and study from your own notes with NotebookLM.",
      produces: "One chapter fully revised the new way",
    },
    {
      week: 3,
      title: "Don't get fooled",
      detail:
        "Catch AI's mistakes, verify answers, and master the line between learning and cheating.",
      produces: "3 caught AI errors + your verification habit",
    },
    {
      week: 4,
      title: "Prove it + go beyond",
      detail:
        "Re-take your test to measure your jump, explore AI for projects and careers, and showcase your system.",
      produces: "Your before/after result, playbook & certificate",
    },
  ],

  expectations: [
    "Attend all 4 Sundays — two hours of live, hands-on class each.",
    "Complete the weekly practice — about 30–45 minutes across the week.",
    "Apply everything to ONE real subject you choose in Week 1.",
    "Bring your device and your real syllabus — this is practical, not theory.",
    "Show up for Showcase Day — prove your progress and earn your certificate.",
  ],

  awards: ["Most Improved", "Best Study System", "Most Consistent"],
  tools: ["Gemini", "ChatGPT", "NotebookLM"],

  proof: {
    questionCount: 10,
    exampleBefore: "5/10",
    exampleAfter: "9/10",
    exampleConfidenceBefore: "2/5",
    exampleConfidenceAfter: "4/5",
  },

  brochurePath: "/assets/docs/ai-study-method-brochure.pdf",
};

const env = loadEnv();
if (!env.MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env.local");
  process.exit(1);
}

const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db(env.MONGODB_DB || "innovgeist");

const now = new Date();

/**
 * ⚠️ THE COMMERCIAL FIELDS ARE SPLIT OFF, NOT OVERWRITTEN.
 *
 * Re-running this seed after Rahul has published the course and set a price must not
 * quietly revert it to a free draft. Copy is safe to overwrite on every run; `status`,
 * `priceAmount` and `compareAtAmount` are written once, on insert, and never again.
 *
 * They are removed by destructuring rather than being set to `undefined` in `$set` — the
 * MongoDB driver serialises `undefined` to **null** by default, so that spelling would
 * write `status: null` and make the course neither draft nor published.
 */
const { status, pricing, ...copy } = COURSE;

const result = await db.collection("courses").updateOne(
  { slug: COURSE.slug },
  {
    $set: { ...copy, updatedAt: now },
    $setOnInsert: { status, pricing, createdAt: now },
  },
  { upsert: true },
);

console.log(
  result.upsertedCount
    ? `created course "${COURSE.slug}" (draft, price unset)`
    : `updated course "${COURSE.slug}" copy — status and price left as they are`,
);

if (process.argv.includes("--cohort")) {
  const existing = await db
    .collection("cohorts")
    .countDocuments({ courseSlug: COURSE.slug });

  if (existing) {
    console.log(`skipped cohort — ${existing} already exist for this course`);
  } else {
    // A placeholder with no real dates and no seats. It cannot be enrolled into
    // (`status: "draft"`, `seatsTotal: 0`); it exists so the admin has a row to edit.
    await db.collection("cohorts").insertOne({
      courseSlug: COURSE.slug,
      name: "Batch 1",
      sessions: [1, 2, 3, 4].map((n) => ({ n, startsAt: null, durationMinutes: 120 })),
      joiningLink: null,
      seatsTotal: 0,
      seatsTaken: 0,
      enrolmentClosesAt: null,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    console.log('created placeholder cohort "Batch 1" (draft, no dates, no seats)');
  }
}

console.log("\nBefore this course can go live, set in the `courses` document:");
console.log("  · priceAmount   — in PAISE (₹2,499 = 249900)");
console.log("  · status        — 'published'");
console.log("and in its `cohorts` document: the 4 session dates, seatsTotal, joiningLink,");
console.log("then status 'open'.");

await client.close();
