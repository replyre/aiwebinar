/**
 * A small fixed-window rate limiter, in process memory.
 *
 * ⚠️ IN-MEMORY MEANS PER-INSTANCE, and on a platform that runs several instances a
 * determined caller gets N× the quota. That is understood and accepted: this exists to stop
 * a script hammering the enquiry form, not to enforce a billing quota. When the course
 * checkout lands — where the limit protects money rather than an inbox — this moves to a
 * shared store and the interface here does not have to change.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export function rateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || now >= existing.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    // Opportunistic sweep: without it the map grows by one entry per unique IP,
    // forever, in a process that may live for days.
    if (windows.size > 5000) {
      for (const [k, w] of windows) if (now >= w.resetAt) windows.delete(k);
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= limit,
    retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * Best-effort client IP.
 *
 * ⚠️ `x-forwarded-for` IS CLIENT-CONTROLLABLE unless a proxy overwrites it, so this is a
 * throttling key and never an identity. The leftmost entry is the original client only when
 * every hop in front is trusted to rewrite it — true behind Vercel/Cloud Run, not true if
 * this is ever exposed directly.
 */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
