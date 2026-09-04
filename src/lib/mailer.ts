import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outbound email, over plain SMTP.
 *
 * ⚠️ SMTP RATHER THAN A PROVIDER SDK, DELIBERATELY. Brevo's free tier is 300 mails/day,
 * which is the right size for a first cohort and costs nothing — but the reason to speak
 * SMTP to it rather than import its SDK is that SMTP is the one interface every provider
 * offers. Moving Brevo → Gmail → SES → anything becomes four environment variables, with no
 * code touched and nothing to re-test. An SDK would make the provider a dependency of the
 * application rather than of the deployment.
 *
 * ⚠️ THIS IS NOT THE PAYMENT RECEIPT. Razorpay issues that itself, and a receipt from a
 * payment processor carries more weight with a parent than one from us. What goes out from
 * here is the thing Razorpay has nowhere to put: which cohort, which four Sundays, what
 * happens next.
 *
 * Nothing here throws on missing config. A cohort confirmation must not fail because SMTP
 * is unset — the enrolment is already stored, and that is the record that matters.
 */

const HOST = process.env.SMTP_HOST ?? "";
const PORT = Number(process.env.SMTP_PORT ?? 587);
const USER = process.env.SMTP_USER ?? "";
const PASS = process.env.SMTP_PASS ?? "";
const FROM = process.env.MAIL_FROM ?? "";

export const mailerConfigured = Boolean(HOST && USER && PASS && FROM);

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    /**
     * ⚠️ `secure` IS ABOUT THE HANDSHAKE, NOT ABOUT WHETHER TLS HAPPENS. Port 465 opens the
     * connection already wrapped in TLS; 587 starts in clear and upgrades via STARTTLS.
     * Both are encrypted. Setting `secure: true` on 587 hangs until timeout with no useful
     * error, which is the single most common way an SMTP config "just doesn't work".
     */
    secure: PORT === 465,
    auth: { user: USER, pass: PASS },
    // A dead SMTP host must not hold a request open for the default two minutes.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transporter;
}

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  cc?: string;
}

/**
 * Send one message.
 *
 * Returns whether it went out rather than throwing, because every caller treats mail as
 * best-effort and the alternative is a try/catch at each one that all say the same thing.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  if (!mailerConfigured) {
    console.warn(
      `[mail] skipped "${mail.subject}" — SMTP_HOST/USER/PASS or MAIL_FROM is not set`,
    );
    return false;
  }

  try {
    await getTransporter().sendMail({
      from: FROM,
      to: mail.to,
      ...(mail.cc ? { cc: mail.cc } : {}),
      ...(mail.replyTo ? { replyTo: mail.replyTo } : {}),
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    return true;
  } catch (error) {
    // The reason goes to the server log and never to the visitor — an SMTP error string
    // carries the host and the username.
    console.error(`[mail] failed to send "${mail.subject}"`, error);
    return false;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * The shared shell every message renders inside.
 *
 * Table-based and inline-styled on purpose: Gmail strips `<style>` blocks, and Outlook's
 * rendering engine is Word. Flexbox and grid do not survive the trip.
 */
export function emailLayout(options: { heading: string; body: string }): string {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F6F9FD">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F9FD;padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E4EBF3;border-radius:16px">
        <tr><td style="padding:28px 28px 0">
          <p style="margin:0 0 18px;font:600 13px/1 system-ui,-apple-system,'Segoe UI',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#2563EB">Innovgeist</p>
          <h1 style="margin:0 0 16px;font:700 22px/1.3 system-ui,-apple-system,'Segoe UI',sans-serif;color:#0F2847">${options.heading}</h1>
        </td></tr>
        <tr><td style="padding:0 28px 28px;font:400 15px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif;color:#33475F">
          ${options.body}
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #E4EBF3;font:400 13px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif;color:#7E90A8">
          Innovgeist Technologies Pvt. Ltd. · Lucknow<br>
          <a href="mailto:support@innovgeist.com" style="color:#2563EB;text-decoration:none">support@innovgeist.com</a> · +91 81272 73162
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
