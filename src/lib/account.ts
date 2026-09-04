import { z } from "zod";

/**
 * Guardian account credentials — signup and login.
 *
 * ⚠️ ONE ACCOUNT PER GUARDIAN, KEYED ON EMAIL. There is no separate `Guardian` collection
 * (PRD §8 guardian details live embedded per-enrolment); this account is purely a login
 * identity, and the dashboard finds what it bought by matching this email against
 * `enrolments.guardian.email` at read time. Signing up with the same email used at checkout
 * is what surfaces existing purchases — no migration step needed.
 */

const email = z
  .string()
  .trim()
  .min(1, "This field is required.")
  .max(200)
  .pipe(z.email("Enter a valid email address."))
  .transform((v) => v.toLowerCase());

/** No forgot-password flow yet, so this is the only way in — keep it easy to type twice. */
const password = z.string().min(8, "Use at least 8 characters.").max(200);

export const signupSchema = z.object({
  fullName: z.string().trim().min(1, "This field is required.").max(120),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "This field is required.").max(200),
});

export type SignupInput = z.output<typeof signupSchema>;
export type LoginInput = z.output<typeof loginSchema>;

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
