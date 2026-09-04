import "server-only";

import type { StoredEnquiry } from "@/lib/enquiry";
import { emailLayout, escapeHtml, sendMail } from "@/lib/mailer";

/**
 * The internal notification for a new B2B partnership enquiry.
 *
 * Goes to Innovgeist, not to the enquirer — `replyTo` is set to the enquirer so hitting
 * Reply in the inbox reaches them directly rather than reaching us.
 */

const TO = process.env.ENQUIRY_NOTIFY_EMAIL ?? "support@innovgeist.com";
const CC = process.env.ENQUIRY_NOTIFY_CC ?? "";

const ROWS: [label: string, key: keyof StoredEnquiry][] = [
  ["Institution", "institution"],
  ["Name", "name"],
  ["Role / designation", "role"],
  ["Email", "email"],
  ["Phone", "phone"],
  ["Approx. participants", "participants"],
  ["Programs of interest", "programs"],
  ["Preferred timeframe", "timeframe"],
  ["Message", "message"],
  ["Submitted from", "source"],
];

export async function sendEnquiryNotification(enquiry: StoredEnquiry): Promise<boolean> {
  const rows = ROWS.map(([label, key]) => {
    const raw = enquiry[key];
    const value = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "");
    return `<tr>
      <td style="padding:6px 14px 6px 0;color:#7E90A8;vertical-align:top;white-space:nowrap">${label}</td>
      <td style="padding:6px 0;color:#0F2847">${escapeHtml(value) || "—"}</td>
    </tr>`;
  }).join("");

  const text = ROWS.map(([label, key]) => {
    const raw = enquiry[key];
    const value = Array.isArray(raw) ? raw.join(", ") : String(raw ?? "");
    return `${label}: ${value || "—"}`;
  }).join("\n");

  return sendMail({
    to: TO,
    ...(CC ? { cc: CC } : {}),
    replyTo: enquiry.email,
    subject: `AI Education Partnership enquiry — ${enquiry.institution}`,
    html: emailLayout({
      heading: "New partnership enquiry",
      body: `<table role="presentation" cellpadding="0" cellspacing="0" style="font-size:15px">${rows}</table>`,
    }),
    text,
  });
}
