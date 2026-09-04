/**
 * Discount codes — the ones students are given and type in at checkout.
 *
 * ⚠️ A COUPON IS NOT THE COURSE'S OWN DISCOUNT. `CoursePricing.discount` is a public price
 * cut everyone sees on the page; a coupon is private, entered by hand, and has to be
 * *validated* — it can be expired, used up, or for a different course. They compose: the
 * course discount applies first, the coupon second, so a launch price and a scholarship code
 * do not have to know about each other.
 *
 * ⚠️ NOTHING HERE IS TRUSTED FROM THE BROWSER. The client sends a code string and nothing
 * else. Every rule below is re-run on the server inside `POST /api/course/enrol` before the
 * Razorpay order is created — the "apply" endpoint exists only so the page can show a price
 * before the parent commits, and its answer is advisory.
 */

export const COUPON_TYPES = ["percentage", "fixed", "flat_price"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export interface Coupon {
  /** Stored and compared uppercase, so `study499` and `STUDY499` are the same code. */
  code: string;
  type: CouponType;
  /**
   * Percent (0–100) for `percentage`; paise off for `fixed`; the exact payable amount in
   * paise for `flat_price`.
   */
  value: number;
  /** Shown on the page once applied, e.g. "Student offer". */
  label: string;
  active: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  /** `null` = unlimited. */
  maxUses: number | null;
  usesCount: number;
  /** `null` = valid on every course. */
  courseSlugs: string[] | null;
}

export type CouponRejection =
  | "not_found"
  | "inactive"
  | "not_started"
  | "expired"
  | "exhausted"
  | "wrong_course";

export const COUPON_MESSAGES: Record<CouponRejection, string> = {
  not_found: "That code isn't valid.",
  inactive: "That code is no longer active.",
  not_started: "That code isn't active yet.",
  expired: "That code has expired.",
  exhausted: "That code has been fully claimed.",
  wrong_course: "That code doesn't apply to this course.",
};

/**
 * Every reason a code can be refused, in one place.
 *
 * ⚠️ THE CALLER SHOWS ONE MESSAGE FOR ALL OF THEM. Distinguishing "expired" from
 * "fully claimed" to the visitor tells someone probing codes which guesses were real, and
 * neither answer helps a parent who simply mistyped. The specific reason is for the log.
 */
export function checkCoupon(
  coupon: Coupon | null,
  courseSlug: string,
  now: Date = new Date(),
): CouponRejection | null {
  if (!coupon) return "not_found";
  if (!coupon.active) return "inactive";
  if (coupon.startsAt && now < coupon.startsAt) return "not_started";
  if (coupon.endsAt && now > coupon.endsAt) return "expired";
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) return "exhausted";
  if (coupon.courseSlugs && !coupon.courseSlugs.includes(courseSlug)) return "wrong_course";
  return null;
}

/**
 * Apply a coupon to an already-discounted amount.
 *
 * ⚠️ `flat_price` SETS THE PRICE, IT DOES NOT SUBTRACT. "This code makes it ₹499" is the
 * way these are actually described, and encoding it as "₹500 off" silently becomes wrong
 * the day the list price changes — a ₹1,299 course with a ₹500-off code is ₹799, not the
 * ₹499 that was promised. `flat_price` keeps the promise regardless of the list price.
 *
 * ⚠️ IT NEVER RAISES THE PRICE. A `flat_price` above what the parent would already pay is
 * ignored, so a stale code cannot cost somebody more than not having one.
 */
export function applyCoupon(baseAmount: number, coupon: Coupon): number {
  if (baseAmount <= 0) return 0;

  switch (coupon.type) {
    case "percentage": {
      const pct = Math.min(100, Math.max(0, coupon.value));
      return Math.max(0, Math.round((baseAmount * (100 - pct)) / 100));
    }
    case "fixed":
      return Math.max(0, baseAmount - Math.max(0, Math.round(coupon.value)));
    case "flat_price":
      return Math.min(baseAmount, Math.max(0, Math.round(coupon.value)));
    default:
      return baseAmount;
  }
}

/** Normalised form: uppercase, trimmed, inner spaces removed. */
export function normaliseCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** What `POST /api/course/coupon` answers with. */
export interface CouponResponse {
  ok: boolean;
  message?: string;
  applied?: {
    code: string;
    label: string;
    /** Before the coupon, after any course-level discount. In paise. */
    baseAmount: number;
    /** After the coupon. In paise. */
    amount: number;
    /** What the coupon took off. In paise. */
    savedAmount: number;
  };
}
