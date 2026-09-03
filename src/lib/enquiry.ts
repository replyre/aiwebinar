import { z } from "zod";

/**
 * The one definition of an enquiry, imported by the form AND by the route that stores it.
 *
 * ⚠️ SHARED, NOT DUPLICATED, AND THE SERVER STILL RE-VALIDATES. The client parse exists to
 * show errors next to the right field; it proves nothing, because anything can POST to the
 * route directly. `POST /api/enquiries` parses the body with this same schema before it
 * touches the database — one source of truth, two independent checks (PRD §9, "never trust
 * the client").
 */

/** Trim first, so a field of spaces fails `min(1)` instead of passing it. */
const text = (max: number) => z.string().trim().max(max);

export const PROGRAM_OPTIONS = [
  "AI for Students",
  "AI for Faculty",
  "AI for Graduate Students",
  "Institutional AI & automation",
] as const;

export const TIMEFRAME_OPTIONS = [
  "Within a month",
  "1–3 months",
  "Next academic term",
  "Still exploring",
] as const;

export const enquirySchema = z.object({
  institution: text(160).min(1, "This field is required."),
  name: text(120).min(1, "This field is required."),
  email: text(200).min(1, "This field is required.").pipe(
    z.email("Enter a valid email address."),
  ),
  role: text(120).optional().default(""),
  participants: text(40).optional().default(""),
  phone: text(40).optional().default(""),
  /**
   * ⚠️ NOT `z.enum(PROGRAM_OPTIONS)`. The checkbox labels are marketing copy and will be
   * reworded; a strict enum would start rejecting real enquiries the moment somebody edits
   * a label and forgets this file. Length-capped free text is the right trade here — this
   * value is stored and emailed, never used to make a decision.
   */
  programs: z.array(text(80)).max(PROGRAM_OPTIONS.length).optional().default([]),
  timeframe: text(60).optional().default(""),
  message: text(4000).optional().default(""),
  /** Which form it came from, for attribution. Not user-supplied in any meaningful sense. */
  source: text(60).optional().default("Contact section"),
  /** Honeypot. Any value at all means a bot; see the route. */
  _honey: z.string().max(200).optional().default(""),
});

export type EnquiryInput = z.input<typeof enquirySchema>;
export type Enquiry = z.output<typeof enquirySchema>;

/** An enquiry as it is stored and emailed: the honeypot is a gate, never a field. */
export type StoredEnquiry = Omit<Enquiry, "_honey">;

/** The shape both success and failure come back as, so the form has one thing to read. */
export interface EnquiryResponse {
  ok: boolean;
  /** Field-keyed messages for a 400; absent otherwise. */
  errors?: Record<string, string>;
  message?: string;
}
