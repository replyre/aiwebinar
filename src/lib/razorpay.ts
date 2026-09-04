import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay, server side. Order creation and the two signature checks.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ THE RULE THIS FILE EXISTS TO ENFORCE: **the browser never decides that a payment
 * happened.** Razorpay Checkout hands the browser three strings when it succeeds, and a
 * browser can invent all three. What it cannot invent is an HMAC signed with the key
 * secret, which only this server holds. `verifyPaymentSignature` is the whole boundary
 * between "a seat was paid for" and "somebody said a seat was paid for".
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * TWO INDEPENDENT PATHS CONFIRM A PAYMENT, and both are needed:
 *
 *   1. The **handler** — Checkout calls back into the page, the page posts the three
 *      strings to /api/course/verify, this file checks the HMAC. Fast, and it is what lets
 *      the student see the confirmation the instant they have paid. It also works on
 *      localhost, which is what makes the flow testable without a tunnel.
 *   2. The **webhook** — Razorpay posts to us directly. Slower, but it arrives even if the
 *      tab is closed in the two seconds after paying, which is the gap that would
 *      otherwise leave a payment with no enrolment.
 *
 * Both confirm the same enrolment and both are idempotent, so whichever lands first wins
 * and the second is a no-op.
 */

const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? "";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";

export const razorpayConfigured = Boolean(KEY_ID && KEY_SECRET);
export const webhookConfigured = Boolean(WEBHOOK_SECRET);
export const razorpayKeyId = KEY_ID;

/**
 * Whether we are pointed at test mode.
 *
 * Razorpay encodes it in the key id itself, so this cannot drift from reality the way a
 * separate `RAZORPAY_MODE` variable would. Surfaced in the UI so nobody can mistake a test
 * payment for a real one — the amounts and the screens are identical.
 */
export const isTestMode = KEY_ID.startsWith("rzp_test_");

/**
 * A live key is refused unless somebody has said, in the environment, that they meant it.
 *
 * ⚠️ THIS GUARD EXISTS BECAUSE RAZORPAY'S DASHBOARD HANDS YOU A **LIVE** KEY BY DEFAULT —
 * the mode selector is a dropdown rather than anything that looks like a switch, so
 * generating a live key while intending to test is the easy mistake, not the exotic one. A
 * live key in a dev `.env.local` means the first "test" enrolment charges a real card, and
 * refunding it costs the Razorpay fee either way.
 *
 * So: test keys work, live keys do not. Going live is a deliberate act — set
 * `RAZORPAY_ALLOW_LIVE=true` on the production deploy and nowhere else.
 */
const ALLOW_LIVE = process.env.RAZORPAY_ALLOW_LIVE === "true";

export const liveKeyBlocked = Boolean(KEY_ID) && !isTestMode && !ALLOW_LIVE;

export const LIVE_BLOCKED_MESSAGE =
  "This deployment is configured with a LIVE Razorpay key, which would charge real cards. " +
  "Use a test key (rzp_test_…), or set RAZORPAY_ALLOW_LIVE=true if you really mean to take live payments.";

/**
 * Constant-time compare.
 *
 * ⚠️ NOT `a === b`. String comparison returns as soon as two characters differ, which leaks
 * how much of a guess was correct and makes a signature forgeable one byte at a time.
 * `timingSafeEqual` throws on length mismatch, so that is checked first.
 */
function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64")}`;
}

export interface CreatedOrder {
  id: string;
  amount: number;
  currency: string;
}

/**
 * Create an order with Razorpay.
 *
 * Plain `fetch` against their REST API rather than the `razorpay` npm package: this is one
 * POST with basic auth, and the package brings a dependency tree for it.
 *
 * `amountPaise` is in **paise** — ₹499 is 49900. Razorpay has no rupee-denominated field.
 */
export async function createRazorpayOrder(input: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<CreatedOrder> {
  if (!razorpayConfigured) throw new Error("Razorpay keys are not configured");
  if (liveKeyBlocked) throw new Error(LIVE_BLOCKED_MESSAGE);

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      // Razorpay caps receipts at 40 characters and rejects longer ones outright.
      receipt: input.receipt.slice(0, 40),
      /**
       * Notes ride along on the payment and show up in the Razorpay dashboard, so an
       * enrolment can be reconciled against a payout without touching the database.
       * Razorpay caps these at 15 keys.
       */
      notes: input.notes,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Razorpay order failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as CreatedOrder;
}

/**
 * Read an order back from Razorpay.
 *
 * ⚠️ THIS IS WHAT MAKES THE `notes` TRUSTWORTHY, and it is not optional. The handler
 * signature proves a payment is real and belongs to an order — it proves nothing about
 * *which cohort* or *what price*. Without reading the order back, a client could pay ₹1 and
 * then claim a ₹2,499 seat, because the cohort would have come from its own request body.
 * Fetched here, `notes.enrolmentId` and the amount are whatever the SERVER wrote when it
 * created the order.
 */
export async function fetchRazorpayOrder(id: string): Promise<{
  id: string;
  amount: number;
  amount_paid: number;
  status: string;
  notes: Record<string, string>;
}> {
  if (!razorpayConfigured) throw new Error("Razorpay keys are not configured");

  const response = await fetch(`https://api.razorpay.com/v1/orders/${id}`, {
    headers: { Authorization: authHeader() },
  });
  if (!response.ok) throw new Error(`Razorpay order lookup failed (${response.status})`);
  return await response.json();
}

/**
 * The handler check: did Razorpay really sign this order/payment pair?
 *
 * Their documented formula — HMAC-SHA256 of `order_id|payment_id` keyed with the **key
 * secret**. Note it is the key secret here and the *webhook* secret below; they are
 * different values, and swapping them fails in a way that looks like a code bug.
 */
export function verifyPaymentSignature(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  if (!KEY_SECRET) return false;
  const expected = sign(`${input.razorpayOrderId}|${input.razorpayPaymentId}`, KEY_SECRET);
  return safeEqual(expected, input.razorpaySignature);
}

/**
 * The webhook check, over the **raw** request body.
 *
 * ⚠️ RAW, NOT RE-SERIALISED. `JSON.parse` then `JSON.stringify` reorders keys and changes
 * whitespace, and the HMAC is over bytes — so a round-tripped body never matches, and the
 * bug presents as "every webhook is a forgery". The route reads `request.text()` first and
 * parses only after this has passed.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  return safeEqual(sign(rawBody, WEBHOOK_SECRET), signature);
}
