"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import {
  PROGRAM_OPTIONS,
  TIMEFRAME_OPTIONS,
  enquirySchema,
  type EnquiryResponse,
} from "@/lib/enquiry";

type Status = { message: string; state?: "error" } | null;

/**
 * The "Book a discussion" form, in both places it appears.
 *
 * `full` is the contact section; `compact` is the invitation modal, which drops the fields a
 * visitor interrupted mid-scroll will not fill in. One component rather than two, so the
 * validation, the honeypot and the submit handling cannot drift apart — and the pre-Next
 * version was one edit away from exactly that drift.
 *
 * ⚠️ IDS ARE GENERATED, NOT HARD-CODED. Both variants can be in the DOM at once, and two
 * elements sharing `id="f-email"` would point every `<label htmlFor>` at whichever came
 * first — so clicking a label inside the modal would focus a field on the page behind it.
 */
export default function EnquiryForm({
  variant = "full",
  source,
  onSubmitted,
}: {
  variant?: "full" | "compact";
  source: string;
  onSubmitted?: () => void;
}) {
  const uid = useId();
  const field = (name: string) => `${uid}-${name}`;

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>(null);
  const [sending, setSending] = useState(false);

  const compact = variant === "compact";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      institution: String(data.get("institution") ?? ""),
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      role: String(data.get("role") ?? ""),
      participants: String(data.get("participants") ?? ""),
      phone: String(data.get("phone") ?? ""),
      programs: data.getAll("programs").map(String),
      timeframe: String(data.get("timeframe") ?? ""),
      message: String(data.get("message") ?? ""),
      source,
      _honey: String(data.get("_honey") ?? ""),
    };

    // The same schema the route runs. This copy only decides where the red text goes.
    const parsed = enquirySchema.safeParse(payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setStatus({ message: "Please correct the highlighted fields.", state: "error" });
      const firstBad = Object.keys(next)[0];
      if (firstBad) {
        form.querySelector<HTMLInputElement>(`#${CSS.escape(field(firstBad))}`)?.focus();
      }
      return;
    }

    setErrors({});
    setStatus(null);
    setSending(true);

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as EnquiryResponse;

      if (!response.ok || !body.ok) {
        if (body.errors) setErrors(body.errors);
        throw new Error(body.message ?? "");
      }

      form.reset();
      setStatus({
        message: "Thank you — your request has been sent. We reply within two working days.",
      });
      onSubmitted?.();
    } catch (error) {
      setStatus({
        message:
          error instanceof Error && error.message
            ? error.message
            : "Something went wrong sending the form. Please email support@innovgeist.com or call +91 81272 73162.",
        state: "error",
      });
    } finally {
      setSending(false);
    }
  }

  const errorFor = (name: string) =>
    errors[name] ? (
      <p className="field__error" data-error-for={field(name)}>
        {errors[name]}
      </p>
    ) : null;

  return (
    <form
      className={`form${compact ? " form--compact" : ""}`}
      data-contact-form=""
      noValidate
      onSubmit={onSubmit}
      // Typing into a field clears its complaint. Holding the message until the next
      // submit means it argues with something the visitor has already fixed.
      //
      // ⚠️ THE STATUS BAND GOES WITH IT WHEN THE LAST ERROR CLEARS. Clearing only the
      // field left "Please correct the highlighted fields" sitting under a form with
      // nothing highlighted — the one line telling the visitor they are not done yet,
      // pointing at nothing. Only the error status is cleared; a success message is left
      // alone, since typing again after a successful send should not erase the receipt.
      onInput={(event) => {
        const name = (event.target as HTMLInputElement).name;
        if (!name || !errors[name]) return;
        // Computed here rather than inside a setState updater: an updater must be pure,
        // and React calls it twice in development to prove it.
        const remaining = { ...errors };
        delete remaining[name];
        setErrors(remaining);
        if (!Object.keys(remaining).length && status?.state === "error") setStatus(null);
      }}
    >
      {/* Spam honeypot: hidden from people, filled by bots. Not a real field. */}
      <input
        className="form__honey"
        type="text"
        name="_honey"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      <h3 className="form__title">Book a discussion</h3>
      <p className="form__sub">No commitment. We reply within two working days.</p>

      <PrimaryRow compact={compact}>
        <div className="field">
          <label htmlFor={field("institution")}>
            Institution <span aria-hidden="true">*</span>
          </label>
          <input
            id={field("institution")}
            name="institution"
            type="text"
            autoComplete="organization"
            aria-invalid={errors.institution ? true : undefined}
            required
          />
          {errorFor("institution")}
        </div>
        <div className="field">
          <label htmlFor={field("name")}>
            Your name <span aria-hidden="true">*</span>
          </label>
          <input
            id={field("name")}
            name="name"
            type="text"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            required
          />
          {errorFor("name")}
        </div>
      </PrimaryRow>

      {compact ? null : (
        <div className="form__row">
          <div className="field">
            <label htmlFor={field("role")}>Role / designation</label>
            <input
              id={field("role")}
              name="role"
              type="text"
              autoComplete="organization-title"
              placeholder="e.g. Principal, HOD, Dean"
            />
          </div>
          <div className="field">
            <label htmlFor={field("participants")}>Approx. participants</label>
            <input
              id={field("participants")}
              name="participants"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 150"
            />
          </div>
        </div>
      )}

      <div className="form__row">
        <div className="field">
          <label htmlFor={field("email")}>
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id={field("email")}
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            required
          />
          {errorFor("email")}
        </div>
        <div className="field">
          <label htmlFor={field("phone")}>Phone</label>
          <input
            id={field("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91"
          />
        </div>
      </div>

      {compact ? null : (
        <>
          <fieldset className="field field--fieldset">
            <legend>Programs of interest</legend>
            <div className="checks">
              {PROGRAM_OPTIONS.map((program) => (
                <label className="check" key={program}>
                  <input type="checkbox" name="programs" value={program} />
                  <span>{program}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="field">
            <label htmlFor={field("timeframe")}>Preferred timeframe</label>
            <select id={field("timeframe")} name="timeframe" defaultValue="">
              <option value="">Select a timeframe</option>
              {TIMEFRAME_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor={field("message")}>What would you like to achieve?</label>
            <textarea
              id={field("message")}
              name="message"
              rows={4}
              placeholder="Audience, goals, and anything specific to your institution."
            />
          </div>
        </>
      )}

      <button
        className={`btn btn--primary btn--block${compact ? "" : " btn--lg"}`}
        type="submit"
        disabled={sending}
      >
        {sending ? "Sending…" : "Send request"}
        {sending ? null : (
          <svg className="icon" aria-hidden="true" viewBox="0 0 24 24">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        )}
      </button>

      {compact ? null : (
        <p className="form__note">Your details are used only to respond to this enquiry.</p>
      )}

      <p
        className="form__status"
        data-form-status=""
        data-state={status?.state}
        role="status"
        aria-live="polite"
        hidden={!status}
      >
        {status?.message}
      </p>
    </form>
  );
}

/** The full form pairs institution and name on one row; the compact one stacks them. */
function PrimaryRow({ compact, children }: { compact: boolean; children: ReactNode }) {
  if (compact) return <>{children}</>;
  return <div className="form__row">{children}</div>;
}
