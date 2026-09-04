import { NextResponse } from "next/server";
import {
  accountAuthConfigured,
  accountCookieMaxAge,
  createAccountToken,
  ACCOUNT_COOKIE,
} from "@/lib/account-auth";
import { loginSchema } from "@/lib/account";
import { verifyAccountCredentials } from "@/lib/accounts-server";
import { mongoConfigured } from "@/lib/mongodb";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * ⚠️ THROTTLED, AND THE ERROR NEVER SAYS WHICH FIELD WAS WRONG. Same message for "no such
 * account" and "wrong password" — telling them apart is how a login form becomes a way to
 * find out which emails have accounts.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Incorrect email or password.";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const { allowed, retryAfterSeconds } = rateLimit(`account-login:${ip}`, {
    limit: 8,
    windowMs: 15 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  if (!mongoConfigured || !accountAuthConfigured()) {
    if (!accountAuthConfigured()) console.error("[account] login refused — ACCOUNT_SESSION_SECRET is not set");
    return NextResponse.json(
      { ok: false, message: "Accounts are temporarily unavailable. Please try again later." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Malformed request." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: GENERIC_ERROR }, { status: 400 });
  }

  const account = await verifyAccountCredentials(parsed.data.email, parsed.data.password);
  if (!account) {
    return NextResponse.json({ ok: false, message: GENERIC_ERROR }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCOUNT_COOKIE, createAccountToken(account._id.toHexString()), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: accountCookieMaxAge,
    path: "/",
  });
  return response;
}
