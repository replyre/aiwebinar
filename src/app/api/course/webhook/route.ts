import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { confirmPayment, markPaymentFailed } from "@/lib/enrolments-server";
import { verifyWebhookSignature, webhookConfigured } from "@/lib/razorpay";
import { sendEnrolmentConfirmation } from "@/lib/course-mail";

/**
 * The slow path: Razorpay tells us directly, server to server.
 *
 * ⚠️ THIS EXISTS FOR THE CLOSED TAB. The browser handler covers the happy case, but a
 * parent who pays and immediately closes the tab — or loses signal at exactly the wrong
 * second — has a real payment and, without this, no enrolment. That gap is where a support
 * ticket saying "I paid and got nothing" comes from.
 *
 * ⚠️ THE SIGNATURE IS OVER THE RAW BODY. `request.text()` first, parse only after the HMAC
 * passes: `JSON.parse` then `JSON.stringify` reorders keys and changes whitespace, and the
 * HMAC is over bytes, so a round-tripped body never matches. That bug presents as "every
 * webhook is a forgery", which sends you looking in entirely the wrong place.
 *
 * ⚠️ ALWAYS ANSWER 200 ONCE THE SIGNATURE IS GOOD. Razorpay retries on a non-2xx, so
 * returning 500 for a problem retrying cannot fix — an enrolment we cannot match — turns
 * one bad event into a retry storm. The failure is logged instead.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RazorpayEvent {
  event?: string;
  payload?: {
    payment?: {
      entity?: { id?: string; order_id?: string; amount?: number; notes?: Record<string, string> };
    };
  };
}

export async function POST(request: Request) {
  if (!webhookConfigured) {
    console.error("[webhook] refused — RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!signature || !verifyWebhookSignature(raw, signature)) {
    console.error("[webhook] REJECTED — bad or missing signature");
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(raw) as RazorpayEvent;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const name = event.event ?? "";

  try {
    if (name === "payment.failed") {
      if (payment?.order_id) await markPaymentFailed(payment.order_id);
      return NextResponse.json({ ok: true });
    }

    if (name !== "payment.captured" && name !== "order.paid") {
      // Everything else is subscribed-to noise; acknowledge and move on.
      return NextResponse.json({ ok: true });
    }

    const enrolmentId = payment?.notes?.enrolmentId;
    if (!enrolmentId || !ObjectId.isValid(enrolmentId)) {
      console.error(`[webhook] ${name} carries no usable enrolmentId note`, {
        orderId: payment?.order_id,
      });
      return NextResponse.json({ ok: true });
    }

    const { enrolment, newlyConfirmed } = await confirmPayment({
      enrolmentId: new ObjectId(enrolmentId),
      razorpayPaymentId: payment?.id ?? "",
      amountPaid: payment?.amount ?? 0,
    });

    // Only when this call is the one that flipped it, so the browser handler having got
    // there first does not produce a duplicate email.
    if (enrolment && newlyConfirmed) {
      await sendEnrolmentConfirmation(enrolment).catch((error) => {
        console.error("[webhook] confirmation email failed (the enrolment is confirmed)", error);
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[webhook] handler failed for ${name}`, error);
    // Deliberately 200 — see the note above on retry storms.
    return NextResponse.json({ ok: true });
  }
}
