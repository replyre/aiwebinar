import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import ScrollEffects from "@/components/site/ScrollEffects";
import { organizationJsonLd } from "@/lib/seo";
import "@/styles/site.css";
import "@/styles/course.css";
import "@/styles/admin.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiwebinar.innovgeist.com";

/**
 * ⚠️ SELF-HOSTED THROUGH `next/font`, NOT A `<link>` TO Google Fonts. The static site loaded
 * both families over the network with the `media="print"` onload trick — one extra
 * connection, one extra round trip, and a flash of fallback type on a 4G phone in Lucknow,
 * which is the actual audience. `next/font` inlines the `@font-face` and serves the files
 * from our own origin, so there is no third-party request at all.
 *
 * The `variable` names are what `styles/site.css` reads in `--font-head` / `--font-body`.
 * Change one here and the whole site silently falls back to Segoe UI.
 */
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-inter",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

const TITLE = "AI Education Partnership | Innovgeist Technologies Pvt. Ltd.";
const DESCRIPTION =
  "Innovgeist Technologies Pvt. Ltd. partners with educational institutions to deliver practical AI education, responsible AI literacy, and future-ready learning for students, faculty and graduate learners. DPIIT recognized startup.";
const SOCIAL_DESCRIPTION =
  "Preparing students, educators and institutions for the AI era through practical, responsible and industry-informed AI education.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/assets/img/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: "/assets/img/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Innovgeist Technologies Pvt. Ltd.",
    url: "/",
    title: TITLE,
    description: SOCIAL_DESCRIPTION,
    images: [
      {
        url: "/assets/img/og-image.png",
        width: 1200,
        height: 630,
        alt: "Innovgeist AI Education Partnership",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SOCIAL_DESCRIPTION,
    images: ["/assets/img/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F2847",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} js`}>
      <head>
        {/**
         * ⚠️ `js` IS IN THE SERVER MARKUP, AND THE `<noscript>` BELOW IS ITS OTHER HALF.
         *
         * `styles/site.css` hides every `[data-reveal]` element behind `.js`, so that content
         * which animates in is never invisible to somebody with JavaScript off. The static
         * site set that class from an inline script in `<head>`. Ported as-is, that breaks:
         * the script runs before hydration, React then finds a `className` on `<html>` that
         * does not match what it rendered, and the whole page stays blank behind the reveal
         * rule — with only a hydration warning to explain it.
         *
         * So the class ships in the HTML (no mismatch, no inline script) and the no-JS case
         * is handled where it belongs — in a stylesheet a browser without JavaScript will
         * apply and one with JavaScript will ignore. `!important` because `.js [data-reveal]`
         * is the more specific selector and this has to beat it outright.
         */}
        <noscript>
          <style>{`.js [data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          // Serialised from a constant we control — no user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd(SITE_URL)) }}
        />
      </head>
      <body>
        {children}
        <ScrollEffects />
      </body>
    </html>
  );
}
