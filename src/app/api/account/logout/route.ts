import { NextResponse } from "next/server";
import { ACCOUNT_COOKIE } from "@/lib/account-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCOUNT_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
