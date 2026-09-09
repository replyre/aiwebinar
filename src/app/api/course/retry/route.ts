import { NextResponse } from "next/server";
import { getEnrolmentByReference, reopenEnrolmentForPayment } from "@/lib/enrolments-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  createRazorpayOrder,
  isTestMode,
  liveKeyBlocked,
  razorpayConfigured,
  razorpayKeyId,
} from "@/lib/razorpay";

/**
 * Resume a stuck payment: same enrolment, a fresh Razorpay order.
 *
 * ⚠️ THE AMOUNT IS NEVER RECOMPUTED. It reuses `enrolment.payment.amount`, which was set once
 * at `POST /api/course/enrol` — that is the price this specific guardian already agreed to
 * (coupon applied or not), and it stays that price on retry rather than drifting with a
 * since-changed course price or an expired coupon.
 *
 * Keyed on the enrolment's `reference` — the same unguessable token that gates
 * `/course/enrolled/[reference]` — so this works from that page for a guest with no account,
 * and from the signed-in dashboard equally.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const { allowed, retryAfterSeconds } = rateLimit(`retry:${ip}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  let body: { reference?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Malformed request." }, { status: 400 });
  }

  const reference = String(body.reference ?? "");
  const enrolment = await getEnrolmentByReference(reference);
  if (!enrolment) {
    return NextResponse.json({ ok: false, message: "Enrollment not found." }, { status: 404 });
  }

  if (enrolment.payment.status === "paid" || enrolment.payment.status === "not_required") {
    return NextResponse.json({ ok: true, confirmedUrl: `/course/enrolled/${enrolment.reference}` });
  }

  if (enrolment.payment.status === "refunded") {
    return NextResponse.json(
      { ok: false, message: "This enrollment was refunded. Email support@innovgeist.com to re-enroll." },
      { status: 409 },
    );
  }

  if (!razorpayConfigured || liveKeyBlocked) {
    console.error(
      liveKeyBlocked
        ? "[retry] refused — a LIVE Razorpay key is configured without RAZORPAY_ALLOW_LIVE"
        : "[retry] refused — Razorpay keys are not configured",
    );
    return NextResponse.json(
      { ok: false, message: "Payments are temporarily unavailable. Please email support@innovgeist.com." },
      { status: 503 },
    );
  }

  try {
    const order = await createRazorpayOrder({
      amountPaise: enrolment.payment.amount,
      receipt: enrolment.reference,
      notes: {
        enrolmentId: enrolment._id.toHexString(),
        reference: enrolment.reference,
        courseSlug: enrolment.courseSlug,
        studentName: enrolment.student.fullName,
        guardianPhone: enrolment.guardian.phone,
        retry: "true",
      },
    });

    await reopenEnrolmentForPayment(enrolment._id, order.id);

    return NextResponse.json({
      ok: true,
      order: {
        enrolmentId: enrolment._id.toHexString(),
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId,
        isTestMode,
        prefill: {
          name: enrolment.guardian.fullName,
          email: enrolment.guardian.email,
          contact: enrolment.guardian.phone,
        },
      },
    });
  } catch (error) {
    console.error("[retry] Razorpay order failed", error);
    return NextResponse.json(
      { ok: false, message: "Could not start the payment. Please try again in a moment." },
      { status: 502 },
    );
  }
}
