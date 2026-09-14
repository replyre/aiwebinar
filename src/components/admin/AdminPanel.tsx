"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The admin panel: courses, batches, discount codes and enrolments.
 *
 * ⚠️ THIS REPLACED A PANEL THAT COULD PUBLISH ONE HARD-CODED SLUG. Everything here is driven
 * by what the database returns, so a second course appears without a code change — which is
 * the whole premise of the data model (PRD §8).
 *
 * ⚠️ IT ASKS FOR RUPEES AND NEVER SHOWS PAISE. Paise are how the database and Razorpay count;
 * they are not how anyone thinks about a price. The conversion happens once, in the API
 * route, so no screen here can drift by a factor of a hundred.
 */

type Tab = "courses" | "batches" | "codes" | "enrolled" | "checkouts";

interface CourseRow {
  slug: string;
  title: string;
  status: "draft" | "published" | "archived";
  listAmount: number;
  discountType: string;
  discountValue: number;
  discountLabel: string;
  cohortCount: number;
  enrolmentCount: number;
}

interface CohortRow {
  id: string;
  courseSlug: string;
  name: string;
  sessions: { n: number; startsAt: string | null; durationMinutes: number }[];
  joiningLink: string | null;
  seatsTotal: number | null;
  seatsTaken: number;
  status: string;
  unlisted: boolean;
  confirmedCount: number;
  overflowCount: number;
}

interface CouponRow {
  code: string;
  type: "percentage" | "fixed" | "flat_price";
  value: number;
  label: string;
  active: boolean;
  maxUses: number | null;
  usesCount: number;
  courseSlugs: string[] | null;
  cohortId: string | null;
}

interface EnrolmentRow {
  id: string;
  reference: string;
  courseSlug: string;
  /** Batch the student is attached to, or "" when none. Grouping keys on this. */
  cohortId: string;
  studentName: string;
  studentClass: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  amount: number;
  couponCode: string | null;
  paymentStatus: string;
  status: string;
  placement: "unassigned" | "assigned" | "overflow";
  cohortName: string | null;
  createdAt: string;
}

interface AdminData {
  courses: CourseRow[];
  cohorts: CohortRow[];
  coupons: CouponRow[];
  enrolments: EnrolmentRow[];
}

const rupees = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paise / 100);

/**
 * A UTC instant as the string `<input type="datetime-local">` expects.
 *
 * ⚠️ NOT `toISOString().slice(0,16)` — that renders the UTC clock time, so an 11:00 IST class
 * shows as 05:30 in the box, and saving it moves the class. The parts are read in
 * `Asia/Kolkata` so the field shows the time the class actually starts.
 */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

/** The inverse: a local IST wall-clock string back to a UTC instant. */
function fromLocalInput(value: string): string {
  if (!value) return "";
  // IST is UTC+5:30 year-round — India has no daylight saving, so a fixed offset is
  // correct here in a way it would not be for most timezones.
  return `${value}:00+05:30`;
}

