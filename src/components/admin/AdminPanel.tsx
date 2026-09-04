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

type Tab = "courses" | "batches" | "codes" | "enrolments";

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
  confirmedCount: number;
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
}

interface EnrolmentRow {
  id: string;
  reference: string;
  courseSlug: string;
  studentName: string;
  studentClass: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  amount: number;
  couponCode: string | null;
  paymentStatus: string;
  status: string;
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

  const tabs: [Tab, string, number][] = [
    ["courses", "Courses", data?.courses.length ?? 0],
    ["batches", "Batches", data?.cohorts.length ?? 0],
    ["codes", "Discount codes", data?.coupons.length ?? 0],
    ["enrolments", "Enrollments", data?.enrolments.length ?? 0],
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
        <CodesTab coupons={data?.coupons ?? []} courses={data?.courses ?? []} act={act} busy={busy} />
      ) : null}
      {tab === "enrolments" ? <EnrolmentsTab rows={data?.enrolments ?? []} /> : null}
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
  act,
  busy,
}: {
  coupons: CouponRow[];
  courses: CourseRow[];
  act: Act;
  busy: boolean;
}) {
  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponRow["type"]>("flat_price");
  const [value, setValue] = useState("499");
  const [label, setLabel] = useState("Student offer");
  const [maxUses, setMaxUses] = useState("");
  const [slug, setSlug] = useState("");

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

function EnrolmentsTab({ rows }: { rows: EnrolmentRow[] }) {
  if (!rows.length) return <p className="admin-empty">No enrollments yet.</p>;

  const confirmed = rows.filter((r) => r.status === "confirmed");
  const collected = confirmed.reduce((sum, r) => sum + r.amount, 0);
  const pending = rows.filter((r) => r.status !== "confirmed" && r.paymentStatus === "pending");
  const failed = rows.filter(
    (r) => r.status !== "confirmed" && (r.paymentStatus === "failed" || r.paymentStatus === "refunded"),
  );

  return (
    <>
      <div className="admin-stats admin-stats--wide">
        <div>
          <dt>Confirmed</dt>
          <dd>{confirmed.length}</dd>
        </div>
        <div>
          <dt>Collected</dt>
          <dd>{rupees(collected)}</dd>
        </div>
        <div>
          <dt>Pending</dt>
          <dd>{pending.length}</dd>
        </div>
        <div>
          <dt>Failed</dt>
          <dd>{failed.length}</dd>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Guardian</th>
              <th>Paid</th>
              <th>Code</th>
              <th>Status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const state = enrolmentState(row);
              return (
              <tr key={row.id}>
                <td>
                  <strong>{row.studentName}</strong>
                  <span className="admin-table__sub">Class {row.studentClass}</span>
                </td>
                <td>
                  {row.guardianName}
                  <span className="admin-table__sub">
                    <a href={`https://wa.me/${row.guardianPhone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                      {row.guardianPhone}
                    </a>
                  </span>
                </td>
                <td>{rupees(row.amount)}</td>
                <td>{row.couponCode ?? "—"}</td>
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
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
