import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  adminConfigured,
  adminCookieMaxAge,
  createAdminToken,
  isAdminTokenValid,
  passwordMatches,
} from "@/lib/admin-auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Admin sign-in and sign-out.
 *
 * ⚠️ THROTTLED HARD. One shared password with no lockout is a password that gets guessed
 * eventually; five attempts per fifteen minutes per IP makes an online attack impractical
 * without inconveniencing somebody who mistyped.
 *
 * ⚠️ THE COOKIE IS `httpOnly` AND `sameSite: strict`. httpOnly keeps it out of reach of any
 * script on the page, and strict means it is not sent on cross-site requests at all — which
 * is what stands in for CSRF tokens on the mutating routes behind it.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.match(new RegExp(`${ADMIN_COOKIE}=([^;]+)`))?.[1];

  return NextResponse.json({
    signedIn: isAdminTokenValid(cookie),
    configured: adminConfigured(),
  });
}

export async function POST(request: Request) {
  let body: { action?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (body.action === "logout") {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  const ip = clientIp(request);
  const { allowed, retryAfterSeconds } = rateLimit(`admin-login:${ip}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  if (!adminConfigured()) {
    console.error("[admin] sign-in refused — ADMIN_PASSWORD is not set");
    return NextResponse.json(
      { error: "Admin access is not configured on this deployment." },
      { status: 503 },
    );
  }

  if (!passwordMatches(String(body.password ?? ""))) {
    console.warn(`[admin] failed sign-in from ${ip}`);
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, createAdminToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: adminCookieMaxAge,
    path: "/",
  });
  return response;
}
