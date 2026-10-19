import { NextResponse, after } from "next/server";
import { getDb, mongoConfigured } from "@/lib/mongodb";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { JOIN_SOURCES, WEBINAR_PATH, type JoinSource, type WebinarLang } from "@/lib/webinar";

/**
 * Every "Join WhatsApp group" button lands here: count the click, then 302 to the invite.
 *
 * ⚠️ THE REDIRECT NEVER WAITS ON THE DATABASE. The log is written in `after()`, once the
 * response has gone; a slow or absent Mongo costs a missing row, never a parent left staring
 * at a spinner inside Instagram's browser. The tap is the conversion — the row only
 * describes it.
 *
 * ⚠️ NOTHING PERSONAL IS STORED. No IP, no user agent, no cookie: the button, the language
 * and the campaign tags, and that is all. Most of this audience is under 18, and under the
 * DPDP Act a count of anonymous taps is outside "personal data" in a way that a
 * fingerprint-able row would not be. The IP is read only for the in-memory rate limit and
 * is gone with the process.
 *
 * ⚠️ THE INVITE LINK IS AN ENV VAR, `WEBINAR_WHATSAPP_URL`. A WhatsApp group holds 1,024
 * people; when it fills, a new invite goes in on Vercel and every ad keeps working without
 * a deploy. Unset, the button returns the visitor to the page rather than to an error.
 */

/** Mongo's driver is not available on the edge runtime. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INVITE_PREFIXES = ["https://chat.whatsapp.com/", "https://whatsapp.com/channel/"];
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/**
 * The campaign tags of the page the tap came from.
 *
 * Read from `Referer` rather than threaded through every button's `href`: the page is static
 * HTML and the ad's query string only exists in the visitor's address bar. The site sends
 * `strict-origin-when-cross-origin`, which keeps the full URL on a same-origin hop like this.
 */
function campaignTags(request: Request): Partial<Record<(typeof UTM_KEYS)[number], string>> {
  const referer = request.headers.get("referer");
  if (!referer) return {};
  let params: URLSearchParams;
  try {
    params = new URL(referer).searchParams;
  } catch {
    return {};
  }
  const tags: Partial<Record<(typeof UTM_KEYS)[number], string>> = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) tags[key] = value.slice(0, 120);
  }
  return tags;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang: WebinarLang = url.searchParams.get("lang") === "en" ? "en" : "hi";
  const rawSrc = url.searchParams.get("src");
  const src: JoinSource | "unknown" = JOIN_SOURCES.includes(rawSrc as JoinSource)
    ? (rawSrc as JoinSource)
    : "unknown";

  const invite = process.env.WEBINAR_WHATSAPP_URL ?? "";
  if (!INVITE_PREFIXES.some((prefix) => invite.startsWith(prefix))) {
    console.error("[webinar/join] WEBINAR_WHATSAPP_URL is unset or not a WhatsApp invite link");
    return NextResponse.redirect(new URL(WEBINAR_PATH[lang], url), { status: 302 });
  }

  // A reload-happy thumb or a bot must not be able to inflate the counts; past the limit the
  // visitor is still sent on, only the row is skipped.
  const { allowed } = rateLimit(`webinar-join:${clientIp(request)}`, {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (allowed && mongoConfigured) {
    const utm = campaignTags(request);
    after(async () => {
      try {
        const db = await getDb();
        await db.collection("webinar_clicks").insertOne({ src, lang, ...utm, at: new Date() });
      } catch (error) {
        console.error("[webinar/join] click log failed", error);
      }
    });
  }

  const response = NextResponse.redirect(invite, { status: 302 });
  // Never cached anywhere — a swapped invite must take effect on the very next tap.
  response.headers.set("Cache-Control", "no-store");
  return response;
}
