"use client";

import { useId, useState, type FormEvent } from "react";

/**
 * Offered on the confirmation page, once, to a guest who isn't signed in and has no account
 * yet. Name and email are already known — asking for them again here would be the exact
 * "finish building a student record at checkout" mistake the enrolment form avoids
 * (`enrolment.ts`). Just a password.
 */
export default function QuickAccountCreate({
  fullName,
  email,
}: {
  fullName: string;
  email: string;
}) {
  const uid = useId();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const password = String(new FormData(event.currentTarget).get("password") ?? "");

    setBusy(true);
    setMessage(null);
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
        setMessage(body.message ?? "Could not create your account. Please try again.");
        setBusy(false);
        return;
      }
      setDone(true);
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="enrolled__note">
        Saved — sign in anytime at <a href="/account">/account</a> with {email} to see this
        and any future enrollments.
      </p>
    );
  }

  return (
    <form className="course-form" onSubmit={onSubmit} noValidate>
      <label htmlFor={`${uid}-password`}>
        Set a password to track this enrollment — sign in anytime with <strong>{email}</strong>.
      </label>
      <div className="form__row">
        <input
          id={`${uid}-password`}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />
        <button className="btn btn--secondary" type="submit" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
      {message ? <p className="field__error">{message}</p> : null}
    </form>
  );
}
