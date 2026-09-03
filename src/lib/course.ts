/**
 * The course domain — types and pure helpers, no database imports.
 *
 * ⚠️ A COURSE IS DATA, NOT CODE (PRD §8). Nothing here is specific to "The AI Study
 * Method": it is one row in `courses`, and the tenth course is another row. The moment a
 * week number, a price or an award name is hard-coded into a component, adding the next
 * course needs a deploy — which is the exact failure this shape exists to prevent.
 *
 * That also settles the three things Rahul has not decided yet — price, cohort dates, class
 * size. They are fields, so they are set in the database and never block the build.
 */

export const COURSE_MODES = ["live_cohort", "self_paced"] as const;
export type CourseMode = (typeof COURSE_MODES)[number];

export const COURSE_STATUSES = ["draft", "published", "archived"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

export const DISCOUNT_TYPES = ["none", "percentage", "fixed"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

/**
 * Price and discount, both set in the database.
 *
 * ⚠️ THE PAYABLE AMOUNT IS NEVER STORED. Only `listAmount` and the discount are, and
 * `payableAmount()` derives what is actually charged. Storing all three lets them disagree
 * — an edited price with a stale payable is money charged that nobody chose, and it is the
 * kind of bug that is invisible until a customer complains.
 *
 * ⚠️ PAISE, ALWAYS. Razorpay counts in the smallest currency unit and has no
 * rupee-denominated field — ₹2,499 is 249900. A float anywhere near this is a bug.
 */
export interface CoursePricing {
  /** The full price, in paise. `0` means the course is free. */
  listAmount: number;
  discount: {
    type: DiscountType;
    /** Percent (0–100) when `percentage`; paise when `fixed`; ignored when `none`. */
    value: number;
    /** Shown next to the struck-through price, e.g. "Launch cohort". Optional. */
    label?: string;
  };
}

/**
 * What the student is actually charged.
 *
 * ⚠️ THIS IS THE ONLY FUNCTION ALLOWED TO COMPUTE A PRICE, and it runs on the server before
 * the Razorpay order is created. The browser is shown the result; it never sends one. A
 * client that could name its own amount could buy a ₹2,499 seat for ₹1.
 *
 * Rounds to whole paise and never goes below zero — a fixed discount larger than the price
 * makes the course free, not negative.
 */
export function payableAmount(pricing: CoursePricing): number {
  const { listAmount, discount } = pricing;
  if (listAmount <= 0) return 0;

  switch (discount.type) {
    case "percentage": {
      const pct = Math.min(100, Math.max(0, discount.value));
      return Math.max(0, Math.round((listAmount * (100 - pct)) / 100));
    }
    case "fixed":
      return Math.max(0, listAmount - Math.max(0, Math.round(discount.value)));
    default:
      return listAmount;
  }
}

/** How much comes off, in paise. Zero when there is no discount. */
export function discountAmount(pricing: CoursePricing): number {
  return Math.max(0, pricing.listAmount - payableAmount(pricing));
}

/**
 * Whether to show a struck-through list price.
 *
 * ⚠️ FALSE UNLESS THE DISCOUNT IS REAL. An anchor price nobody was ever charged is invented
 * scarcity, and this brand has no reputation to spend on being caught at it.
 */
export function hasDiscount(pricing: CoursePricing): boolean {
  return discountAmount(pricing) > 0;
}

/**
 * One image, with whatever renditions exist for it.
 *
 * `width`/`height` are the intrinsic size of `src` and are not decoration: without them the
 * browser cannot reserve the box before the bytes arrive, and the page reflows as the
 * banner lands — a layout shift on the largest element above the fold.
 */
export interface CourseImage {
  /** Always-safe fallback: a JPEG or PNG every browser can render. */
  src: string;
  /** e.g. `"/…/banner.jpg 800w, /…/banner@2x.jpg 1600w"`. Optional. */
  srcSet?: string;
  /** Same widths in WebP, offered first via `<source type="image/webp">`. Optional. */
  webpSrcSet?: string;
  width: number;
  height: number;
  alt: string;
}

/** One of the five "what you'll be able to do" capabilities. */
export interface CourseOutcome {
  title: string;
  detail: string;
}

/** One of the six things the student keeps. */
export interface CourseDeliverable {
  title: string;
  detail: string;
}

/** One week of the course. `produces` is what makes this a course, not a webinar. */
export interface CurriculumWeek {
  week: number;
  title: string;
  detail: string;
  produces: string;
}

export interface Course {
  slug: string;
  title: string;
  subtitle: string;
  tagline: string;
  /** The one-paragraph promise. */
  promise: string;
  audience: string;
  mode: CourseMode;
  status: CourseStatus;

  /**
   * What the course costs and what comes off it. Both are set in the database, never in
   * code — see `payableAmount`, which is the only thing allowed to combine them.
   */
  pricing: CoursePricing;
  currency: "INR";

  facilitator: { name: string; title: string };

  commitment: {
    sessions: number;
    sessionMinutes: number;
    /** Free text — the brief says "about 30–45 minutes", and a range is honest where a number is not. */
    practicePerWeek: string;
    cadence: string;
  };

  outcomes: CourseOutcome[];
  deliverables: CourseDeliverable[];
  curriculum: CurriculumWeek[];
  /** The five commitments asked of the student. */
  expectations: string[];
  awards: string[];
  tools: string[];

  /** The before/after mechanic, which is the strongest thing in the offer. */
  proof: {
    questionCount: number;
    exampleBefore: string;
    exampleAfter: string;
    exampleConfidenceBefore: string;
    exampleConfidenceAfter: string;
  };

  /** Path to the brochure the student forwards to a parent. */
  brochurePath: string;

  /**
   * Course artwork.
   *
   * ⚠️ FULL URLS IN THE DATABASE, NOT PUBLIC IDS OR PATH CONVENTIONS. Two sources have to
   * work through one shape: files served from `/public` (with hand-generated WebP/JPEG
   * renditions) and Cloudinary URLs, which already carry the cloud name and an
   * `f_auto,q_auto` transform that picks the format per browser. Deriving a `.webp`
   * sibling from a `.jpg` path would work for the first and silently 404 for the second,
   * so the rendition sets are stored rather than guessed.
   *
   * All optional: a course with no artwork renders a typographic header, not a broken
   * image.
   */
  images: {
    /** Catalog/card thumbnail, roughly 16:9. */
    thumbnail: CourseImage | null;
    /** Wide banner for the course page. */
    hero: CourseImage | null;
    /** Social preview — needs one absolute URL, 1200×630. Falls back to the site default. */
    og: string | null;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const COHORT_STATUSES = [
  "draft",
  "open",
  "full",
  "closed",
  "running",
  "completed",
] as const;
export type CohortStatus = (typeof COHORT_STATUSES)[number];

export interface CohortSession {
  n: number;
  /** Stored UTC, displayed IST. Never show a bare time (PRD §6.5). */
  startsAt: Date;
  durationMinutes: number;
}

export interface Cohort {
  id: string;
  courseSlug: string;
  name: string;
  sessions: CohortSession[];
  joiningLink: string | null;
  /** `null` = uncapped. A seat cap is something you opt into, never a prerequisite for selling. */
  seatsTotal: number | null;
  seatsTaken: number;
  enrolmentClosesAt: Date | null;
  status: CohortStatus;
}

/* --------------------------------- helpers --------------------------------- */

/**
 * Whether this particular batch can still be picked.
 *
 * ⚠️ THIS GATES A BATCH, NOT ENROLMENT. A published course always takes enrolments — dates
 * and batches are arranged over WhatsApp, so a course whose batch is not set up yet is
 * still selling, and the student is simply enrolled without one. An earlier version used
 * this as the gate on the whole checkout, which meant a live course with an unfinished
 * batch displayed "enrolment isn't open yet" and quietly took no money at all.
 *
 * ⚠️ ADVISORY ONLY. The seat is still claimed with a conditional update at payment time,
 * because between this check and that write somebody else can take the last one.
 */
export function isRegistrable(cohort: Cohort, now: Date = new Date()): boolean {
  if (cohort.status !== "open") return false;
  if (isFull(cohort)) return false;
  if (cohort.enrolmentClosesAt && cohort.enrolmentClosesAt <= now) return false;
  return true;
}

/** Uncapped batches are never full. */
export function isFull(cohort: Cohort): boolean {
  if (cohort.seatsTotal === null) return false;
  return cohort.seatsTaken >= cohort.seatsTotal;
}

/** `null` when uncapped — there is no number to show. */
export function seatsLeft(cohort: Cohort): number | null {
  if (cohort.seatsTotal === null) return null;
  return Math.max(0, cohort.seatsTotal - cohort.seatsTaken);
}

/**
 * ₹ from paise, without a stray `.00` on whole rupees.
 *
 * `en-IN` is deliberate: it groups as 2,49,900 the way an Indian buyer reads a price, not
 * 249,900.
 */
export function formatPrice(paise: number, currency: "INR" = "INR"): string {
  if (paise === 0) return "Free";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

const IST = "Asia/Kolkata";

/**
 * ⚠️ ALWAYS WITH THE TIMEZONE LABEL. A parent booking a Sunday class needs to know the time
 * is IST, and the server may well be running in UTC — so the zone is pinned here rather
 * than inherited from wherever this happens to execute.
 */
export function formatSessionDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: IST,
  }).format(date);
}

export function formatSessionTime(date: Date): string {
  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: IST,
  }).format(date);
  return `${time} IST`;
}

