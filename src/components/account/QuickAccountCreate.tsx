"use client";

import { useId, useState, type FormEvent } from "react";

/**
 * Offered on the confirmation page, once, to a guest who isn't signed in and has no account
 * yet. Name and email are already known — asking for them again here would be the exact
 * "finish building a student record at checkout" mistake the enrolment form avoids
 * (`enrolment.ts`). Just a password.
 *
 * Rendered in two places, and the difference is entirely the caller's: inline on an unpaid
 * confirmation, where it is an offer that can be ignored, and inside `SetPasswordGate` on a
 * paid one, where it is the only thing on the page that can be touched. This component does
 * not know which — it owns the field and the request, nothing about whether it is skippable.
 */
export default function QuickAccountCreate({
  fullName,
  email,
  onCreated,
}: {
  fullName: string;
  email: string;
  /**
   * Told that the account now exists, so a wrapper can stop blocking. When it is passed,
   * the confirmation note below is *not* rendered — the wrapper unmounts this on the same
   * tick, and a note that flashes for one frame is worse than no note.
   */
  onCreated?: () => void;
}) {
  const uid = useId();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  /**
   * ⚠️ TRACKED SEPARATELY FROM `message` BECAUSE IT IS THE ONE ERROR WITH A WAY OUT — and
   * inside `SetPasswordGate`, the only one. "This email already has an account" cannot be
   * fixed by retyping the field, so the message is turned into a link to sign in rather
   * than left as a dead end in a box that does not close. It is a race: the page checked
   * `getAccountByEmail` before rendering, and something registered this address in between.
   */
  const [conflict, setConflict] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");

    setMessage(null);
    setConflict(false);

    /**
     * ⚠️ BOTH CHECKS RUN HERE, BEFORE THE REQUEST, AND NEITHER REPLACES THE SERVER'S.
     * `signupSchema` still enforces the length — this is not the gate, it is the difference
     * between "wrong" now and "wrong" after a round trip. The confirm field has no server
     * counterpart by design: it guards against a typo in a value nobody can read back, and
     * a typo is not something the API can detect.
     */
    if (password.length < 8) {
      setMessage("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setMessage("Both passwords must match.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/account/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };
      if (!response.ok || !body.ok) {
        setConflict(response.status === 409);
        setMessage(body.message ?? "Could not create your account. Please try again.");
        setBusy(false);
        return;
      }
      setDone(true);
      onCreated?.();
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (done && onCreated) return null;

  if (done) {
    return (
      <p className="enrolled__note">
        Saved — sign in anytime at <a href="/account">/account</a> with {email} to see this
        and any future enrollments.
      </p>
    );
  }

  return (
    <form className="course-form acct-set" onSubmit={onSubmit} noValidate>
      {/* Was the password field's own `<label>` when there was one field. With two, it is
          the form's intro and each field carries its own label instead. */}
      <p className="acct-set__intro">
        Set a password to track this enrollment — sign in anytime with <strong>{email}</strong>.
      </p>

      <div className="acct-set__field">
        <label htmlFor={`${uid}-password`}>Password</label>
        <input
          id={`${uid}-password`}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
      </div>

      <div className="acct-set__field">
        <label htmlFor={`${uid}-confirm`}>Confirm password</label>
        <input
          id={`${uid}-confirm`}
          name="confirm"
          type="password"
          /**
           * ⚠️ `new-password` ON BOTH, NOT `off`. It is what tells a password manager these
           * two boxes are one new credential, so it fills the pair and offers to save it
           * once. `off` on the second makes managers treat it as an unrelated field and
           * leave it empty after autofilling the first — which then fails the match check
           * on a form the guardian never typed in.
           */
          autoComplete="new-password"
          placeholder="Type it again"
          minLength={8}
          required
        />
      </div>

      {message ? (
        <p className="field__error acct-set__error">
          {conflict ? <a href="/account">{message}</a> : message}
        </p>
      ) : null}

      <button className="btn btn--primary acct-set__submit" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
