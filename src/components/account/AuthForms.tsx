"use client";

import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";

/**
 * Sign in / sign up, toggled in place.
 *
 * ⚠️ NO FORGOT-PASSWORD FLOW. Deliberately — the account is a convenience on top of a
 * guest-checkout platform, not the primary way to reach support. Losing the password means
 * contacting Innovgeist directly, same as losing the confirmation email does today.
 */
export default function AuthForms() {
  const router = useRouter();
  const uid = useId();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const payload =
      mode === "signup"
        ? {
            fullName: String(data.get("fullName") ?? ""),
            email: String(data.get("email") ?? ""),
            password: String(data.get("password") ?? ""),
          }
        : {
            email: String(data.get("email") ?? ""),
            password: String(data.get("password") ?? ""),
          };

    setBusy(true);
    setMessage(null);
    setErrors({});

    try {
      const response = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        errors?: Record<string, string>;
      };

      if (!response.ok || !body.ok) {
        if (body.errors) setErrors(body.errors);
        setMessage(body.message ?? "Please check the form and try again.");
        setBusy(false);
        return;
      }

      router.push("/account/dashboard");
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  const errorFor = (key: string) =>
    errors[key] ? <p className="field__error">{errors[key]}</p> : null;

  return (
    <>
      {/**
       * ⚠️ A SEGMENTED CONTROL, NOT TWO BUTTONS. Two primary/ghost buttons side by side read
       * as "do this, or do that" — an action pair — so people click one expecting to have
       * submitted something. A single track with a moving thumb reads as a state, which is
       * what this is: the same form, asking for one more field.
       */}
      <div className="auth-switch" role="tablist" aria-label="Sign in or create an account">
        {(
          [
            ["login", "Sign in"],
            ["signup", "Create account"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={`auth-switch__btn${mode === value ? " is-active" : ""}`}
            onClick={() => {
              setMode(value);
              setErrors({});
              setMessage(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="course-form auth-form" onSubmit={onSubmit} noValidate>
        {mode === "signup" ? (
          <div className="field">
            <label htmlFor={`${uid}-fullName`}>
              Your full name <span aria-hidden="true">*</span>
            </label>
            <input id={`${uid}-fullName`} name="fullName" type="text" autoComplete="name" required />
            {errorFor("fullName")}
          </div>
        ) : null}

        <div className="field">
          <label htmlFor={`${uid}-email`}>
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            required
          />
          {errorFor("email")}
        </div>

        <div className="field">
          <label htmlFor={`${uid}-password`}>
            Password <span aria-hidden="true">*</span>
          </label>
          <input
            id={`${uid}-password`}
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            aria-invalid={errors.password ? true : undefined}
            minLength={mode === "signup" ? 8 : undefined}
            required
          />
          {errorFor("password")}
        </div>

        <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={busy}>
          {busy ? "Working…" : mode === "signup" ? "Create account" : "Sign in"}
        </button>

        {mode === "signup" ? (
          <p className="course-form__note">
            Use the same email you paid with and your enrolments will be waiting.
          </p>
        ) : null}

        {message ? (
          <p className="form__status" data-state="error" role="status" aria-live="polite">
            {message}
          </p>
        ) : null}
      </form>
    </>
  );
}
