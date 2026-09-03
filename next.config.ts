import type { NextConfig } from "next";

/**
 * Security headers are a PRD Section 9 requirement, and they belong here rather than in a
 * middleware: these are static for every response, and `headers()` costs nothing at runtime
 * whereas a middleware runs on every request to do the same thing.
 *
 * No `Content-Security-Policy` yet — the site still carries three inline `<script>` blocks
 * (JSON-LD, the `.js` class flag, and Next's own bootstrap), so a meaningful CSP needs
 * nonces threaded through `layout.tsx` first. Shipping a permissive `unsafe-inline` policy
 * would be worse than none: it reads as protection while providing none.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
