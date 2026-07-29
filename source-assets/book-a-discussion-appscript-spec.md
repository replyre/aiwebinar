# "Book a discussion" — Google Apps Script backend spec

> **STATUS: PARKED — do not build yet (as of 29 Jul 2026).**
> The live site now uses **FormSubmit.co**, wired up in `assets/js/main.js`. That
> emails each enquiry to `support@innovgeist.com`, CC `replyrgupta@gmail.com`, and
> stores nothing. Keep this document for when submissions need to land in a
> spreadsheet — the field inventory (§1) and sheet layout (§2) stay accurate either
> way. §7 describes changes that have **not** been applied.

Handoff document for engineering. Target form: `index.html` → `<form class="form" data-contact-form>` (line ~1653, section `#contact`).

Current state: the markup has no `action`/`method`, but a submit handler **already exists** in `assets/js/main.js` → `initForm()` (line ~455). It validates required fields, then branches on the `FORM_ENDPOINT` constant at the top of that file:

- `FORM_ENDPOINT === ''` (today) → falls back to opening the visitor's mail client via `mailto:`, addressed to `CONTACT_EMAIL` and CC'd to `CONTACT_CC`.
- `FORM_ENDPOINT` set → `POST`s a `FormData` body and expects a 2xx.

So the work is: build the Apps Script endpoint (§5), paste its `/exec` URL into `FORM_ENDPOINT`, and make the two adjustments in §7. Do **not** rewrite `initForm()` from scratch.

---

## 1. Field inventory (exactly as in the HTML today)

| # | Label on page | `name` attribute | `id` | Control | Required | Example value |
|---|---|---|---|---|---|---|
| 1 | Institution | `institution` | `f-institution` | `input[type=text]` | **Yes** | `Amity University, Lucknow` |
| 2 | Your name | `name` | `f-name` | `input[type=text]` | **Yes** | `Dr. Meera Nair` |
| 3 | Role / designation | `role` | `f-role` | `input[type=text]` | No | `Dean, School of Engineering` |
| 4 | Approx. participants | `participants` | `f-participants` | `input[type=text]`, `inputmode=numeric` | No | `150` |
| 5 | Email | `email` | `f-email` | `input[type=email]` | **Yes** | `meera.nair@amity.edu` |
| 6 | Phone | `phone` | `f-phone` | `input[type=tel]` | No | `+91 98765 43210` |
| 7 | Programs of interest | `programs` | — | `input[type=checkbox]` ×4, **same name** | No | `AI for Students, AI for Faculty` |
| 8 | Preferred timeframe | `timeframe` | `f-timeframe` | `select` | No | `Next academic term` |
| 9 | What would you like to achieve? | `message` | `f-message` | `textarea` | No | `Awareness session for 2nd/3rd year CSE...` |

### Fixed option values

`programs` — checkbox group, **multi-value**. Zero to four of:
```
AI for Students
AI for Faculty
AI for Graduate Students
Institutional AI & automation      <-- note the ampersand (HTML source has &amp;)
```

`timeframe` — single select. One of:
```
""                     (empty = "Select a timeframe", user left it untouched)
Within a month
1–3 months             <-- EN DASH (U+2013), not a hyphen. HTML source has &ndash;
Next academic term
Still exploring
```

> Engineer note: `1–3 months` arrives with a real en dash. Do not normalise it to `1-3` unless the sheet's data-validation list is also written with a hyphen. Pick one and keep both sides identical.

### Fields to ADD to the markup (not present today)

| `name` | Purpose | Notes |
|---|---|---|
| `_honey` | Spam honeypot | `<input type="text" name="_honey" tabindex="-1" autocomplete="off">`, hidden via CSS (`position:absolute;left:-9999px`). If non-empty → silently return success, do **not** write the row. |
| `_source` | Which page/form fired | Hidden input, value `aiwebinar-contact` |
| `_ts` | Client timestamp | Hidden input filled by JS on submit (`Date.now()`); used to reject sub-2-second bot submits. |

---

## 2. Google Sheet layout

Sheet name: **`Bookings`** (create it; script should also create it if missing).

Header row (row 1), left to right — **this exact order**:

| Col | Header |
|---|---|
| A | `Timestamp` |
| B | `Institution` |
| C | `Name` |
| D | `Role` |
| E | `Participants` |
| F | `Email` |
| G | `Phone` |
| H | `Programs` |
| I | `Timeframe` |
| J | `Message` |
| K | `Source` |
| L | `User Agent` |
| M | `Status` |

- **Timestamp** — server-side, `new Date()`, sheet timezone `Asia/Kolkata`. Never trust the client clock.
- **Programs** — the checked values joined with `", "` into one cell.
- **Status** — write the literal `New` on insert. Sales team edits it manually afterwards (`New` / `Contacted` / `Scheduled` / `Closed`). Set data validation on M2:M with those four values.