export default function AdminPanel() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("courses");
  const [data, setData] = useState<AdminData | null>(null);
  const [note, setNote] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/data", { credentials: "include" });
    if (response.ok) {
      setData((await response.json()) as AdminData);
      setSignedIn(true);
    } else if (response.status === 401) {
      setSignedIn(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/admin/session", { credentials: "include" });
      const body = (await response.json().catch(() => ({}))) as {
        signedIn?: boolean;
        configured?: boolean;
      };
      setConfigured(body.configured ?? false);
      if (body.signedIn) await load();
      else setSignedIn(false);
    })();
  }, [load]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNote(null);
    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", password }),
    });
    setBusy(false);
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      setNote({ text: body.error ?? "Could not sign in.", error: true });
      return;
    }
    setPassword("");
    await load();
  }

  async function signOut() {
    await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    setSignedIn(false);
    setData(null);
  }

  /** Every mutation goes through here, so one place reloads and one place reports. */
  async function act(payload: Record<string, unknown>, success: string) {
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/admin/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setNote({ text: body.error ?? "That didn't work.", error: true });
        return false;
      }
      await load();
      setNote({ text: success });
      return true;
    } catch {
      setNote({ text: "Could not reach the server.", error: true });
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (signedIn === null) {
    return <div className="admin-shell admin-shell--center">Loading…</div>;
  }

  if (!signedIn) {
    return (
      <div className="admin-shell admin-shell--center">
        <form className="admin-login" onSubmit={signIn}>
          <h1>Innovgeist admin</h1>
          {configured ? (
            <>
              <label htmlFor="admin-password">Password</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                autoFocus
              />
              <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
                {busy ? "Checking…" : "Sign in"}
              </button>
            </>
          ) : (
            <p className="admin-note admin-note--error">
              <code>ADMIN_PASSWORD</code> isn&rsquo;t set on this deployment. Add it to{" "}
              <code>.env.local</code> and restart.
            </p>
          )}
          {note ? (
            <p className={`admin-note${note.error ? " admin-note--error" : ""}`}>{note.text}</p>
          ) : null}
        </form>
      </div>
    );
  }

  /**
   * ⚠️ THE TWO LISTS ARE COUNTED FROM DIFFERENT SETS ON PURPOSE. "Enrolled" is students —
   * only people whose money actually arrived. "Checkouts" is everything that started at
   * the payment step and did not finish. A single number over both would answer neither
   * "how many students do I have" nor "how many people do I need to chase".
   */
  const enrolled = data?.enrolments.filter((r) => r.status === "confirmed") ?? [];
  const checkouts = data?.enrolments.filter((r) => r.status !== "confirmed") ?? [];

  const tabs: [Tab, string, number][] = [
    ["courses", "Courses", data?.courses.length ?? 0],
    ["batches", "Batches", data?.cohorts.length ?? 0],
    ["codes", "Discount codes", data?.coupons.length ?? 0],
    ["enrolled", "Enrolled", enrolled.length],
    ["checkouts", "Checkouts", checkouts.length],
  ];

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div>
          <p className="admin-top__k">Innovgeist</p>
          <h1>Admin</h1>
        </div>
        <button className="btn btn--ghost btn--sm" type="button" onClick={signOut}>
          Sign out
        </button>
      </header>

      <nav className="admin-tabs">
        {tabs.map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            className={`admin-tab${tab === key ? " is-active" : ""}`}
            onClick={() => setTab(key)}
          >
            {label}
            <span>{count}</span>
          </button>
        ))}
      </nav>

      {note ? (
        <p className={`admin-note${note.error ? " admin-note--error" : ""}`}>{note.text}</p>
      ) : null}

      {tab === "courses" ? (
        <CoursesTab courses={data?.courses ?? []} act={act} busy={busy} />
      ) : null}
      {tab === "batches" ? (
        <BatchesTab
          cohorts={data?.cohorts ?? []}
          courses={data?.courses ?? []}
          act={act}
          busy={busy}
        />
      ) : null}
      {tab === "codes" ? (
        <CodesTab
          coupons={data?.coupons ?? []}
          courses={data?.courses ?? []}
          cohorts={data?.cohorts ?? []}
          act={act}
          busy={busy}
        />
      ) : null}
      {tab === "enrolled" ? (
        <EnrolledTab rows={enrolled} cohorts={data?.cohorts ?? []} act={act} busy={busy} />
      ) : null}
      {tab === "checkouts" ? (
        <CheckoutsTab rows={checkouts} cohorts={data?.cohorts ?? []} act={act} busy={busy} />
      ) : null}
    </div>
  );
}

type Act = (payload: Record<string, unknown>, success: string) => Promise<boolean>;

/* --------------------------------- courses --------------------------------- */

function CoursesTab({ courses, act, busy }: { courses: CourseRow[]; act: Act; busy: boolean }) {
  if (!courses.length) {
    return <p className="admin-empty">No courses yet. Run <code>node scripts/seed-course.mjs</code>.</p>;
  }

  return (
    <div className="admin-cards">
      {courses.map((course) => (
        <CourseCard key={course.slug} course={course} act={act} busy={busy} />
      ))}
    </div>
  );
}

