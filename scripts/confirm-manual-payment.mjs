/**
 * Confirm an enrolment that was paid outside Razorpay — cash, UPI, a bank transfer.
 *
 *   node scripts/confirm-manual-payment.mjs <reference> --dry
 *   node scripts/confirm-manual-payment.mjs <reference> --note "UPI, 14 Sep"
 *   node scripts/confirm-manual-payment.mjs <reference> --drop <other-reference>
 *
 * Flags:
 *   --note <text>   what actually happened, kept on the record
 *   --drop <ref>    also delete this other enrolment as a duplicate
 *   --dry           print what would change and write nothing
 *
 * ⚠️ THIS PROMOTES AN EXISTING ROW; IT NEVER INVENTS ONE. The obvious alternative — type the
 * student's details into a fresh document — silently discards the one thing a manual
 * enrolment cannot be reconstructed without: the guardian's consent record, with its text
 * version, timestamp and IP, captured when they actually filled the form. That is the
 * evidence the DPDP Act asks for on a minor's data, and a hand-written row has none of it.
 * So the student must already have started a checkout; this finishes it.
 *
 * ⚠️ `payment.method: "manual"` IS NOT DECORATION. Razorpay knows nothing about this money,
 * so the record must say why it is marked paid with no `razorpayPaymentId`. Without it the
 * row is indistinguishable from a bug that confirms unpaid enrolments.
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
const reference = (args[0] ?? "").trim();
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? null : args[i + 1] ?? "";
};
const dry = args.includes("--dry");
const note = flag("note") || "Paid manually, outside Razorpay.";
const drop = flag("drop");

if (!reference || reference.startsWith("--")) {
  console.error(
    'usage: node scripts/confirm-manual-payment.mjs <reference> [--note "..."] [--drop <ref>] [--dry]',
  );
  process.exit(1);
}

const env = loadEnv();
const client = new MongoClient(env.MONGODB_URI);
await client.connect();
const db = client.db(env.MONGODB_DB);

const doc = await db.collection("enrolments").findOne({ reference });
if (!doc) {
  console.error(`No enrolment with reference ${reference}`);
  await client.close();
  process.exit(1);
}

const dupe = drop ? await db.collection("enrolments").findOne({ reference: drop }) : null;
if (drop && !dupe) {
  console.error(`No enrolment with reference ${drop} to drop`);
  await client.close();
  process.exit(1);
}

console.log(`student   ${doc.student?.fullName}  (Class ${doc.student?.class})`);
console.log(`guardian  ${doc.guardian?.fullName}  ${doc.guardian?.phone}`);
console.log(`amount    ₹${((doc.payment?.amount ?? 0) / 100).toFixed(2)}  code ${doc.payment?.coupon?.code ?? "—"}`);
console.log(`now       status ${doc.status}, payment ${doc.payment?.status}`);
if (dupe) {
  console.log(
    `duplicate ${dupe.reference}  guardian ${dupe.guardian?.fullName}, payment ${dupe.payment?.status} — will be deleted`,
  );
}

if (doc.status === "confirmed") {
  console.log("\nAlready confirmed — nothing to do.");
  await client.close();
  process.exit(0);
}

if (!dry) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = new URL(`./.backup-manual-${reference.slice(0, 8)}-${stamp}.json`, import.meta.url);
  writeFileSync(path, JSON.stringify({ doc, dupe }, null, 2));
  console.log(`backup    ${path.pathname.split("/").pop()}`);
}

if (dry) {
  console.log(`\nwould set status=confirmed, payment.status=paid, payment.method=manual`);
  if (dupe) console.log(`would delete ${dupe.reference}`);
  console.log("\nDRY RUN — nothing was written.");
  await client.close();
  process.exit(0);
}

const now = new Date();
await db.collection("enrolments").updateOne(
  { _id: doc._id },
  {
    $set: {
      status: "confirmed",
      "payment.status": "paid",
      "payment.paidAt": doc.payment?.paidAt ?? now,
      "payment.method": "manual",
      "payment.note": note,
      updatedAt: now,
    },
  },
);
console.log("\n· confirmed, marked paid manually");

/**
 * ⚠️ THE SEAT IS NOT CLAIMED HERE. `place-coupon-batch.mjs` recounts `seatsTaken` from the
 * confirmed rows, so claiming one here as well would count this student twice. Run that
 * script after this one; it settles the placement and the count together.
 */
if (dupe) {
  await db.collection("enrolments").deleteOne({ _id: dupe._id });
  console.log(`· deleted duplicate ${dupe.reference}`);
}

console.log("\nDone. Run place-coupon-batch.mjs to settle the batch placement.");
await client.close();
