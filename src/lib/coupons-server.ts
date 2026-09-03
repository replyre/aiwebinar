import "server-only";

import type { Db } from "mongodb";
import { normaliseCode, type Coupon } from "@/lib/coupon";
import { getDb, mongoConfigured } from "@/lib/mongodb";

/**
 * Coupon lookup and redemption.
 *
 * ⚠️ REDEMPTION IS NOT COUNTED WHEN A CODE IS APPLIED — only when money is confirmed. A
 * parent who types a code and then abandons Checkout must not burn one of fifty seats, and
 * a code capped at fifty that is "used up" by fifty abandoned carts is a promotion that
 * silently stops working while nobody has actually enrolled.
 */

interface CouponDoc extends Omit<Coupon, "startsAt" | "endsAt"> {
  startsAt: Date | null;
  endsAt: Date | null;
}

export async function ensureCouponIndexes(db: Db): Promise<void> {
  await db.collection("coupons").createIndex({ code: 1 }, { unique: true });
}

export async function findCoupon(code: string): Promise<Coupon | null> {
  if (!mongoConfigured) return null;
  const normalised = normaliseCode(code);
  if (!normalised) return null;

  try {
    const db = await getDb();
    const doc = await db.collection<CouponDoc>("coupons").findOne({ code: normalised });
    if (!doc) return null;
    return {
      code: doc.code,
      type: doc.type,
      value: doc.value,
      label: doc.label,
      active: doc.active,
      startsAt: doc.startsAt ?? null,
      endsAt: doc.endsAt ?? null,
      maxUses: doc.maxUses ?? null,
      usesCount: doc.usesCount ?? 0,
      courseSlugs: doc.courseSlugs ?? null,
    };
  } catch (error) {
    console.error("[coupons] lookup failed", error);
    return null;
  }
}

/**
 * Count one redemption, atomically.
 *
 * ⚠️ THE `$expr` IS WHAT MAKES A CAP A CAP. Read-then-write cannot enforce it: two parents
 * paying at the same instant both read `usesCount: 49` of 50, both decide there is room, and
 * both write 50 — fifty-one redemptions on a fifty-use code. Comparing and incrementing
 * inside one document update makes the database serialise them, and the loser gets `null`.
 *
 * ⚠️ FAILURE HERE IS LOGGED, NOT THROWN. This runs *after* a payment is confirmed. Refusing
 * at this point would mean taking the money and withholding the seat over a promotion
 * counter, which is the wrong trade every time. An over-redeemed cap is Rahul's problem to
 * look at, not the parent's.
 */
export async function redeemCoupon(code: string): Promise<boolean> {
  const normalised = normaliseCode(code);
  if (!normalised) return false;

  try {
    const db = await getDb();
    const result = await db.collection("coupons").findOneAndUpdate(
      {
        code: normalised,
        $or: [
          { maxUses: null },
          { $expr: { $lt: ["$usesCount", "$maxUses"] } },
        ],
      },
      { $inc: { usesCount: 1 } },
      { returnDocument: "after" },
    );

    if (!result) {
      console.error(
        `[coupons] OVER-REDEEMED — "${normalised}" was confirmed on a paid enrolment but is ` +
          `at or past its cap. The seat stands; review the coupon.`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[coupons] redemption failed for "${normalised}"`, error);
    return false;
  }
}
