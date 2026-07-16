# Public SEO tool pages

Standalone, crawlable, unauthenticated pages that live outside the SPA — each
one is its own Vite build entry, not a React route. `greene-climacteric-scale/`
is the reference implementation for the six more planned (System A + two
comparison pages). Copy its structure rather than starting from scratch.

## Adding a new page

1. Create `client/tools/<slug>/index.html` (crawlable static content) and
   `client/tools/<slug>/main.ts` (progressive-enhancement island, vanilla TS —
   no React/Radix/framer-motion; it's a form and some arithmetic).
2. Add one line to `shared/publicPages.ts`. That's it — the build entry, the
   dev-server route, and the sitemap all pick it up automatically. Nothing
   else to wire by hand.
3. If the page collects any user input that gets scored/interpreted, put the
   data + pure logic in `shared/<name>.ts` so it can be unit tested from
   `server/*.test.ts` (see `shared/greeneClimactericScale.ts` +
   `server/greeneClimactericScale.test.ts` for the pattern, including a test
   that cross-checks the static HTML's wording against the source-of-truth
   data — hand-authored HTML content needs that safety net since nothing
   else catches transcription drift).

## The `<head>` pattern

Every page needs, in this order:

- `<title>` — target the query variant + "Ripple", e.g. "X Calculator — Free
  Online Self-Assessment | Ripple".
- `<meta name="description">` — one sentence on what it does, one on why
  it's trustworthy (free, private, validated instrument).
- `<link rel="canonical">` — always the trailing-slash form,
  `https://ripplehealth.app/tools/<slug>/`. This page's own URL, never the
  app's homepage.
- `og:url`, `og:site_name`, `og:title`, `og:description`, `og:type=website`.
- `twitter:card=summary`, `twitter:title`, `twitter:description`.
- Font preconnect + stylesheet links (copy verbatim from `client/index.html`).
- JSON-LD, as separate `<script type="application/ld+json">` blocks (Google
  supports multiple per page — don't try to merge them into one object):
  - `MedicalWebPage` if the content is health/clinical — `name`, `url`,
    `description`, `about` (a `MedicalTest`/`MedicalCondition` as
    appropriate), `lastReviewed` (bump this when copy changes),
    `audience: MedicalAudience`, `publisher: Organization`. Only include
    fields you can honestly fill in — no fabricated reviewer name or
    credentials.
  - `WebApplication` for the interactive tool itself — `applicationCategory:
    "HealthApplication"`, `offers: { price: "0" }`. Don't reach for
    `MedicalRiskEstimator` unless the tool actually estimates risk; most of
    these are severity/symptom trackers, not risk calculators — say so
    honestly in the `@type` you pick.
  - `FAQPage` for the FAQ section, `mainEntity` array matching the visible
    FAQ content word for word (don't let JSON-LD and rendered text drift).

## Non-negotiables (per the SEO brief, all seven pages)

- Content must be visible with JS disabled — no client-rendered-only text.
  Verify with `curl` against the production build.
- No login wall, no email gate, nothing sent to a server for anything the
  visitor enters. If the page scores something, it's client-side only.
- One CTA to the app, not three. Calm, not naggy.
- Conservative, non-diagnostic medical copy; founder reviews all of it before
  merge; no invented statistics or fabricated citations.