### Example row

```
2026-07-29 15:42:11 | Amity University, Lucknow | Dr. Meera Nair | Dean, School of Engineering | 150 | meera.nair@amity.edu | +91 98765 43210 | AI for Students, AI for Faculty | Next academic term | Awareness session for 2nd and 3rd year CSE students before the placement cycle. | aiwebinar-contact | Mozilla/5.0 (Windows NT 10.0; Win64; x64)... | New
```

---

## 3. Request contract

**Endpoint:** the Apps Script Web App `/exec` URL.
**Method:** `POST`
**Content-Type:** `application/x-www-form-urlencoded;charset=UTF-8`

> Why urlencoded and not JSON: Apps Script Web Apps do not return CORS preflight headers. Sending `application/json` triggers an `OPTIONS` preflight that Apps Script answers without `Access-Control-Allow-Origin`, so the browser blocks it. `application/x-www-form-urlencoded` (and `text/plain`) are CORS-"simple" content types — no preflight, request goes straight through. Send a `FormData`-derived `URLSearchParams` body.

### Example payload (decoded)

```
institution=Amity University, Lucknow
name=Dr. Meera Nair
role=Dean, School of Engineering
participants=150
email=meera.nair@amity.edu
phone=+91 98765 43210
programs=AI for Students
programs=AI for Faculty
timeframe=Next academic term
message=Awareness session for 2nd and 3rd year CSE students.
_source=aiwebinar-contact
_ts=1785000000000
_honey=
```

Note `programs` repeats once per checked box. On the server read it with `e.parameters.programs` (plural — array), not `e.parameter.programs` (singular — first value only).

### Response (always HTTP 200, JSON body)

Success:
```json
{ "ok": true, "id": "BK-20260729-0007" }
```

Validation failure:
```json
{ "ok": false, "error": "validation", "fields": { "email": "Enter a valid email address." } }
```

Server failure:
```json
{ "ok": false, "error": "server" }
```

---

## 4. Server-side validation rules

| Field | Rule | Error message to return |
|---|---|---|
| `institution` | trimmed length 2–150 | `Please enter your institution name.` |
| `name` | trimmed length 2–100 | `Please enter your name.` |
| `email` | matches `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/`, max 150 | `Enter a valid email address.` |
| `phone` | optional; if present, strip spaces/dashes/brackets, then 7–15 digits with optional leading `+` | `Enter a valid phone number.` |
| `participants` | optional; if present, digits only, 1–100000 | `Enter a number.` |
| `role` | optional, max 120 | — (truncate) |
| `message` | optional, max 2000 | — (truncate) |
| `programs` | each value must be in the fixed list above; drop anything else | — (silently drop) |
| `timeframe` | must be `""` or one of the four fixed values; else store `""` | — (silently drop) |
| `_honey` | must be empty | (return `{ok:true}` but discard) |
| `_ts` | if `Date.now() - _ts < 2000` → treat as bot, discard | (return `{ok:true}` but discard) |

Also: cap at **5 submissions per email per 24h** using `CacheService.getScriptCache()` keyed on the lowercased email; over the cap, return `{ok:true}` and skip the write.

Trim every string. Strip leading `=`, `+`, `-`, `@` from any value before writing to the sheet (CSV/formula-injection guard — someone can type `=IMPORTXML(...)` into the message field).

---

## 5. Apps Script implementation

Script-level config lives in **Project Settings → Script properties**, not in code:

| Property | Example value |
|---|---|
| `SHEET_ID` | `1AbC...long-id...xyz` |
| `NOTIFY_TO` | `support@innovgeist.com` |
| `NOTIFY_CC` | `replyrgupta@gmail.com` — comma-separate to add more |
| `ALLOWED_ORIGIN` | `https://aiwebinar.innovgeist.com` |

