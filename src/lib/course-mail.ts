import "server-only";

import { formatPrice, formatSessionDate, formatSessionTime } from "@/lib/course";
import { getCohortById, getPublishedCourse } from "@/lib/courses-server";
import type { EnrolmentDoc } from "@/lib/enrolments-server";
import { emailLayout, escapeHtml, sendMail } from "@/lib/mailer";

/**
 * The "you're in" email.
 *
 * ⚠️ THIS IS NOT A RECEIPT AND MUST NOT READ LIKE ONE. Razorpay already sends the receipt,
 * and a payment processor's receipt is more credible to a parent than ours. What Razorpay
 * has nowhere to put is the thing that actually matters: which batch, which four Sundays,
 * and what happens next. That is the whole job of this message.
 *
 * ⚠️ IT PROMISES WHATSAPP, NOT A LINK, WHEN THERE IS NO LINK. Cohort joining links are set
 * by hand and go out over WhatsApp, so a cohort can legitimately open for enrolment before
 * one exists. Saying "your link is below" and then showing nothing is the one outcome worth
 * engineering against.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aiwebinar.innovgeist.com";

export async function sendEnrolmentConfirmation(enrolment: EnrolmentDoc): Promise<boolean> {
  const [course, cohort] = await Promise.all([
    getPublishedCourse(enrolment.courseSlug),
    enrolment.cohortId ? getCohortById(enrolment.cohortId) : null,
  ]);

  const courseTitle = course?.title ?? "your course";
  const studentName = enrolment.student.fullName;
  const confirmUrl = `${SITE_URL.replace(/\/+$/, "")}/course/enrolled/${enrolment.reference}`;

  const dated = (cohort?.sessions ?? []).filter((s) => s.startsAt);

  const scheduleRows = dated.length
    ? dated
        .map(
          (s) => `<tr>
            <td style="padding:6px 14px 6px 0;color:#7E90A8;white-space:nowrap">Week ${s.n}</td>
            <td style="padding:6px 0;color:#0F2847;font-weight:600">${escapeHtml(
              formatSessionDate(s.startsAt),
            )} · ${escapeHtml(formatSessionTime(s.startsAt))}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="2" style="padding:6px 0;color:#33475F">
         We'll confirm the exact dates on WhatsApp shortly.
       </td></tr>`;

  const joiningBlock = cohort?.joiningLink
    ? `<p style="margin:0 0 18px">Your class link: <a href="${escapeHtml(
        cohort.joiningLink,
      )}" style="color:#2563EB">${escapeHtml(cohort.joiningLink)}</a></p>`
    : `<p style="margin:0 0 18px;padding:12px 14px;background:#F6F9FD;border-radius:10px">
         <strong style="color:#0F2847">Your class link comes on WhatsApp.</strong><br>
         We'll send it to <strong>${escapeHtml(enrolment.guardian.phone)}</strong> before the first
         session, along with a reminder.
       </p>`;

  const body = `
    <p style="margin:0 0 18px"><strong style="color:#0F2847">${escapeHtml(
      studentName,
    )}</strong> has a confirmed seat on <strong style="color:#0F2847">${escapeHtml(
      courseTitle,
    )}</strong>${cohort ? ` — ${escapeHtml(cohort.name)}` : ""}.</p>

    <p style="margin:0 0 10px;font-weight:600;color:#0F2847">Your four Sundays</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;font-size:15px">
      ${scheduleRows}
    </table>

    ${joiningBlock}

    <p style="margin:0 0 10px;font-weight:600;color:#0F2847">Before the first class</p>
    <ul style="margin:0 0 20px;padding-left:20px">
      <li style="margin-bottom:6px">Have a laptop or phone with internet ready.</li>
      <li style="margin-bottom:6px">Keep the syllabus or textbook for one subject handy — in Week 1 ${escapeHtml(
        studentName,
      )} picks the subject to work on for all four weeks.</li>
      <li>Nothing to install and no prior AI knowledge needed.</li>
    </ul>

    <p style="margin:0 0 22px">
      <a href="${confirmUrl}" style="display:inline-block;padding:12px 20px;background:#2563EB;color:#FFFFFF;border-radius:12px;text-decoration:none;font-weight:600">
        View your enrollment
      </a>
    </p>

    <p style="margin:0;color:#7E90A8;font-size:13px">
      Amount paid: ${escapeHtml(formatPrice(enrolment.payment.amount))} ·
      Reference: ${escapeHtml(enrolment.reference.slice(0, 8))}<br>
      Razorpay emails the payment receipt separately.
    </p>`;

  const text = [
    `${studentName} has a confirmed seat on ${courseTitle}${cohort ? ` — ${cohort.name}` : ""}.`,
    "",
    "Your four Sundays:",
    ...(dated.length
      ? dated.map((s) => `  Week ${s.n}: ${formatSessionDate(s.startsAt)} · ${formatSessionTime(s.startsAt)}`)
      : ["  We'll confirm the exact dates on WhatsApp shortly."]),
    "",
    cohort?.joiningLink
      ? `Class link: ${cohort.joiningLink}`
      : `Your class link comes on WhatsApp, to ${enrolment.guardian.phone}, before the first session.`,
    "",
    "Before the first class: a laptop or phone with internet, and the syllabus for one subject.",
    "",
    `View your enrollment: ${confirmUrl}`,
    "",
    `Amount paid: ${formatPrice(enrolment.payment.amount)} · Reference: ${enrolment.reference.slice(0, 8)}`,
    "Razorpay emails the payment receipt separately.",
    "",
    "Innovgeist Technologies Pvt. Ltd. · support@innovgeist.com · +91 81272 73162",
  ].join("\n");

  return sendMail({
    to: enrolment.guardian.email,
    subject: `${studentName} is enrolled — ${courseTitle}`,
    html: emailLayout({ heading: "You're in. Here's what happens next.", body }),
    text,
  });
}
