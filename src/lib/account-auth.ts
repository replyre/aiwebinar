import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCOUNT_COOKIE = "innovgeist_account";
/** Low-stakes consumer login, not admin — thirty days rather than eight hours. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function secret(): string {
  return process.env.ACCOUNT_SESSION_SECRET ?? "";
}

export function accountAuthConfigured(): boolean {
  return Boolean(secret());
}

/**
 * `accountId.issuedAt.signature` — an HMAC-signed session token, same shape as
 * `admin-auth.ts`'s admin cookie, but carrying which account this is rather than a bare
 * timestamp, since more than one guardian can be signed in.
 *
 * ⚠️ A SEPARATE SECRET FROM `ADMIN_PASSWORD`. Guardian sessions and the admin session must
 * never be forgeable from one another's key.
 */
export function createAccountToken(accountId: string, now = Date.now()): string {
  const issued = String(Math.floor(now / 1000));
  const payload = `${accountId}.${issued}`;
  const signature = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

/** Returns the account id the token names, or `null` if it is missing, expired, or forged. */
export function verifyAccountToken(token: string | undefined, now = Date.now()): string | null {
  if (!token || !secret()) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [accountId, issued, signature] = parts;
  if (!accountId || !issued || !/^\d+$/.test(issued)) return null;

  const age = Math.floor(now / 1000) - Number(issued);
  if (age < 0 || age > MAX_AGE_SECONDS) return null;

  const payload = `${accountId}.${issued}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  if (actualBuffer.length !== expectedBuffer.length) return null;
  return timingSafeEqual(actualBuffer, expectedBuffer) ? accountId : null;
}

export const accountCookieMaxAge = MAX_AGE_SECONDS;
