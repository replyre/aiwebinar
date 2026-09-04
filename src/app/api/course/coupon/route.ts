import { NextResponse } from "next/server";
import { payableAmount } from "@/lib/course";
import {
  applyCoupon,
  checkCoupon,
  normaliseCode,
  type CouponResponse,
} from "@/lib/coupon";
import { findCoupon } from "@/lib/coupons-server";
import { getPublishedCourse } from "@/lib/courses-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Check a discount code and say what it would cost.
 *
 * ⚠️ THIS ENDPOINT IS ADVISORY AND CHANGES NOTHING. It does not reserve the code, does not
 * count a redemption, and its answer is not carried forward — `POST /api/course/enrol` looks
 * the same code up again and recomputes the amount from scratch. A client that skipped this
 * call entirely, or lied about its result, would still be charged the correct price.
 *
 * ⚠️ RATE-LIMITED HARDER THAN THE FORMS. A validity check is a free oracle: without a limit,
 * a script can work through a dictionary until it finds the live code and post it publicly.
 * Ten attempts per ten minutes lets a parent fix a typo and stops enumeration being
 * practical.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse<CouponResponse>> {
  const ip = clientIp(request);
  const { allowed, retryAfterSeconds } = rateLimit(`coupon:${ip}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  let body: { code?: string; courseSlug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Malformed request." }, { status: 400 });
  }

  const code = normaliseCode(String(body.code ?? ""));
  const courseSlug = String(body.courseSlug ?? "");

  if (!code) {
    return NextResponse.json({ ok: false, message: "Enter a code." }, { status: 400 });
  }

  const course = await getPublishedCourse(courseSlug);
  if (!course) {
    return NextResponse.json({ ok: false, message: "Course not found." }, { status: 404 });
  }

  const coupon = await findCoupon(code);
  const rejection = checkCoupon(coupon, courseSlug);

  if (rejection || !coupon) {
    /**
     * ⚠️ ONE MESSAGE FOR EVERY REJECTION. Telling the visitor "expired" rather than "not
     * found" confirms to anyone guessing that the code they tried was real — and to a parent
     * who mistyped, both answers mean the same thing. The specific reason goes to the log.
     */
    console.warn(`[coupon] rejected "${code}" for ${courseSlug}: ${rejection ?? "not_found"}`);
    return NextResponse.json(
      { ok: false, message: "That code isn't valid for this course." },
      { status: 200 },
    );
  }

  const baseAmount = payableAmount(course.pricing);
  const amount = applyCoupon(baseAmount, coupon);

  // A code that changes nothing is a rejection as far as the visitor is concerned —
  // showing "applied!" next to an unchanged price reads as a bug.
  if (amount >= baseAmount) {
    return NextResponse.json(
      { ok: false, message: "That code doesn't reduce the price of this course." },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    applied: {
      code: coupon.code,
      label: coupon.label,
      baseAmount,
      amount,
      savedAmount: baseAmount - amount,
    },
  });
}
