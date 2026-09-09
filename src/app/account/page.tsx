import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SiteFooter from "@/components/site/SiteFooter";
import AuthForms from "@/components/account/AuthForms";
import { ACCOUNT_COOKIE, verifyAccountToken } from "@/lib/account-auth";
import { getAccountById } from "@/lib/accounts-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in | Innovgeist",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const token = (await cookies()).get(ACCOUNT_COOKIE)?.value;
  const accountId = verifyAccountToken(token);
  /**
   * ⚠️ THE TOKEN'S SIGNATURE BEING VALID IS NOT ENOUGH — the account it names might no
   * longer exist (deleted, or a stale cookie from a wiped dev database). `/account/dashboard`
   * checks both and bounces back here on a missing account; checking only the signature here
   * would send that visitor straight back to dashboard, which sends them straight back here —
   * an infinite redirect loop between the two pages.
   */
  if (accountId && (await getAccountById(accountId))) redirect("/account/dashboard");

  return (
    <>
      <header className="course-bar">
        <div className="container course-bar__inner">
          <Link className="course-bar__brand" href="/" aria-label="Innovgeist — home">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size logo. */}
            <img
              src="/assets/img/innovgeist-logo.png"
              srcSet="/assets/img/innovgeist-logo.png 1x, /assets/img/innovgeist-logo@2x.png 2x"
              alt="Innovgeist"
              width="150"
              height="25"
              decoding="async"
            />
          </Link>
        </div>
      </header>

      <main id="main" className="section">
        <div className="container enrolled enrolled--narrow">
          <div className="enrolled__head">
            <p className="eyebrow">My account</p>
            <h1 className="section__title">See what you&rsquo;ve enrolled in.</h1>
            <p className="section__lede">
              Sign in to see your courses and class schedule, or create an account with the
              email you used at checkout.
            </p>
          </div>

          <AuthForms />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
