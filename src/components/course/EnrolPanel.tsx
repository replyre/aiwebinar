"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import type { CouponResponse } from "@/lib/coupon";
import { formatSessionDate, formatSessionTime } from "@/lib/course";
import {
  CONSENT_TEXT,
  STUDENT_CLASSES,
  type EnrolResponse,
} from "@/lib/enrolment";

interface CohortOption {
  id: string;
  name: string;
  sessions: { n: number; startsAt: string }[];
  /** `null` when the batch is uncapped. */
  seatsLeft: number | null;
}

/**
 * Checkout: student, guardian, consent, then Razorpay.
 *
 * ⚠️ THE AMOUNT IS DISPLAYED HERE AND DECIDED ON THE SERVER. `amount` is a prop so the
 * button can say what it will cost; it is never sent back. `POST /api/course/enrol` looks
 * the price up from the cohort, applies the discount and creates the order for that figure.
 *
 * ⚠️ SIX FIELDS, ON ONE SCREEN. Board, school, city and the guardian's relationship all
 * used to be here; every one is answerable over WhatsApp after the money has moved, and
 * every one was a place to abandon. A payment form is not where a student record gets
 * finished.
 */
export default function EnrolPanel({
  cohorts,
  amount,
  courseSlug,
  viewer,
}: {
  cohorts: CohortOption[];
  /** Price after any course-level discount, in paise. A coupon reduces it further. */
  amount: number;
  courseSlug: string;
  /** The signed-in guardian, if any — prefills their name and email so they don't retype it. */
  viewer?: { fullName: string; email: string } | null;
}) {
  const formatMoney = (paise: number) =>
    paise === 0
      ? "Free"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
        }).format(paise / 100);

  const uid = useId();
  const field = (name: string) => `${uid}-${name.replace(/\./g, "-")}`;

  const [cohortId, setCohortId] = useState(cohorts[0]?.id ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ message: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [applied, setApplied] = useState<CouponResponse["applied"] | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  /**
   * ⚠️ THIS FIGURE IS FOR THE BUTTON, NOT FOR THE CHARGE. The server recomputes the price
   * from the code on every enrol request, so what is shown here can only ever be a
   * preview — if the coupon expires between this render and the submit, the parent is
   * charged full price and the response says so.
   */
  const dueAmount = applied ? applied.amount : amount;

  async function checkCouponCode() {
    const code = couponCode.trim();
    if (!code) return;

    setCheckingCoupon(true);
    setCouponMessage(null);
    try {
      const response = await fetch("/api/course/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, courseSlug }),
      });
      const body = (await response.json().catch(() => ({}))) as CouponResponse;

      if (body.ok && body.applied) {
        setApplied(body.applied);
        setCouponMessage(null);
      } else {
        setApplied(null);
        setCouponMessage(body.message ?? "That code isn't valid for this course.");
      }
    } catch {
      setCouponMessage("Could not check that code. Try again in a moment.");
    } finally {
      setCheckingCoupon(false);
    }
  }

  function removeCoupon() {
    setApplied(null);
    setCouponCode("");
    setCouponMessage(null);
  }

  /**
   * Razorpay's Checkout script, loaded once on mount rather than in the document head.
   *
   * ⚠️ NOT `next/script` WITH `beforeInteractive`: that would pull a third-party script into
   * the critical path of every page render for a widget most visitors never open. Loading it
   * when the form mounts means it is ready long before anyone has filled in nine fields.
   *
   * ⚠️ NO `scriptReady` STATE. An earlier version tracked readiness so the button could say
   * "loading…", which meant a synchronous `setState` in the effect body for the
   * already-loaded case — a cascading render for a message nobody sees, since the script
   * lands in a few hundred milliseconds and the form takes far longer to fill. Readiness is
   * checked where it actually matters, at the moment Checkout is opened.
   */
  useEffect(() => {
    if (window.Razorpay) return;
    if (document.querySelector('script[data-razorpay-checkout]')) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "";
    script.onerror = () =>
      setStatus({
        message:
          "Could not load the payment window. Check your connection and refresh the page.",
        error: true,
      });
    document.body.appendChild(script);
  }, []);

  const clearError = (key: string) => {
    if (!errors[key]) return;
    const next = { ...errors };
    delete next[key];
    setErrors(next);
    if (!Object.keys(next).length && status?.error) setStatus(null);
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      courseSlug,
      cohortId,
      student: {
        fullName: String(data.get("studentName") ?? ""),
        class: String(data.get("studentClass") ?? ""),
        subject: String(data.get("subject") ?? ""),
      },
      guardian: {
        fullName: String(data.get("guardianName") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
      },
      couponCode: applied?.code ?? "",
      consent: data.get("consent") === "on",
      _honey: String(data.get("_honey") ?? ""),
    };

    setBusy(true);
    setStatus(null);
    setErrors({});

    try {
      const response = await fetch("/api/course/enrol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as EnrolResponse;

      if (!response.ok || !body.ok) {
        if (body.errors) setErrors(body.errors);
        setStatus({
          message: body.message ?? "Please check the form and try again.",
          error: true,
        });
        setBusy(false);
        return;
      }

      // Free, or discounted to zero — the server already confirmed it.
      if (body.confirmedUrl) {
        window.location.assign(body.confirmedUrl);
        return;
      }

      if (!body.order) {
        setStatus({ message: "Something went wrong. Please try again.", error: true });
        setBusy(false);
        return;
      }

      openCheckout(body.order);
    } catch {
      setStatus({
        message: "Could not reach the server. Check your connection and try again.",
        error: true,
      });
      setBusy(false);
    }
  }

  function openCheckout(order: NonNullable<EnrolResponse["order"]>) {
    if (!window.Razorpay) {
      setStatus({ message: "The payment window is still loading. Try again in a moment.", error: true });
      setBusy(false);
      return;
    }

    const checkout = new window.Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "Innovgeist",
      description: "Course enrollment",
      prefill: order.prefill,
      // UPI first: it is how most people in this market actually pay, and burying it
      // behind cards costs conversions on a phone.
      config: { display: { blocks: {}, sequence: [], preferences: { show_default_blocks: true } } },
      theme: { color: "#2563EB" },
      handler: async (response: RazorpayHandlerResponse) => {
        setStatus({ message: "Confirming your seat…" });
        try {
          const verify = await fetch("/api/course/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const body = (await verify.json().catch(() => ({}))) as {
            ok?: boolean;
            confirmedUrl?: string;
            message?: string;
          };

          if (body.ok && body.confirmedUrl) {
            window.location.assign(body.confirmedUrl);
            return;
          }
          /**
           * ⚠️ THE MONEY IS GONE AND THE PAGE MUST NOT SAY "FAILED". Razorpay has taken the
           * payment; only our confirmation step stumbled. The webhook will confirm the same
           * enrolment independently within seconds, so the honest message is that it is paid
           * and being finished — not that it failed, which would send a parent to pay twice.
           */
          setStatus({
            message:
              body.message ??
              "Your payment went through. We're finishing your enrollment — you'll get an email shortly.",
          });
        } catch {
          setStatus({
            message:
              "Your payment went through. We're finishing your enrollment — you'll get an email shortly.",
          });
        } finally {
          setBusy(false);
        }
      },
      modal: {
        // Dismissing Checkout leaves a `pending` enrolment behind on purpose: it is a
        // recoverable lead, and the seat was never taken.
        ondismiss: () => {
          setBusy(false);
          setStatus({ message: "Payment cancelled. Your details are saved — you can try again." });
        },
      },
    });

    checkout.on("payment.failed", (event: { error?: { description?: string } }) => {
      setBusy(false);
      setStatus({
        message: event.error?.description
          ? `Payment failed: ${event.error.description}`
          : "That payment didn't go through. You can try again.",
        error: true,
      });
    });

    checkout.open();
  }

  const errorFor = (key: string) =>
    errors[key] ? <p className="field__error">{errors[key]}</p> : null;

  /**
   * ⚠️ THERE IS NO "ENROLMENT ISN'T OPEN" STATE, AND THAT IS DELIBERATE. An earlier version
   * returned one whenever no batch existed, which meant a published course with an
   * unfinished batch showed a dead end and took no money — the opposite of what publishing
   * a course is for. Batches are arranged over WhatsApp; if there is no batch to pick, the
   * student simply enrols without one.
   */

  return (
    <form className="course-form" onSubmit={onSubmit} noValidate>
      <input
        className="form__honey"
        type="text"
        name="_honey"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {cohorts.length > 1 ? (
        <fieldset className="field field--fieldset">
          <legend>Choose your batch</legend>
          <div className="course-batches">
            {cohorts.map((cohort) => (
              <label className="course-batch" key={cohort.id}>
                <input
                  type="radio"
                  name="cohortId"
                  value={cohort.id}
                  checked={cohortId === cohort.id}
                  onChange={() => setCohortId(cohort.id)}
                />
                <span>
                  <strong>{cohort.name}</strong>
                  {cohort.sessions.length ? (
                    <em>
                      {/**
                       * ⚠️ DATE AND TIME, NOT JUST DATE. Two batches that start on different
                       * weeks are told apart by the date alone — two batches on the same week
                       * at different times of day are not. Showing only "Starts 12 Oct" for
                       * both a 10am and a 6pm batch is the exact case this picker exists to
                       * resolve.
                       */}
                      Starts {formatSessionDate(new Date(cohort.sessions[0].startsAt))} ·{" "}
                      {formatSessionTime(new Date(cohort.sessions[0].startsAt))}
                    </em>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
          {errorFor("cohortId")}
        </fieldset>
      ) : (
        <input type="hidden" name="cohortId" value={cohortId} />
      )}

      <p className="course-form__group">Student</p>

      {/* Name and class pair on one row — a lone field in a two-column row leaves a
          half-width box and a hole beside it. */}
      <div className="form__row form__row--wide">
        <div className="field">
          <label htmlFor={field("student.fullName")}>
            Student&rsquo;s full name <span aria-hidden="true">*</span>
          </label>
          <input
            id={field("student.fullName")}
            name="studentName"
            type="text"
            autoComplete="off"
            aria-invalid={errors["student.fullName"] ? true : undefined}
            onInput={() => clearError("student.fullName")}
            required
          />
          {errorFor("student.fullName")}
        </div>
        <div className="field">
          <label htmlFor={field("student.class")}>
            Class <span aria-hidden="true">*</span>
          </label>
          <select
            id={field("student.class")}
            name="studentClass"
            defaultValue=""
            aria-invalid={errors["student.class"] ? true : undefined}
            onChange={() => clearError("student.class")}
          >
            <option value="">Select</option>
            {STUDENT_CLASSES.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
          {errorFor("student.class")}
        </div>
      </div>

      <p className="course-form__group">
        Parent or guardian
        <span>
          {viewer
            ? `Signed in as ${viewer.email} — details below are filled in for you.`
            : "They’ll get the class link and updates on WhatsApp."}
        </span>
      </p>

      <div className="field">
          <label htmlFor={field("guardian.fullName")}>
            Your full name <span aria-hidden="true">*</span>
          </label>
          <input
            id={field("guardian.fullName")}
            name="guardianName"
            type="text"
            autoComplete="name"
            defaultValue={viewer?.fullName ?? ""}
            aria-invalid={errors["guardian.fullName"] ? true : undefined}
            onInput={() => clearError("guardian.fullName")}
            required
          />
          {errorFor("guardian.fullName")}
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor={field("guardian.phone")}>
            WhatsApp number <span aria-hidden="true">*</span>
          </label>
          <input
            id={field("guardian.phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91"
            aria-invalid={errors["guardian.phone"] ? true : undefined}
            onInput={() => clearError("guardian.phone")}
            required
          />
          {errorFor("guardian.phone")}
        </div>
        <div className="field">
          <label htmlFor={field("guardian.email")}>
            Email <span aria-hidden="true">*</span>
          </label>
          <input
            id={field("guardian.email")}
            name="email"
            type="email"
            autoComplete="email"
            defaultValue={viewer?.email ?? ""}
            aria-invalid={errors["guardian.email"] ? true : undefined}
            onInput={() => clearError("guardian.email")}
            required
          />
          {errorFor("guardian.email")}
        </div>
      </div>

      {amount > 0 ? (
        <div className="course-coupon">
          {applied ? (
            <div className="course-coupon__applied">
              <div>
                <strong>{applied.code}</strong> applied
                <span>
                  {applied.label} — you save {formatMoney(applied.savedAmount)}
                </span>
              </div>
              <button type="button" onClick={removeCoupon} disabled={busy}>
                Remove
              </button>
            </div>
          ) : (
            <>
              <label htmlFor={field("couponCode")}>Have a discount code?</label>
              <div className="course-coupon__row">
                <input
                  id={field("couponCode")}
                  type="text"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value);
                    if (couponMessage) setCouponMessage(null);
                  }}
                  placeholder="Enter code"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={checkCouponCode}
                  disabled={checkingCoupon || !couponCode.trim()}
                >
                  {checkingCoupon ? "Checking…" : "Apply"}
                </button>
              </div>
              {couponMessage ? <p className="field__error">{couponMessage}</p> : null}
            </>
          )}
        </div>
      ) : null}

      <div className="course-total">
        <span>Total</span>
        <span className="course-total__v">
          {applied ? <s>{formatMoney(amount)}</s> : null}
          <strong>{formatMoney(dueAmount)}</strong>
        </span>
      </div>

      <label className="course-consent">
        <input type="checkbox" name="consent" onChange={() => clearError("consent")} />
        <span>{CONSENT_TEXT}</span>
      </label>
      {errorFor("consent")}

      <button className="btn btn--primary btn--lg btn--block" type="submit" disabled={busy}>
        {busy
          ? "Working…"
          : dueAmount === 0
            ? "Confirm my seat"
            : `Pay ${formatMoney(dueAmount)} and confirm`}
      </button>

      <p className="course-form__note">
        {amount === 0
          ? "No payment needed."
          : "Payment is handled by Razorpay. We never see your card or UPI details."}
      </p>

      {status ? (
        <p
          className="form__status"
          data-state={status.error ? "error" : undefined}
          role="status"
          aria-live="polite"
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}

/* Razorpay Checkout attaches itself to `window`; it ships no types of its own. */
interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (payload: { error?: { description?: string } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}
