import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "innovgeist_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8;

function secret(): string {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function adminConfigured(): boolean {
  return Boolean(secret());
}

export function createAdminToken(now = Date.now()): string {
  const value = String(Math.floor(now / 1000));
  const signature = createHmac("sha256", secret()).update(value).digest("hex");
  return `${value}.${signature}`;
}

export function isAdminTokenValid(token: string | undefined, now = Date.now()): boolean {
  if (!token || !secret()) return false;
  const [issued, signature] = token.split(".");
  if (!issued || !signature || !/^\d+$/.test(issued)) return false;
  const age = Math.floor(now / 1000) - Number(issued);
  if (age < 0 || age > MAX_AGE_SECONDS) return false;
  const expected = createHmac("sha256", secret()).update(issued).digest("hex");
  const actualBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function passwordMatches(password: string): boolean {
  const configured = secret();
  if (!configured || password.length !== configured.length) return false;
  return timingSafeEqual(Buffer.from(password), Buffer.from(configured));
}

export const adminCookieMaxAge = MAX_AGE_SECONDS;