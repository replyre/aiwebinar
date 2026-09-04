import { NextResponse } from "next/server";
import { enquirySchema, type EnquiryResponse } from "@/lib/enquiry";
import { ensureEnquiryIndexes, getDb, mongoConfigured } from "@/lib/mongodb";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendEnquiryNotification } from "@/lib/notify";

/**
 * Where a "Book a discussion" enquiry lands.
 *
 * This replaces FormSubmit.co, which the static site posted to directly from the browser.
 * That arrangement emailed the enquiry and stored nothing — so a missed email was a lost
 * lead with no record anywhere, and the destination address sat in the page source for any
 * scraper to read. Both are fixed by the enquiry being written here first.
 *
 * ⚠️ THE DATABASE WRITE IS THE SUCCESS CONDITION, NOT THE EMAIL. Email is best-effort and
 * deliberately non-fatal: a Resend outage must not tell a principal their enquiry failed
 * when the row is already safely stored. The reverse — reporting success on a failed write
 * — is the one thing this must never do.
 */

/** Mongo's driver is not available on the edge runtime. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse<EnquiryResponse>> {
  const ip = clientIp(request);
  const { allowed, retryAfterSeconds } = rateLimit(`enquiry:${ip}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Malformed request." }, { status: 400 });
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? "");
      if (field && !errors[field]) errors[field] = issue.message;
    }
    return NextResponse.json(
      { ok: false, errors, message: "Please correct the highlighted fields." },
      { status: 400 },
    );
  }

  const { _honey, ...enquiry } = parsed.data;

  /**
   * ⚠️ ANSWER 200, STORE NOTHING. Telling a bot it was caught is how the next version of
   * that bot learns to leave the field alone; a plain success costs it nothing to believe
   * and costs us nothing to say. A human never sees this path — the input is
   * `aria-hidden` and off-screen.
   */
  if (_honey) {
    return NextResponse.json({ ok: true });
  }

  if (!mongoConfigured) {
    console.error("[enquiries] refused — MONGODB_URI is not set");
    return NextResponse.json(
      { ok: false, message: "Enquiries are temporarily unavailable. Please email support@innovgeist.com." },
      { status: 503 },
    );
  }

  try {
    const db = await getDb();
    await ensureEnquiryIndexes(db);
    await db.collection("enquiries").insertOne({
      ...enquiry,
      status: "new",
      createdAt: new Date(),
      // Kept for abuse investigation only, and never rendered back to anyone.
      meta: {
        ip,
        userAgent: request.headers.get("user-agent")?.slice(0, 400) ?? "",
      },
    });
  } catch (error) {
    // ⚠️ The reason goes to the server log, never to the response — an error string from a
    // driver leaks host names and collection names (PRD §9, "never expose internal errors").
    console.error("[enquiries] insert failed", error);
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please email support@innovgeist.com or call +91 81272 73162." },
      { status: 500 },
    );
  }

  // Stored. Everything past here is a bonus, and its failure is logged, not surfaced.
  await sendEnquiryNotification(enquiry).catch((error) => {
    console.error("[enquiries] notification failed (the enquiry is stored)", error);
  });

  return NextResponse.json({ ok: true });
}
