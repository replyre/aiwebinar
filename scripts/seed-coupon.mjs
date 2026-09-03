/**
 * Create or update a discount code.
 *
 *   node scripts/seed-coupon.mjs STUDENT499 --flat 499 --label "Student offer"
 *   node scripts/seed-coupon.mjs EARLY20 --percent 20 --label "Early bird" --max 50
 *   node scripts/seed-coupon.mjs SAVE200 --off 200 --label "₹200 off"
 *   node scripts/seed-coupon.mjs STUDENT499 --list
 *   node scripts/seed-coupon.mjs STUDENT499 --off-switch      (deactivate)
 *
 * Amounts are given in RUPEES here and stored in paise — the one place a human types a
 * price, so the conversion happens once, at the boundary, rather than in the caller's head.
 *
 * ⚠️ `--flat` SETS THE PRICE; `--off` SUBTRACTS FROM IT. "This code makes it ₹499" is how
 * these are actually described, and `--flat 499` keeps that promise even if the list price
 * later changes. `--off 500` against a ₹999 course also gives ₹499 today — and silently
 * gives ₹799 the day the course becomes ₹1,299.
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

const args = process.argv.slice(2);
const code = (args[0] ?? "").trim().toUpperCase().replace(/\s+/g, "");

if (!code || code.startsWith("--")) {
  console.error("usage: node scripts/seed-coupon.mjs <CODE> [--flat <rupees> | --off <rupees> | --percent <n>] [--label <text>] [--max <n>] [--course <slug>] [--list] [--off-switch]");
  process.exit(1);
}

const flag = (name) => {
  const at = args.indexOf(`--${name}`);
  return at === -1 ? null : args[at + 1] ?? null;
};
const has = (name) => args.includes(`--${name}`);

const env = loadEnv();
const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db(env.MONGODB_DB || "innovgeist");
const coupons = db.collection("coupons");
await coupons.createIndex({ code: 1 }, { unique: true });

if (has("list")) {
  const doc = await coupons.findOne({ code });
  console.log(doc ? JSON.stringify(doc, null, 2) : `no coupon "${code}"`);
  await client.close();
  process.exit(0);
}

if (has("off-switch")) {
  const r = await coupons.updateOne({ code }, { $set: { active: false, updatedAt: new Date() } });
  console.log(r.matchedCount ? `deactivated "${code}"` : `no coupon "${code}"`);
  await client.close();
  process.exit(0);
}

let type;
let value;

if (flag("flat") !== null) {
  type = "flat_price";
  value = Math.round(Number(flag("flat")) * 100);
} else if (flag("off") !== null) {
  type = "fixed";
  value = Math.round(Number(flag("off")) * 100);
} else if (flag("percent") !== null) {
  type = "percentage";
  value = Number(flag("percent"));
} else {
  console.error("Give one of --flat <rupees>, --off <rupees> or --percent <n>.");
  await client.close();
  process.exit(1);
}

if (!Number.isFinite(value) || value < 0) {
  console.error("The discount value must be a non-negative number.");
  await client.close();
  process.exit(1);
}

const courseSlug = flag("course");
const maxUses = flag("max") !== null ? Number(flag("max")) : null;
const now = new Date();

await coupons.updateOne(
  { code },
  {
    $set: {
      code,
      type,
      value,
      label: flag("label") ?? "Discount",
      active: true,
      startsAt: null,
      endsAt: null,
      maxUses,
      // `null` = every course.
      courseSlugs: courseSlug ? [courseSlug] : null,
      updatedAt: now,
    },
    // ⚠️ Never reset the redemption counter on an update — re-running this to fix a typo
    // in the label must not hand back uses that have already been spent.
    $setOnInsert: { usesCount: 0, createdAt: now },
  },
  { upsert: true },
);

const doc = await coupons.findOne({ code });
const describe =
  doc.type === "flat_price"
    ? `sets the price to ₹${doc.value / 100}`
    : doc.type === "fixed"
      ? `takes ₹${doc.value / 100} off`
      : `takes ${doc.value}% off`;

console.log(`"${doc.code}" — ${describe}`);
console.log(`  label     ${doc.label}`);
console.log(`  courses   ${doc.courseSlugs ? doc.courseSlugs.join(", ") : "all"}`);
console.log(`  uses      ${doc.usesCount}${doc.maxUses === null ? " (uncapped)" : ` / ${doc.maxUses}`}`);
console.log(`  active    ${doc.active}`);

await client.close();
