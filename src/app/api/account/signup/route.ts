import { NextResponse } from "next/server";
import {
  accountAuthConfigured,
  accountCookieMaxAge,
  createAccountToken,
  ACCOUNT_COOKIE,
} from "@/lib/account-auth";
import { fieldErrors, signupSchema } from "@/lib/account";
import { createAccount } from "@/lib/accounts-server";
import { mongoConfigured } from "@/lib/mongodb";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Guardian sign-up. Creates the login identity only — existing purchases surface on the
 * dashboard by matching this email against `enrolments.guardian.email`, not by copying
 * anything here.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = clientIp(request);
  const { allowed, retryAfterSeconds } = rateLimit(`account-signup:${ip}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!allowed) {
    return NextResponse.json(
      { ok: false, message: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  if (!mongoConfigured || !accountAuthConfigured()) {
    if (!accountAuthConfigured()) console.error("[account] signup refused — ACCOUNT_SESSION_SECRET is not set");
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

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, errors: fieldErrors(parsed.error), message: "Please correct the highlighted fields." },
      { status: 400 },
    );
  }

  let account;
  try {
    account = await createAccount(parsed.data);
  } catch (error) {
    if (error instanceof Error && error.message === "email_taken") {
      return NextResponse.json(
        {
          ok: false,
          errors: { email: "An account already exists for this email — sign in instead." },
          message: "An account already exists for this email.",
        },
        { status: 409 },
      );
    }
    console.error("[account] signup failed", error);
    return NextResponse.json(
      { ok: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
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