function CourseCard({ course, act, busy }: { course: CourseRow; act: Act; busy: boolean }) {
  const [listRupees, setListRupees] = useState(String(course.listAmount / 100));

  const live = course.status === "published";

  return (
    <section className="admin-card">
      <div className="admin-card__head">
        <div>
          <h2>{course.title}</h2>
          <p className="admin-card__slug">
            /course/{course.slug}
            {live ? (
              <a href={`/course/${course.slug}`} target="_blank" rel="noopener noreferrer">
                view
              </a>
            ) : null}
          </p>
        </div>
        <span className={`admin-pill admin-pill--${live ? "live" : "draft"}`}>{course.status}</span>
      </div>

      <div className="admin-stats">
        <div>
          <dt>Price</dt>
          <dd>{rupees(course.listAmount)}</dd>
        </div>
        <div>
          <dt>Batches</dt>
          <dd>{course.cohortCount}</dd>
        </div>
        <div>
          <dt>Enrolled</dt>
          <dd>{course.enrolmentCount}</dd>
        </div>
      </div>

      {/**
       * ⚠️ THERE IS DELIBERATELY NO "PUBLIC DISCOUNT" FIELD HERE ANY MORE.
       *
       * It existed, and it was used the way it looked — a code name ("SVVN123") typed into
       * it as a label with ₹499 off. That is not what the field did: it cut the price for
       * every visitor, code or no code, and the course quietly sold at ₹500. A control whose
       * obvious reading is wrong is a bug in the panel, not a mistake by the person using it.
       *
       * One price per course, and every reduction is a code entered at checkout.
       */}
      <div className="admin-fields">
        <label>
          <span>Price (₹)</span>
          <input
            type="number"
            min="0"
            step="1"
            value={listRupees}
            onChange={(event) => setListRupees(event.target.value)}
          />
        </label>
      </div>

      <p className="admin-hint">
        This is what everyone sees and pays. To give some students a lower price, make a code
        in <strong>Discount codes</strong> — it only applies when they type it at checkout.
      </p>

      <div className="admin-actions">
        <button
          className="btn btn--primary btn--sm"
          type="button"
          disabled={busy}
          onClick={() =>
            act(
              {
                action: "course.pricing",
                slug: course.slug,
                listRupees: Number(listRupees),
                // Always cleared: a course-level discount has no UI and must never
                // silently reduce the price.
                discountType: "none",
                discountValue: 0,
                discountLabel: "",
              },
              "Price saved.",
            )
          }
        >
          Save price
        </button>
        <button
          className="btn btn--secondary btn--sm"
          type="button"
          disabled={busy}
          onClick={() =>
            act(
              {
                action: "course.status",
                slug: course.slug,
                status: live ? "draft" : "published",
              },
              live ? "Course unpublished." : "Course is live.",
            )
          }
        >
          {live ? "Unpublish" : "Publish"}
        </button>
      </div>
    </section>
  );
}

/* --------------------------------- batches --------------------------------- */