```javascript
/** Code.gs */

const SHEET_NAME = 'Bookings';
const HEADERS = ['Timestamp','Institution','Name','Role','Participants','Email',
                 'Phone','Programs','Timeframe','Message','Source','User Agent','Status'];

const PROGRAMS = ['AI for Students','AI for Faculty','AI for Graduate Students',
                  'Institutional AI & automation'];
const TIMEFRAMES = ['','Within a month','1–3 months','Next academic term','Still exploring'];

function doPost(e) {
  try {
    const p  = (e && e.parameter)  || {};
    const pm = (e && e.parameters) || {};

    // --- spam gates: look successful, write nothing ---
    if (str(p._honey)) return json({ ok: true });
    const ts = Number(p._ts || 0);
    if (ts && Date.now() - ts < 2000) return json({ ok: true });

    // --- validate ---
    const errors = {};
    const institution  = clip(str(p.institution), 150);
    const name         = clip(str(p.name), 100);
    const email        = clip(str(p.email), 150).toLowerCase();
    const phoneRaw     = str(p.phone);
    const participants = str(p.participants);

    if (institution.length < 2) errors.institution = 'Please enter your institution name.';
    if (name.length < 2)        errors.name        = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Enter a valid email address.';
    if (phoneRaw && !/^\+?\d{7,15}$/.test(phoneRaw.replace(/[\s\-()]/g, '')))
      errors.phone = 'Enter a valid phone number.';
    if (participants && !/^\d{1,6}$/.test(participants))
      errors.participants = 'Enter a number.';

    if (Object.keys(errors).length)
      return json({ ok: false, error: 'validation', fields: errors });

    // --- rate limit: 5 per email per 24h ---
    const cache = CacheService.getScriptCache();
    const key   = 'rl_' + Utilities.base64EncodeWebSafe(email);
    const hits  = Number(cache.get(key) || 0);
    if (hits >= 5) return json({ ok: true });
    cache.put(key, String(hits + 1), 21600); // 6h — Apps Script cache max

    // --- normalise multi-value + enum fields ---
    const programs = (pm.programs || [])
      .map(str).filter(v => PROGRAMS.indexOf(v) !== -1).join(', ');
    const tf = str(p.timeframe);
    const timeframe = TIMEFRAMES.indexOf(tf) !== -1 ? tf : '';

    // --- write ---
    const lock = LockService.getScriptLock();
    lock.waitLock(20000);                       // serialise concurrent appends
    let row;
    try {
      const sheet = getSheet_();
      const stamp = new Date();
      row = [
        stamp,
        safe(institution), safe(name), safe(clip(str(p.role), 120)), safe(participants),
        safe(email), safe(phoneRaw), safe(programs), safe(timeframe),
        safe(clip(str(p.message), 2000)),
        safe(clip(str(p._source) || 'aiwebinar-contact', 60)),
        clip(str((e && e.postData && e.postData.type) ? p._ua : p._ua), 250),
        'New'
      ];
      sheet.appendRow(row);
      var id = 'BK-' + Utilities.formatDate(stamp, 'Asia/Kolkata', 'yyyyMMdd')
                     + '-' + pad(sheet.getLastRow() - 1);
    } finally {
      lock.releaseLock();
    }

    notify_(row, id);
    autoReply_(email, name, institution);
    return json({ ok: true, id: id });

  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'server' });
  }
}

/** Health check — lets you open the /exec URL in a browser. */
function doGet() {
  return json({ ok: true, service: 'book-a-discussion' });
}

// ---------- helpers ----------

function getSheet_() {
  const ss = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function notify_(row, id) {
  const props = PropertiesService.getScriptProperties();
  const to = props.getProperty('NOTIFY_TO');
  if (!to) return;
  const body = HEADERS.map((h, i) => h + ': ' + row[i]).join('\n');
  // Recipients come from Script properties only — never from the request
  // body, or the endpoint becomes an open mail relay.
  MailApp.sendEmail({
    to: to,
    cc: props.getProperty('NOTIFY_CC') || '',
    replyTo: row[5],                                  // enquirer's email
    subject: '[' + id + '] Discussion request — ' + row[1],
    body: body
  });
}

function autoReply_(email, name, institution) {
  MailApp.sendEmail({
    to: email,
    name: 'Innovgeist Technologies',
    replyTo: 'support@innovgeist.com',
    subject: 'We received your request — Innovgeist',
    body: [
      'Dear ' + name + ',',
      '',
      'Thank you for reaching out about AI education at ' + institution + '.',
      'Our team will get back to you within two working days.',
      '',
      'Regards,',
      'Innovgeist Technologies Pvt. Ltd.',
      'support@innovgeist.com | +91 81272 73162'
    ].join('\n')
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function str(v)        { return (v == null ? '' : String(v)).trim(); }
function clip(v, n)    { return v.length > n ? v.slice(0, n) : v; }
function safe(v)       { return /^[=+\-@]/.test(v) ? "'" + v : v; }   // formula-injection guard
function pad(n)        { return ('000' + n).slice(-4); }
```

> `MailApp` quota on a free Gmail/Workspace account is 100 recipients/day; the notify + auto-reply pair costs 2 per submission. Fine at expected volume, worth knowing.

---

## 6. Deployment steps

