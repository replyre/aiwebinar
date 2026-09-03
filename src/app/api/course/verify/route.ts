import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { confirmPayment } from "@/lib/enrolments-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { fetchRazorpayOrder, verifyPaymentSignature } from "@/lib/razorpay";
import { sendEnrolmentConfirmation } from "@/lib/course-mail";

/**
 * The fast path: Razorpay Checkout succeeded in the browser and handed it three strings.
 *
 * ⚠️ THE THREE STRINGS PROVE NOTHING ON THEIR OWN — a browser can invent all three. What it
 * cannot invent is `razorpay_signature`, an HMAC over `order_id|payment_id` keyed with the
 * secret only this server holds. That check is the entire boundary between a paid seat and
 * a claimed one, and it happens before anything is written.
 *
 * ⚠️ AND THE SIGNATURE STILL IS NOT ENOUGH. It proves the payment is real and belongs to
 * that order — it says nothing about *which enrolment* or *how much*. So the order is read
 * back from Razorpay and `notes.enrolmentId` is taken from THAT, not from the request body.
 * Otherwise a genuine ₹8 payment could be presented against somebody else's ₹2,499 seat.
 *
 * The webhook confirms the same enrolment independently. Both are idempotent; whichever
 * lands first wins.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const { allowed } = rateLimit(`verify:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ ok: false, message: "Too many attempts." }, { status: 429 });
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Malformed request." }, { status: 400 });
  }

  const orderId = body.razorpay_order_id ?? "";
  const paymentId = body.razorpay_payment_id ?? "";
  const signature = body.razorpay_signature ?? "";

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ ok: false, message: "Incomplete payment details." }, { status: 400 });
  }

  const signatureValid = verifyPaymentSignature({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: signature,
  });

  if (!signatureValid) {
    console.error(`[verify] REJECTED — bad signature for order ${orderId} from ${ip}`);
    return NextResponse.json(
      { ok: false, message: "We could not verify this payment." },
      { status: 400 },
    );
  }

  try {
    // Authoritative: what the server wrote into the order, and what Razorpay recorded
    // as paid.
    const order = await fetchRazorpayOrder(orderId);
    const enrolmentId = order.notes?.enrolmentId;

    if (!enrolmentId || !ObjectId.isValid(enrolmentId)) {
      console.error(`[verify] order ${orderId} carries no usable enrolmentId note`);
      return NextResponse.json(
        { ok: false, message: "We could not match this payment to an enrollment." },
        { status: 422 },
      );
    }

    if (order.status !== "paid" && order.amount_paid <= 0) {
      return NextResponse.json(
        { ok: false, message: "This payment has not completed yet." },
        { status: 409 },
      );
    }

    const { enrolment, newlyConfirmed } = await confirmPayment({
      enrolmentId: new ObjectId(enrolmentId),
      razorpayPaymentId: paymentId,
      amountPaid: order.amount_paid,
    });

    if (!enrolment) {
      return NextResponse.json({ ok: false, message: "Enrollment not found." }, { status: 404 });
    }

    // Only on the transition, so the webhook arriving second does not send a second copy.
    if (newlyConfirmed) {
      await sendEnrolmentConfirmation(enrolment).catch((error) => {
        console.error("[verify] confirmation email failed (the enrolment is confirmed)", error);
      });
    }

    return NextResponse.json({
      ok: true,
      confirmedUrl: `/course/enrolled/${enrolment.reference}`,
    });
  } catch (error) {
    console.error("[verify] failed after a valid signature", error);
    return NextResponse.json(
      { ok: false, message: "Your payment went through, but we could not finish setting up your seat. Please email support@innovgeist.com." },
      { status: 500 },
    );
  }
}