function BatchesTab({
  cohorts,
  courses,
  act,
  busy,
}: {
  cohorts: CohortRow[];
  courses: CourseRow[];
  act: Act;
  busy: boolean;
}) {
  const [newFor, setNewFor] = useState(courses[0]?.slug ?? "");
  const [newName, setNewName] = useState("");

  return (
    <>
      <section className="admin-card admin-card--tight">
        <h2>New batch</h2>
        <div className="admin-fields">
          <label>
            <span>Course</span>
            <select value={newFor} onChange={(event) => setNewFor(event.target.value)}>
              {courses.map((course) => (
                <option key={course.slug} value={course.slug}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Name</span>
            <input
              type="text"
              value={newName}
              placeholder="Batch 2"
              onChange={(event) => setNewName(event.target.value)}
            />
          </label>
        </div>
        <div className="admin-actions">
          <button
            className="btn btn--primary btn--sm"
            type="button"
            disabled={busy || !newFor}
            onClick={async () => {
              const ok = await act(
                { action: "cohort.create", courseSlug: newFor, name: newName },
                "Batch created as a draft.",
              );
              if (ok) setNewName("");
            }}
          >
            Create batch
          </button>
        </div>
      </section>

      {cohorts.length ? (
        <div className="admin-cards">
          {cohorts.map((cohort) => (
            <BatchCard key={cohort.id} cohort={cohort} act={act} busy={busy} />
          ))}
        </div>
      ) : (
        <p className="admin-empty">No batches yet.</p>
      )}
    </>
  );
}

function BatchCard({ cohort, act, busy }: { cohort: CohortRow; act: Act; busy: boolean }) {
  const [name, setName] = useState(cohort.name);
  const [seats, setSeats] = useState(cohort.seatsTotal === null ? "" : String(cohort.seatsTotal));
  const [link, setLink] = useState(cohort.joiningLink ?? "");
  const [status, setStatus] = useState(cohort.status);
  const [unlisted, setUnlisted] = useState(cohort.unlisted);
  const [dates, setDates] = useState<string[]>(() => {
    const list = [0, 1, 2, 3].map((i) => toLocalInput(cohort.sessions[i]?.startsAt ?? null));
    return list;
  });

  return (
    <section className="admin-card">
      <div className="admin-card__head">
        <div>
          <h2>{cohort.name}</h2>
          <p className="admin-card__slug">{cohort.courseSlug}</p>
        </div>
        <span className={`admin-pill admin-pill--${cohort.status === "open" ? "live" : "draft"}`}>
          {cohort.status}
        </span>
      </div>

      <div className="admin-stats">
        <div>
          <dt>Waiting</dt>
          <dd>{cohort.overflowCount || "—"}</dd>
        </div>
        <div>
          <dt>Seats</dt>
          <dd>
            {cohort.seatsTaken}{cohort.seatsTotal === null ? " (uncapped)" : `/${cohort.seatsTotal}`}
          </dd>
        </div>
        <div>
          <dt>Confirmed</dt>
          <dd>{cohort.confirmedCount}</dd>
        </div>
        <div>
          <dt>Dates set</dt>
          <dd>{cohort.sessions.filter((s) => s.startsAt).length}/4</dd>
        </div>
      </div>

      <div className="admin-fields">
        <label>
          <span>Name</span>
          <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          <span>Total seats</span>
          <input
            type="number"
            min="0"
            value={seats}
            placeholder="Unlimited"
            onChange={(event) => setSeats(event.target.value)}
          />
        </label>
        <label>
          <span>Status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="draft">Draft — not sellable</option>
            <option value="open">Open — taking enrolments</option>
            <option value="full">Full</option>
            <option value="closed">Closed</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
          </select>
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={unlisted}
            onChange={(event) => setUnlisted(event.target.checked)}
          />
          {/* An open batch is offered to every public buyer. A school batch has to be open
              to take seats but must not appear in that list, which is what this hides. */}
          <span>
            Unlisted &mdash; hidden from the public batch picker, reachable only by a
            discount code that names it
          </span>
        </label>
        <label className="admin-fields__wide">
          <span>Class link (Google Meet / Zoom)</span>
          <input
            type="url"
            value={link}
            placeholder="Leave blank — the page will say it comes on WhatsApp"
            onChange={(event) => setLink(event.target.value)}
          />
        </label>
      </div>

      <p className="admin-sub">Session dates — times are IST</p>
      <div className="admin-dates">
        {[0, 1, 2, 3].map((index) => (
          <label key={index}>
            <span>Week {index + 1}</span>
            <input
              type="datetime-local"
              value={dates[index] ?? ""}
              onChange={(event) => {
                const next = [...dates];
                next[index] = event.target.value;
                setDates(next);
              }}
            />
          </label>
        ))}
      </div>

      <div className="admin-actions">
        <button
          className="btn btn--primary btn--sm"
          type="button"
          disabled={busy}
          onClick={() =>
            act(
              {
                action: "cohort.update",
                id: cohort.id,
                name,
                seatsTotal: seats.trim() === "" ? null : Number(seats),
                joiningLink: link,
                status,
                unlisted,
                sessionDates: dates.map(fromLocalInput),
              },
              "Batch saved.",
            )
          }
        >
          Save batch
        </button>
      </div>
    </section>
  );
}

/* ------------------------------ discount codes ----------------------------- */

function CodesTab({
  coupons,
  courses,
  cohorts,
  act,
  busy,
}: {
  coupons: CouponRow[];
  courses: CourseRow[];
  cohorts: CohortRow[];
  act: Act;
  busy: boolean;
}) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponRow["type"]>("flat_price");
  const [value, setValue] = useState("499");
  const [label, setLabel] = useState("Student offer");
  const [maxUses, setMaxUses] = useState("");
  const [slug, setSlug] = useState("");
  const [cohortId, setCohortId] = useState("");

  return (
    <>
      <section className="admin-card admin-card--tight">
        <h2>New or edit a code</h2>
        <p className="admin-hint">
          Saving an existing code updates it. Redemptions already counted are never reset.
        </p>
        <div className="admin-fields">
          <label>
            <span>Code</span>
            <input
              type="text"
              value={code}
              placeholder="STUDENT499"
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
          </label>
          <label>
            <span>Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as CouponRow["type"])}
            >
              <option value="flat_price">Set the price to…</option>
              <option value="fixed">Take ₹ off</option>
              <option value="percentage">Take % off</option>
            </select>
          </label>
          <label>
            <span>{type === "percentage" ? "Percent" : "Amount (₹)"}</span>
            <input
              type="number"
              min="0"
              value={value}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
          <label>
            <span>Label</span>
            <input type="text" value={label} onChange={(event) => setLabel(event.target.value)} />
          </label>
          <label>
            <span>Max uses</span>
            <input
              type="number"
              min="1"
              value={maxUses}
              placeholder="Unlimited"
              onChange={(event) => setMaxUses(event.target.value)}
            />
          </label>
          <label>
            <span>Course</span>
            <select value={slug} onChange={(event) => setSlug(event.target.value)}>
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.slug} value={course.slug}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-fields__wide">
            <span>Place everyone who uses this code into</span>
            <select value={cohortId} onChange={(event) => setCohortId(event.target.value)}>
              <option value="">No batch — place by hand</option>
              {cohorts
                .filter((cohort) => !slug || cohort.courseSlug === slug)
                .map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.name} — {cohort.courseSlug}
                    {cohort.unlisted ? " (unlisted)" : ""}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <p className="admin-hint">
          <strong>Set the price to…</strong> is what you usually want — “with this code it&rsquo;s
          ₹499” stays true even if you raise the course price later.
        </p>
        <div className="admin-actions">
          <button
            className="btn btn--primary btn--sm"
            type="button"
            disabled={busy || !code.trim()}
            onClick={async () => {
              const ok = await act(
                {
                  action: "coupon.save",
                  code,
                  type,
                  value: Number(value || 0),
                  label,
                  active: true,
                  maxUses: maxUses === "" ? null : Number(maxUses),
                  courseSlugs: slug ? [slug] : null,
                  cohortId,
                },
                `Code ${code} saved.`,
              );
              if (ok) setCode("");
            }}
          >
            Save code
          </button>
        </div>
      </section>

      {coupons.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Does</th>
                <th>Used</th>
                <th>Course</th>
                <th>Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon.code}>
                  <td>
                    <strong>{coupon.code}</strong>
                    <span className="admin-table__sub">{coupon.label}</span>
                  </td>
                  <td>
                    {coupon.type === "flat_price"
                      ? `price → ${rupees(coupon.value)}`
                      : coupon.type === "fixed"
                        ? `${rupees(coupon.value)} off`
                        : `${coupon.value}% off`}
                  </td>
                  <td>
                    {coupon.usesCount}
                    {coupon.maxUses === null ? "" : ` / ${coupon.maxUses}`}
                  </td>
                  <td>{coupon.courseSlugs ? coupon.courseSlugs.join(", ") : "all"}</td>
                  <td>
                    <span className={`admin-pill admin-pill--${coupon.active ? "live" : "draft"}`}>
                      {coupon.active ? "active" : "off"}
                    </span>
                  </td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        act(
                          {
                            action: "coupon.save",
                            code: coupon.code,
                            type: coupon.type,
                            value:
                              coupon.type === "percentage" ? coupon.value : coupon.value / 100,
                            label: coupon.label,
                            active: !coupon.active,
                            maxUses: coupon.maxUses,
                            courseSlugs: coupon.courseSlugs,
                            cohortId: coupon.cohortId ?? "",
                          },
                          coupon.active ? "Code switched off." : "Code switched on.",
                        )
                      }
                    >
                      {coupon.active ? "Turn off" : "Turn on"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-empty">No discount codes yet.</p>
      )}
    </>
  );
}

