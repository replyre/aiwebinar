import { NextResponse } from "next/server";
import { ADMIN_COOKIE, isAdminTokenValid } from "@/lib/admin-auth";
import {
  createCohort,
  deleteCoupon,
  listCohorts,
  listCoupons,
  listCourses,
  listEnrolments,
  updateCohort,
  updateCoursePricing,
  updateCourseStatus,
  upsertCoupon,
} from "@/lib/admin-server";
import type { CohortStatus, CourseStatus } from "@/lib/course";
import type { CouponType } from "@/lib/coupon";

/**
 * One authenticated endpoint behind the admin panel: `GET` loads everything, `POST` applies
 * one named action.
 *
 * ⚠️ THE AUTH CHECK IS THE FIRST LINE OF BOTH HANDLERS, BEFORE ANY PARSING. Everything this
 * route reaches is unrestricted — prices, published state, enrolment records with a child's
 * name and a guardian's phone number. There is no read that is safe to do first.
 *
 * ⚠️ EVERY ACTION IS RE-VALIDATED HERE. The panel is the only client today, but a route that
 * trusts its own UI is a route that trusts whatever else learns to call it.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorised(request: Request): boolean {
  const cookie = request.headers
    .get("cookie")
    ?.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`))?.[1];
  return isAdminTokenValid(cookie);
}

const unauthorised = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: Request) {
  if (!authorised(request)) return unauthorised();

  const [courses, cohorts, coupons, enrolments] = await Promise.all([
    listCourses(),
    listCohorts(),
    listCoupons(),
    listEnrolments(200),
  ]);

  return NextResponse.json({ courses, cohorts, coupons, enrolments });
}

export async function POST(request: Request) {
  if (!authorised(request)) return unauthorised();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = String(body.action ?? "");
  const str = (key: string) => String(body[key] ?? "");
  const num = (key: string) => Number(body[key] ?? 0);

  try {
    switch (action) {
      case "course.status": {
        const status = str("status") as CourseStatus;
        if (!["draft", "published", "archived"].includes(status)) {
          return NextResponse.json({ error: "Unknown status." }, { status: 400 });
        }
        const ok = await updateCourseStatus(str("slug"), status);
        return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "Course not found." }, { status: 404 });
      }

      case "course.pricing": {
        const type = str("discountType");
        if (!["none", "percentage", "fixed"].includes(type)) {
          return NextResponse.json({ error: "Unknown discount type." }, { status: 400 });
        }
        /**
         * ⚠️ RUPEES IN, PAISE OUT. The form asks for rupees because that is what a human
         * types; everything below this line — and Razorpay — counts in paise. Converting at
         * exactly one boundary is what stops a ₹999 course being sold for ₹9.99.
         * A percentage is not a currency and is passed through untouched.
         */
        const ok = await updateCoursePricing(str("slug"), {
          listAmount: Math.round(num("listRupees") * 100),
          discount: {
            type,
            value: type === "percentage" ? num("discountValue") : Math.round(num("discountValue") * 100),
            label: str("discountLabel"),
          },
        });
        return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "Course not found." }, { status: 404 });
      }

      case "cohort.create": {
        const id = await createCohort(str("courseSlug"), str("name"));
        return id ? NextResponse.json({ ok: true, id }) : NextResponse.json({ error: "Could not create." }, { status: 500 });
      }

      case "cohort.update": {
        const status = str("status") as CohortStatus;
        const validStatus = ["draft", "open", "full", "closed", "running", "completed"].includes(status);

        const ok = await updateCohort(str("id"), {
          name: str("name"),
          joiningLink: str("joiningLink"),
          // Blank / null means uncapped, which is different from zero seats.
          seatsTotal: body.seatsTotal === null || body.seatsTotal === "" ? null : num("seatsTotal"),
          ...(validStatus ? { status } : {}),
          sessionDates: Array.isArray(body.sessionDates)
            ? (body.sessionDates as unknown[]).map((v) => {
                const value = String(v ?? "").trim();
                if (!value) return null;
                const parsed = new Date(value);
                return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
              })
            : undefined,
        });
        return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "Batch not found." }, { status: 404 });
      }

      case "coupon.save": {
        const type = str("type") as CouponType;
        if (!["percentage", "fixed", "flat_price"].includes(type)) {
          return NextResponse.json({ error: "Unknown coupon type." }, { status: 400 });
        }
        // Same rupees→paise rule as above; a percentage stays a percentage.
        const value = type === "percentage" ? num("value") : Math.round(num("value") * 100);
        const slugs = Array.isArray(body.courseSlugs) ? (body.courseSlugs as string[]) : null;

        const ok = await upsertCoupon({
          code: str("code"),
          type,
          value,
          label: str("label"),
          active: Boolean(body.active),
          maxUses: body.maxUses === null || body.maxUses === "" ? null : Math.max(1, num("maxUses")),
          courseSlugs: slugs && slugs.length ? slugs : null,
        });
        return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "Could not save." }, { status: 400 });
      }

      case "coupon.delete": {
        const ok = await deleteCoupon(str("code"));
        return ok ? NextResponse.json({ ok }) : NextResponse.json({ error: "Code not found." }, { status: 404 });
      }

      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (error) {
    // The reason goes to the log, never the response — a driver error names hosts and
    // collections.
    console.error(`[admin] action "${action}" failed`, error);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