export function formatDateRange(sessions: CohortSession[]): string {
  if (!sessions.length) return "";
  const first = sessions[0].startsAt;
  const last = sessions[sessions.length - 1].startsAt;
  const fmt = (d: Date, withYear: boolean) =>
    new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      ...(withYear ? { year: "numeric" } : {}),
      timeZone: IST,
    }).format(d);
  return `${fmt(first, false)} – ${fmt(last, true)}`;
}

export interface ParsedScore {
  value: number;
  max: number;
  /** 0–100, for bar geometry. */
  pct: number;
  /** The original string, for display — "5/10" beats "50%" next to a test result. */
  label: string;
}

/**
 * Read `"5/10"` into something a bar can be drawn from.
 *
 * ⚠️ RETURNS `null` RATHER THAN GUESSING. The proof figures are free text in the database
 * so a course can express its result however it needs to ("Band 5 → Band 7", "C → A"), and
 * a chart drawn from a number that isn't there would be a chart of nothing. Callers fall
 * back to showing the strings.
 */
export function parseScore(input: string): ParsedScore | null {
  const match = input.trim().match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const value = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return null;

  return {
    value,
    max,
    pct: Math.max(0, Math.min(100, (value / max) * 100)),
    label: `${match[1]}/${match[2]}`,
  };
}

/** Days until the cohort starts. Negative once it has begun. */
export function daysUntil(date: Date, now: Date = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / 86_400_000);
}