/* ------------------------------- enrolments -------------------------------- */

/**
 * ⚠️ ONE PLACE DECIDES WHAT A ROW'S STATUS MEANS, so the summary tiles above the table and
 * the pill on each row can never disagree about what counts as "pending" versus "failed".
 *
 * `status === "confirmed"` covers both `paid` and `not_required` (free/discounted-to-zero) —
 * `confirmFreeEnrolment` sets both together, so payment status alone would double this case.
 * Everything else reads `paymentStatus` directly: `pending` is still in progress (amber, not
 * an alarm), `failed`/`refunded` are the two states where money didn't end up where it
 * should (red) — a genuinely different situation from "hasn't tried yet."
 */
function enrolmentState(row: EnrolmentRow): { label: string; pill: "live" | "warn" | "error" | "draft" } {
  if (row.status === "confirmed") return { label: "confirmed", pill: "live" };
  if (row.paymentStatus === "pending") return { label: "pending", pill: "warn" };
  if (row.paymentStatus === "failed" || row.paymentStatus === "refunded") {
    return { label: row.paymentStatus, pill: "error" };
  }
  return { label: row.paymentStatus, pill: "draft" };
}

/**
 * Students. Only the ones whose money actually arrived, divided by batch.
 *
 * ⚠️ NOTHING UNPAID REACHES THIS TAB. An abandoned checkout is not a student, and mixing the
 * two meant the only honest answer to "how many students are in this batch" came from
 * counting rows and reading a pill on each. The unpaid attempts live in Checkouts.
 *
 * Grouping is by batch because that is the unit the work actually happens in — a WhatsApp
 * group to create, a class link to send, a register to take.
 */