1. Create the Sheet, note its ID from the URL (`/spreadsheets/d/<SHEET_ID>/edit`).
2. **Extensions → Apps Script** from that Sheet (or a standalone project — either works since we open by ID).
3. Paste `Code.gs`. Set the four Script properties from §5.
4. Run `doGet` once manually to trigger the OAuth consent screen; grant Sheets + Gmail scopes.
5. **Deploy → New deployment → Web app**
   - Description: `book-a-discussion v1`
   - Execute as: **Me**
   - Who has access: **Anyone** ← must be "Anyone", not "Anyone with Google account", or the site's anonymous visitors get a login redirect.
6. Copy the `/exec` URL. Open it in a browser — should print `{"ok":true,"service":"book-a-discussion"}`.
7. Give the URL to the front-end. On every code change: **Deploy → Manage deployments → edit → New version**. Editing the script alone does *not* update the live `/exec`.

---

## 7. Front-end changes — `assets/js/main.js`

`initForm()` already does validation, status messages, button disabling and the POST. Only three edits are needed. **Do not rewrite the function.**

### 7a. Set the endpoint (CONFIG block, top of file)

```javascript
var FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycb.../exec';
var CONTACT_EMAIL = 'support@innovgeist.com';
var CONTACT_CC    = 'replyrgupta@gmail.com';   // used by the mailto fallback only
```

Once `FORM_ENDPOINT` is non-empty the `mailto:` fallback stops being used on success — it only appears if the fetch throws. `CONTACT_CC` stays relevant for that fallback path.

### 7b. Send urlencoded, not `FormData`

In the `fetch` call, replace the body and drop the `Accept` header:

```javascript
fetch(FORM_ENDPOINT, {
  method: 'POST',
  // urlencoded => CORS-simple => no preflight (see §3).
  // Passing `data` (a FormData) directly sends multipart, which Apps Script
  // parses inconsistently and which trips preflight.
  body: new URLSearchParams(data)
})
```

Also add the three hidden values just after `var data = new FormData(form);`:

```javascript
data.set('_ts', String(Date.now()));
data.set('_source', 'aiwebinar-contact');
data.set('_ua', navigator.userAgent);
```

> Do **not** add a client-side `cc` field. Recipients are server-side Script properties (§5) — a CC accepted from the request body makes the endpoint an open mail relay.

### 7c. Read the JSON body instead of trusting `res.ok`

Apps Script returns HTTP 200 even on validation failure, so the current `if (!res.ok) throw` never fires for a rejected submission:

```javascript
.then(function (res) { return res.json(); })
.then(function (body) {
  if (body.ok) {
    form.reset();
    setStatus('Thank you — your request has been sent. We reply within two working days.');
    return;
  }
  if (body.error === 'validation') {
    Object.keys(body.fields || {}).forEach(function (k) {
      var field = document.getElementById('f-' + k);
      if (field) showError(field, body.fields[k]);
    });
    setStatus('Please correct the highlighted fields.', 'error');
    return;
  }
  throw new Error('server');
})
```

Server error keys map to element ids by prefixing `f-` (`email` → `f-email`), matching the `data-error-for` attributes already in the markup. `role`, `participants`, `phone`, `timeframe` and `message` have **no** `<p class="field__error" data-error-for="…">` element today — add them if you want inline errors there, otherwise those messages only surface in the status line.

---

## 8. Test cases to sign off

| # | Input | Expected |
|---|---|---|
| 1 | All three required fields valid, nothing else | Row appended, `Programs` and `Timeframe` blank, `Status` = `New`, both emails sent |
| 2 | All nine fields filled, all four programs checked | `Programs` cell = all four joined by `", "` |
| 3 | Email `not-an-email` | `{ok:false,error:"validation"}`, inline error under Email, no row |
| 4 | `timeframe` = `1–3 months` (en dash) | Stored verbatim with en dash |
| 5 | `message` = `=IMPORTXML("http://x","//a")` | Cell stored as text prefixed `'`, not evaluated as a formula |
| 6 | Honeypot filled | `{ok:true}`, **no** row, **no** email |
| 7 | Submit within 2s of page interaction (`_ts` too fresh) | `{ok:true}`, no row |
| 8 | Same email 6× in an hour | 6th returns `{ok:true}`, no row |
| 9 | Two submissions at the same instant | Two distinct rows, no overwrite (LockService) |
| 10 | Open `/exec` in a browser | `{"ok":true,"service":"book-a-discussion"}` |
| 11 | Submit from `https://aiwebinar.innovgeist.com` | No CORS error in console |
| 12 | Any valid submission | Notification lands in **both** `support@innovgeist.com` and `replyrgupta@gmail.com`; `Reply-To` is the enquirer's address, so hitting Reply goes to them |
| 13 | `FORM_ENDPOINT` blanked out (fallback path) | Mail client opens with `To: support@innovgeist.com`, `Cc: replyrgupta@gmail.com`, body pre-filled |
