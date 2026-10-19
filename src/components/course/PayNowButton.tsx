"use client";

import { useEffect, useState } from "react";

/**
 * Resume a `pending` or `failed` payment against the same enrolment — used on the
 * confirmation page, the course page's "you have an unfinished enrolment" state, and the
 * account dashboard. All three just need a reference and a button.
 */
export default function PayNowButton({
  reference,
  label = "Complete payment",
}: {
  reference: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    if (window.Razorpay) return;
    const existing = document.querySelector<HTMLScriptElement>("script[data-razorpay-checkout]");
    if (existing) {
      existing.addEventListener("error", () => setScriptFailed(true));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "";
    script.onerror = () => setScriptFailed(true);
    document.body.appendChild(script);
  }, []);

  /** Poll briefly for `window.Razorpay` rather than failing on the first click — the script
   *  usually only needs another moment, not a retry, on a normal connection. */
  async function waitForRazorpay(timeoutMs = 5000): Promise<boolean> {
    const start = Date.now();
    while (!window.Razorpay) {
      if (Date.now() - start > timeoutMs) return false;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    return true;
  }

  async function onClick() {
    setBusy(true);
    setMessage(null);

    try {
      const response = await fetch("/api/course/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        confirmedUrl?: string;
        order?: {
          orderId: string;
          amount: number;
          currency: string;
          keyId: string;
          prefill: { name: string; email: string; contact: string };
        };
      };

      if (!response.ok || !body.ok) {
        setMessage(body.message ?? "Could not start the payment. Please try again.");
        setBusy(false);
        return;
      }

      if (body.confirmedUrl) {
        window.location.assign(body.confirmedUrl);
        return;
      }

      if (!body.order) {
        setMessage("Could not start the payment. Please try again.");
        setBusy(false);
        return;
      }

      if (!window.Razorpay) {
        const ready = await waitForRazorpay();
        if (!ready) {
          setMessage(
            scriptFailed
              ? "Could not load the payment window. Check your connection and refresh the page."
              : "The payment window is taking longer than usual to load. Please refresh the page and try again.",
          );
          setBusy(false);
          return;
        }
      }

      const RazorpayCheckout = window.Razorpay;
      if (!RazorpayCheckout) {
        setMessage("Could not load the payment window. Check your connection and refresh the page.");
        setBusy(false);
        return;
      }

      const checkout = new RazorpayCheckout({
        key: body.order.keyId,
        order_id: body.order.orderId,
        amount: body.order.amount,
        currency: body.order.currency,
        name: "Innovgeist",
        description: "Course enrollment",
        prefill: body.order.prefill,
        theme: { color: "#2563EB" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setMessage("Confirming your seat…");
          try {
            const verify = await fetch("/api/course/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyBody = (await verify.json().catch(() => ({}))) as {
              ok?: boolean;
              confirmedUrl?: string;
            };
            if (verifyBody.ok && verifyBody.confirmedUrl) {
              window.location.assign(verifyBody.confirmedUrl);
              return;
            }
            setMessage(
              "Your payment went through. We're finishing your enrollment — refresh in a moment.",
            );
          } catch {
            setMessage(
              "Your payment went through. We're finishing your enrollment — refresh in a moment.",
            );
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setMessage("Payment cancelled. You can try again anytime.");
          },
        },
      });

      checkout.on("payment.failed", (event: { error?: { description?: string } }) => {
        setBusy(false);
        setMessage(
          event.error?.description
            ? `Payment failed: ${event.error.description}`
            : "That payment didn't go through. You can try again.",
        );
      });

      checkout.open();
    } catch {
      setMessage("Could not reach the server. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <>
      <button className="btn btn--primary btn--block" type="button" onClick={onClick} disabled={busy}>
        {busy ? "Working…" : label}
      </button>
      {message ? (
        <p className="form__status" data-state="error" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </>
  );
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