/**
 * Students. Only the ones whose money actually arrived, divided by batch.
 *
 * ⚠️ NOTHING UNPAID REACHES THIS TAB. An abandoned checkout is not a student, and mixing the
 * two meant the only honest answer to "how many students are in this batch" came from
 * counting rows and reading a pill on each. The unpaid attempts live in Checkouts.
 *
 * Grouping is by batch because that is the unit the work actually happens in — a WhatsApp
 * group to create, a class link to send, a register to take.
 */
function EnrolledTab({
  rows,
  cohorts,
  act,
  busy,
}: {
  rows: EnrolmentRow[];
  cohorts: CohortRow[];
  act: Act;
  busy: boolean;
}) {
  if (!rows.length) return <p className="admin-empty">No paid enrollments yet.</p>;

  const collected = rows.reduce((sum, r) => sum + r.amount, 0);
  const overflow = rows.filter((r) => r.placement === "overflow");

  /**
   * One group per batch, in the order the batches are listed, then the unbatched.
   *
   * ⚠️ BUILT FROM THE BATCH LIST, NOT FROM THE ROWS. Grouping by whatever `cohortName`
   * strings happen to appear would silently merge two batches that share a name, and would
   * order the groups by whoever paid first. Keying on the batch id keeps them distinct and
   * the order stable.
   */
  const groups = cohorts
    .map((cohort) => ({
      cohort,
      rows: rows.filter((r) => r.cohortId === cohort.id),
    }))
    .filter((group) => group.rows.length);

  const unbatched = rows.filter((r) => !r.cohortId || !cohorts.some((c) => c.id === r.cohortId));

  return (
    <>
      <div className="admin-stats admin-stats--wide">
        <div>
          <dt>Students</dt>
          <dd>{rows.length}</dd>
        </div>
        <div>
          <dt>Collected</dt>
          <dd>{rupees(collected)}</dd>
        </div>
        <div>
          <dt>Batches in use</dt>
          <dd>{groups.length}</dd>
        </div>
        <div>
          <dt>Waiting for a seat</dt>
          <dd>{overflow.length}</dd>
        </div>
      </div>

      {overflow.length ? (
        <p className="admin-alert">
          <strong>
            {overflow.length} paid {overflow.length === 1 ? "student is" : "students are"} waiting
            for a seat.
          </strong>{" "}
          Their batch was full when the payment landed, so they are held in overflow &mdash; the
          money is collected and their place is safe. Raise the seat cap, or move them to
          another batch with the dropdown on their row.
        </p>
      ) : null}

      {groups.map((group) => {
        const seated = group.rows.filter((r) => r.placement !== "overflow");
        const waiting = group.rows.filter((r) => r.placement === "overflow");
        // Overflow students have paid too, so the batch total counts them.
        const takings = group.rows.reduce((sum, r) => sum + r.amount, 0);
        return (
          <section className="admin-group" key={group.cohort.id}>
            <h3 className="admin-group__title">
              {group.cohort.name}
              <span className="admin-group__count">{group.rows.length}</span>
              <span className="admin-group__sum">{rupees(takings)}</span>
              <span className="admin-group__meta">
                {group.cohort.courseSlug}
                {group.cohort.seatsTotal === null
                  ? " · uncapped"
                  : ` · ${seated.length}/${group.cohort.seatsTotal} seats`}
                {waiting.length ? ` · ${waiting.length} waiting` : ""}
                {group.cohort.unlisted ? " · unlisted" : ""}
              </span>
            </h3>
            <EnrolmentTable rows={group.rows} cohorts={cohorts} act={act} busy={busy} showPlacement />
          </section>
        );
      })}

      {unbatched.length ? (
        <section className="admin-group">
          <h3 className="admin-group__title">
            Not in a batch yet
            <span className="admin-group__count">{unbatched.length}</span>
            <span className="admin-group__sum">
              {rupees(unbatched.reduce((sum, r) => sum + r.amount, 0))}
            </span>
            <span className="admin-group__meta">pick a batch on any row to place them</span>
          </h3>
          <EnrolmentTable rows={unbatched} cohorts={cohorts} act={act} busy={busy} showPlacement />
        </section>
      ) : null}
    </>
  );
}

