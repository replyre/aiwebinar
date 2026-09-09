import { NextResponse } from "next/server";
import { isRegistrable, payableAmount } from "@/lib/course";
import { applyCoupon, checkCoupon, normaliseCode } from "@/lib/coupon";
import { findCoupon } from "@/lib/coupons-server";
import {
  CONSENT_TEXT,
  CONSENT_VERSION,
  enrolmentSchema,
  fieldErrors,
  type EnrolResponse,
} from "@/lib/enrolment";
import {
  attachOrderId,
  confirmFreeEnrolment,
  createPendingEnrolment,
  findExistingEnrolment,
  reopenEnrolmentForPayment,
  updateEnrolmentForResubmission,
  type AppliedCoupon,
  type EnrolmentDoc,
} from "@/lib/enrolments-server";
import { getCohortById, getPublishedCourse } from "@/lib/courses-server";
import { mongoConfigured } from "@/lib/mongodb";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  createRazorpayOrder,
  isTestMode,
  liveKeyBlocked,
  razorpayConfigured,
  razorpayKeyId,
} from "@/lib/razorpay";

/**
 * Start an enrolment: validate, store, and open a Razorpay order.
 *
 * ⚠️ THE PRICE IS COMPUTED HERE AND NOWHERE ELSE. The request body carries a cohort id and
 * some names — never an amount. The course is looked up from the cohort, `payableAmount`
 * applies the discount, and that number is what the Razorpay order is created for. If the
 * browser could name a price, the ₹2,499 seat would sell for ₹1.
 *
 * The enrolment row is written *before* Razorpay is called, in `pending`. That ordering is
 * deliberate: a payment that succeeds against a row that does not exist is unreconcilable,
 * whereas a pending row with no payment is just an abandoned checkout — and a useful one,
 * because it is a lead.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse<EnrolResponse>> {
  const ip = clientIp(request);
  const { allowed, retryAfterSeconds } = rateLimit(`enrol:${ip}`, {
    limit: 8,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  if (!mongoConfigured) {
    console.error("[enrol] refused — MONGODB_URI is not set");
    return NextResponse.json(
      { ok: false, message: "Enrollment is temporarily unavailable. Please email support@innovgeist.com." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Malformed request." }, { status: 400 });
  }

  const parsed = enrolmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        errors: fieldErrors(parsed.error),
        message: "Please correct the highlighted fields.",
      },
      { status: 400 },
    );
  }

  const { _honey, ...enrolment } = parsed.data;

  // Tell a bot it succeeded and store nothing. A plain success costs it nothing to
  // believe; "you were detected" is how the next version learns to skip the field.
  if (_honey) {
    return NextResponse.json({ ok: true, confirmedUrl: "/course/enrolled" });
  }

  /**
   * ⚠️ THE COURSE IS THE GATE, NOT THE BATCH. `getPublishedCourse` returns nothing for a
   * draft or archived slug, so "is this on sale" is decided entirely by the course's own
   * status — exactly what an admin toggles when they publish it.
   */
  const course = await getPublishedCourse(enrolment.courseSlug);
  if (!course) {
    return NextResponse.json(
      { ok: false, message: "This course is not open for enrollment." },
      { status: 400 },
    );
  }

  /**
   * A batch is optional. If one was chosen it is validated; if it has filled or closed since
   * the page rendered, the enrolment proceeds *without* a batch rather than being refused —
   * the student is placed manually over WhatsApp either way, and refusing a paying parent
   * over a scheduling detail is the worse outcome.
   */
  let cohort = enrolment.cohortId ? await getCohortById(enrolment.cohortId) : null;

  if (cohort && cohort.courseSlug !== course.slug) {
    // A batch belonging to a different course is a tampered or stale request; drop it
    // rather than enrol somebody into the wrong thing.
    console.warn(`[enrol] batch ${cohort.id} does not belong to ${course.slug} — ignored`);
    cohort = null;
  }

  if (cohort && !isRegistrable(cohort)) {
    console.warn(`[enrol] batch ${cohort.id} is no longer registrable — enrolling without it`);
    cohort = null;
  }

  const baseAmount = payableAmount(course.pricing);

  /**
   * ⚠️ THE COUPON IS LOOKED UP AND RE-VALIDATED HERE, FROM SCRATCH.
   *
   * `POST /api/course/coupon` already checked this code — and that check counts for nothing.
   * It ran against a different request, possibly minutes ago, and the browser could have
   * skipped it entirely or invented its answer. The only figure that reaches Razorpay is the
   * one computed on this line, from the coupon as it exists right now.
   *
   * A code that has expired or been used up between the page load and this request is
   * *dropped silently* rather than refused: the parent still enrols, at full price, which is
   * a better outcome than an error page. The response tells the browser what was actually
   * charged.
   */
  let appliedCoupon: AppliedCoupon | null = null;
  let amount = baseAmount;

  if (enrolment.couponCode) {
    const coupon = await findCoupon(enrolment.couponCode);
    const rejection = checkCoupon(coupon, course.slug);

    if (!rejection && coupon) {
      const discounted = applyCoupon(baseAmount, coupon);
      if (discounted < baseAmount) {
        amount = discounted;
        appliedCoupon = {
          code: coupon.code,
          label: coupon.label,
          type: coupon.type,
          value: coupon.value,
          savedAmount: baseAmount - discounted,
        };
      }
    } else {
      console.warn(
        `[enrol] coupon "${normaliseCode(enrolment.couponCode)}" ignored: ${rejection ?? "not_found"}`,
      );
    }
  }

  const userAgent = request.headers.get("user-agent") ?? "";

  /**
   * ⚠️ CHECKED HERE, NOT JUST RENDERED ON THE COURSE PAGE. The "you're already enrolled" /
   * "finish your payment" card on the course page is a courtesy that stops most people from
   * seeing this form twice — it cannot stop this endpoint from being hit again from a stale
   * tab, a back-navigation, or the auto-popup modal that rendered before a guardian signed in.
   * This is the one place that actually writes a row, so it is the one place that has to ask.
   */
  const existing = await findExistingEnrolment({
    courseSlug: course.slug,
    studentName: enrolment.student.fullName,
    guardianEmail: enrolment.guardian.email,
  });

  if (existing && (existing.payment.status === "paid" || existing.payment.status === "not_required")) {
    return NextResponse.json({ ok: true, confirmedUrl: `/course/enrolled/${existing.reference}` });
  }

  let enrolmentDoc: EnrolmentDoc;
  // Tracked separately from `existing` because the race-recovery path below also ends up
  // reusing a row, even though `existing` itself was null when this request started.
  let reused = Boolean(existing);

  if (existing) {
    // A pending or failed attempt for the same student — refresh it with whatever was just
    // typed and pick up exactly where a fresh submission would, without a second row.
    await updateEnrolmentForResubmission({
      enrolmentId: existing._id,
      cohortId: cohort?.id ?? null,
      student: enrolment.student,
      guardian: enrolment.guardian,
      coupon: appliedCoupon,
      amount,
    });
    enrolmentDoc = { ...existing, cohortId: cohort?.id ?? null, student: enrolment.student, guardian: enrolment.guardian };
  } else {
    try {
      enrolmentDoc = await createPendingEnrolment({
        course,
        cohort,
        enrolment,
        consentText: CONSENT_TEXT,
        consentVersion: CONSENT_VERSION,
        ip,
        userAgent,
        coupon: appliedCoupon,
        amount,
      });
    } catch (error) {
      /**
       * ⚠️ A DUPLICATE-KEY ERROR HERE MEANS SOMEONE ELSE JUST WON A RACE, NOT THAT ANYTHING
       * BROKE. Two requests can both pass the `findExistingEnrolment` check above before
       * either has written a row — that is exactly what the partial unique index on
       * `dedupeKey` exists to catch. The loser re-fetches what the winner just created and
       * joins it, the same as a normal resubmission, instead of failing with a 500 right
       * after a card may have been charged.
       */
      const code = (error as { code?: number } | null)?.code;
      const raced = code === 11000
        ? await findExistingEnrolment({
            courseSlug: course.slug,
            studentName: enrolment.student.fullName,
            guardianEmail: enrolment.guardian.email,
          })
        : null;

      if (!raced) {
        console.error("[enrol] could not store the enrolment", error);
        return NextResponse.json(
          { ok: false, message: "Something went wrong. Please email support@innovgeist.com." },
          { status: 500 },
        );
      }

      if (raced.payment.status === "paid" || raced.payment.status === "not_required") {
        return NextResponse.json({ ok: true, confirmedUrl: `/course/enrolled/${raced.reference}` });
      }

      await updateEnrolmentForResubmission({
        enrolmentId: raced._id,
        cohortId: cohort?.id ?? null,
        student: enrolment.student,
        guardian: enrolment.guardian,
        coupon: appliedCoupon,
        amount,
      });
      enrolmentDoc = { ...raced, cohortId: cohort?.id ?? null, student: enrolment.student, guardian: enrolment.guardian };
      reused = true;
    }
  }

  /**
   * Free, or discounted to zero: skip Razorpay entirely. Creating a ₹0 order is not a
   * thing Razorpay supports, and pretending otherwise fails at Checkout with a message
   * nobody can act on.
   */
  if (amount === 0) {
    await confirmFreeEnrolment(enrolmentDoc._id);
    return NextResponse.json({
      ok: true,
      confirmedUrl: `/course/enrolled/${enrolmentDoc.reference}`,
    });
  }

  if (!razorpayConfigured || liveKeyBlocked) {
    console.error(
      liveKeyBlocked
        ? "[enrol] refused — a LIVE Razorpay key is configured without RAZORPAY_ALLOW_LIVE"
        : "[enrol] refused — Razorpay keys are not configured",
    );
    return NextResponse.json(
      { ok: false, message: "Payments are temporarily unavailable. Please email support@innovgeist.com." },
      { status: 503 },
    );
  }

  try {
    const order = await createRazorpayOrder({
      amountPaise: amount,
      receipt: enrolmentDoc.reference,
      /**
       * These ride along on the payment into the Razorpay dashboard, and — more
       * importantly — `fetchRazorpayOrder` reads them back at verification time as values
       * the *server* wrote, not values a client claimed.
       */
      notes: {
        enrolmentId: enrolmentDoc._id.toHexString(),
        reference: enrolmentDoc.reference,
        courseSlug: course.slug,
        ...(cohort ? { cohortId: cohort.id, cohortName: cohort.name } : {}),
        studentName: enrolment.student.fullName,
        guardianPhone: enrolment.guardian.phone,
        ...(appliedCoupon ? { coupon: appliedCoupon.code } : {}),
      },
    });

    // A resubmission resets `failed` back to `pending` and attaches the new order in one
    // step; a fresh row just needs the order id attached.
    if (reused) {
      await reopenEnrolmentForPayment(enrolmentDoc._id, order.id);
    } else {
      await attachOrderId(enrolmentDoc._id, order.id);
    }

    return NextResponse.json({
      ok: true,
      order: {
        enrolmentId: enrolmentDoc._id.toHexString(),
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
        appliedCoupon: appliedCoupon
          ? { code: appliedCoupon.code, savedAmount: appliedCoupon.savedAmount }
          : null,
      },
    });
  } catch (error) {
    console.error("[enrol] Razorpay order failed", error);
    return NextResponse.json(
      { ok: false, message: "Could not start the payment. Please try again in a moment." },
      { status: 502 },
    );
  }
}
