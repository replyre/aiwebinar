# aiwebinar

Innovgeist's AI Education Partnership site — the institutional (B2B) page where schools and
colleges book a discussion.

Next.js 16 (App Router) + React 19 + TypeScript. The backend is Next API routes talking to
MongoDB; there is no separate server.

## Running it

```bash
npm install
cp .env.example .env.local   # then fill in MONGODB_URI
npm run dev                  # http://localhost:3000
```

The site renders fine with no environment at all. Only `POST /api/enquiries` needs
`MONGODB_URI`; without it that route answers 503 with a reason instead of crashing.

```bash
npm run build   # production build
npm run lint    # eslint
npx tsc --noEmit
```

## Layout

```
src/app/layout.tsx            metadata, fonts, JSON-LD, the `js` class contract
src/app/page.tsx              the page, section by section
src/app/api/enquiries/        POST an enquiry -> MongoDB -> notification email
src/components/site/          one component per section
src/lib/                      enquiry schema, mongodb, notify, rate-limit, seo
src/styles/site.css           the design system, unchanged from the static site
public/assets/                images, the proposal PDF
legacy/                       the pre-port static site, kept for diffing
```

Most of `components/site` is server components. Only these hydrate: `SiteHeader`,
`AudienceCarousel`, `Tabs`, `LayerStack`, `FaqAccordion`, `Gallery`, `EnquiryForm`,
`PromoModal`, and `ScrollEffects`. Section copy, SVG icons and the responsive `<picture>`
markup stay on the server.

### The `js` class

`src/styles/site.css` hides every `[data-reveal]` element behind a `.js` selector, so
content that animates in is never invisible to somebody with JavaScript off. The class is
in the server-rendered `<html>`, and `layout.tsx` carries a `<noscript>` block that undoes
the hiding. Setting it from an inline script instead — as the static site did — breaks
hydration and leaves the page blank; the comment in `layout.tsx` has the detail.

## Enquiries

`POST /api/enquiries` validates with the Zod schema in `src/lib/enquiry.ts` (the same one the
form uses), writes to the `enquiries` collection, then tries to email a notification.

The database write is the success condition — a failed email is logged, never surfaced, and
never turns a stored enquiry into an error message. Read the enquiries out of MongoDB
directly; there is no admin UI yet.

This replaces FormSubmit.co, which the static site posted to from the browser. That setup
stored nothing (a missed email was a lost lead) and put the destination address in the page
source.

## `legacy/`

The pre-port static site: `index.html`, its vanilla `main.js`, and the little static server
it ran under. Kept as a **text reference** for diffing the port — it will not serve as-is,
because its `assets/…` paths now resolve under `public/`. To run the real original, use a
git worktree of the commit before the port.

Delete `legacy/` once the port is signed off.