/**
 * Payment attempts that never became enrolments — the chase list.
 *
 * Named for what it holds rather than "Payments", which would equally describe the money on
 * the Enrolled tab and send you to the wrong place looking for it.
 */
function CheckoutsTab({
  rows,
  cohorts,
  act,
  busy,
}: {
  rows: EnrolmentRow[];
  cohorts: CohortRow[];
  act: Act;
  busy: boolean;
}) {
  if (!rows.length) return <p className="admin-empty">No incomplete checkouts.</p>;

  const awaiting = rows.filter((r) => r.paymentStatus === "pending");
  const failed = rows.filter((r) => r.paymentStatus === "failed" || r.paymentStatus === "refunded");
  const uncollected = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <>
      <div className="admin-stats admin-stats--wide">
        <div>
          <dt>Incomplete</dt>
          <dd>{rows.length}</dd>
        </div>
        <div>
          <dt>Not collected</dt>
          <dd>{rupees(uncollected)}</dd>
        </div>
        <div>
          <dt>Awaiting payment</dt>
          <dd>{awaiting.length}</dd>
        </div>
        <div>
          <dt>Failed</dt>
          <dd>{failed.length}</dd>
        </div>
      </div>

      <p className="admin-hint">
        Nobody here has paid through Razorpay, so no seat is held. Every phone number is a
        WhatsApp link &mdash; a failed card is usually worth one message. If someone paid you
        directly, <strong>Paid outside Razorpay</strong> moves them to Enrolled.
      </p>

      {awaiting.length ? (
        <section className="admin-group">
          <h3 className="admin-group__title">
            Awaiting payment
            <span className="admin-group__count">{awaiting.length}</span>
          </h3>
          <EnrolmentTable rows={awaiting} cohorts={cohorts} act={act} busy={busy} showManualPay />
        </section>
      ) : null}

      {failed.length ? (
        <section className="admin-group">
          <h3 className="admin-group__title">
            Failed / refunded
            <span className="admin-group__count">{failed.length}</span>
          </h3>
          <EnrolmentTable rows={failed} cohorts={cohorts} act={act} busy={busy} showManualPay />
        </section>
      ) : null}
    </>
  );
}

/** One table of enrolment rows. The heading and the grouping belong to the caller. */
function EnrolmentTable({
  rows,
  cohorts,
  act,
  busy,
  showPlacement = false,
  showManualPay = false,
}: {
  rows: EnrolmentRow[];
  cohorts: CohortRow[];
  act: Act;
  busy: boolean;
  showPlacement?: boolean;
  showManualPay?: boolean;
}) {
  if (!rows.length) return null;

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Guardian</th>
            <th>Paid</th>
            <th>Code</th>
            <th>{showPlacement ? "Batch" : "Assign to"}</th>
            <th>Status</th>
            <th>When</th>
            {showManualPay ? <th>Payment</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <EnrolmentRowView
              key={row.id}
              row={row}
              cohorts={cohorts}
              act={act}
              busy={busy}
              showPlacement={showPlacement}
              showManualPay={showManualPay}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EnrolmentRowView({
  row,
  cohorts,
  act,
  busy,
  showPlacement,
  showManualPay,
}: {
  row: EnrolmentRow;
  cohorts: CohortRow[];
  act: Act;
  busy: boolean;
  showPlacement: boolean;
  showManualPay: boolean;
}) {
  const state = enrolmentState(row);
  const [paying, setPaying] = useState(false);
  const [note, setNote] = useState("");
  const [externalRef, setExternalRef] = useState("");

  /**
   * Only batches on this student's own course are offered. A batch belongs to one course,
   * so moving somebody into another course's batch is never a thing an admin means to do —
   * and the enrolment route refuses it anyway, which would be a confusing way to find out.
   */
  const options = cohorts.filter((c) => c.courseSlug === row.courseSlug);

  return (
    <>
      <tr>
        <td>
          <strong>{row.studentName}</strong>
          <span className="admin-table__sub">Class {row.studentClass}</span>
        </td>
        <td>
          {row.guardianName}
          <span className="admin-table__sub">
            <a
              href={`https://wa.me/${row.guardianPhone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {row.guardianPhone}
            </a>
          </span>
        </td>
        <td>{rupees(row.amount)}</td>
        <td>{row.couponCode ?? "—"}</td>

        <td>
          <select
            className="admin-inline-select"
            value={row.cohortId}
            disabled={busy}
            onChange={(event) =>
              act(
                { action: "enrolment.batch", id: row.id, cohortId: event.target.value },
                event.target.value ? "Student moved." : "Student removed from the batch.",
              )
            }
          >
            <option value="">— no batch —</option>
            {options.map((cohort) => (
              <option key={cohort.id} value={cohort.id}>
                {cohort.name}
                {cohort.seatsTotal === null ? "" : ` (${cohort.seatsTaken}/${cohort.seatsTotal})`}
              </option>
            ))}
          </select>
          {showPlacement && row.placement === "overflow" ? (
            <span className="admin-table__sub">no seat — waiting</span>
          ) : null}
        </td>

        <td>
          <span className={`admin-pill admin-pill--${state.pill}`}>{state.label}</span>
        </td>

        <td className="admin-table__when">
          {row.createdAt
            ? new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "short",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Kolkata",
              }).format(new Date(row.createdAt))
            : "—"}
        </td>

        {showManualPay ? (
          <td>
            <button
              className="btn btn--secondary btn--sm"
              type="button"
              disabled={busy}
              onClick={() => setPaying((was) => !was)}
            >
              {paying ? "Cancel" : "Paid outside Razorpay"}
            </button>
          </td>
        ) : null}
      </tr>

      {showManualPay && paying ? (
        <tr>
          <td colSpan={8}>
            <div className="admin-manual">
              <p className="admin-hint">
                {/**
                 * ⚠️ NO RAZORPAY ID FIELD HERE, DELIBERATELY. Razorpay never saw this money,
                 * so there is no id to enter — a required one would only be satisfied by
                 * inventing a value, and a fabricated payment id is worse than none: it makes
                 * the row indistinguishable from a real gateway payment when takings are
                 * reconciled against Razorpay's own report. The note is the audit trail
                 * instead, which is why it is the field that is required.
                 */}
                Marks <strong>{row.studentName}</strong> as paid {rupees(row.amount)} without a
                Razorpay payment. The row stays badged <code>manual</code> so it never looks
                like a gateway payment.
              </p>
              <div className="admin-manual__fields">
                <label>
                  <span>How it arrived (required)</span>
                  <input
                    type="text"
                    value={note}
                    placeholder="e.g. UPI to company account, 14 Sep"
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>
                <label>
                  <span>Reference (optional)</span>
                  <input
                    type="text"
                    value={externalRef}
                    placeholder="UPI / bank txn id"
                    onChange={(event) => setExternalRef(event.target.value)}
                  />
                </label>
                <button
                  className="btn btn--primary btn--sm"
                  type="button"
                  disabled={busy || !note.trim()}
                  onClick={async () => {
                    const ok = await act(
                      {
                        action: "enrolment.manualPay",
                        id: row.id,
                        note,
                        externalRef,
                      },
                      `${row.studentName} marked paid.`,
                    );
                    if (ok) {
                      setPaying(false);
                      setNote("");
                      setExternalRef("");
                    }
                  }}
                >
                  Confirm payment
                </button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
