# Acquisition Handoff

**Status: Live in production** at theforesee.com, hosted on Railway
(project "FORECAST", service "web" + a Postgres service), deployed from
this repo's `main` branch. Billing currently runs against PayPal
**Sandbox** — switching to Live PayPal requires a Live app on
developer.paypal.com and new `PAYPAL_*` env vars (see "How to go live
with PayPal" below).

## What exists today

- Next.js (App Router) app with locale-based routing (`src/app/[locale]`)
  and RTL support for Arabic; 7 UI languages total (en, ar, de, es, fr,
  it, pt)
- Full Prisma/PostgreSQL schema, migrated and live (users, behavioral
  profiles, forecasts, scenarios, outcome tracking, billing, referrals,
  analytics, teams)
- Vendor-agnostic AI orchestration layer (`src/lib/ai/`), Anthropic
  implemented as the active provider
- Auth: email/password (NextAuth credentials) always on; Google OAuth
  wired in code but only activates if `GOOGLE_CLIENT_ID` /
  `GOOGLE_CLIENT_SECRET` are set (they are not set as of this writing)
- Forecast Engine: situation analysis (facts/assumptions/unknowns),
  scenario generation, behavioral profile, personalization, decision
  mode, business mode, outcome tracking/comparison — all with written
  prompts and schema validation (`src/lib/ai/schemas`), not just scaffolding
- PDF export of forecasts, including a dedicated Arabic-language report
  path (`src/lib/pdf/`)
- Billing: PayPal subscriptions (Free / Pro Monthly $9.99 / Pro Annual
  $79.99), webhook-driven state (activate/update/cancel/suspend/expire/
  payment-failed), idempotent via a `WebhookEvent` table, usage computed
  from actual saved forecasts (not a separate drift-prone counter)
- Admin dashboard with real DB-backed metrics (`src/app/[locale]/admin`)
- Abuse prevention: IP-based rate limiting on the unauthenticated free
  forecast endpoint (`src/lib/rate-limit`)
- Legal pages: `/terms`, `/privacy`, `/refund` (initial draft — see
  "Known limitations")
- 161 automated tests (`npm test`), all passing; `tsc --noEmit` clean

## What does not exist yet

- Live PayPal credentials (Sandbox only right now)
- SEO infrastructure: no `sitemap.xml` / `robots.txt`, no per-page
  metadata beyond basic titles
- Broader security hardening, load/performance testing, and mobile QA
  pass (§13 in the original phase plan)
- Analytics collection beyond the admin dashboard's own DB queries (no
  external analytics provider wired up)

## How to go live with PayPal

1. On developer.paypal.com, switch to **Live** credentials, create a
   Live app, and repeat the same steps used for Sandbox (see the
   PayPal Sandbox setup thread) to get a Live Client ID/Secret and
   create the Monthly/Annual billing plans against the Live API
   (`api-m.paypal.com`, not `api-m.sandbox.paypal.com`).
2. Register a Live webhook pointing at
   `https://www.theforesee.com/api/paypal/webhook`.
3. Update the Railway `web` service's variables: `PAYPAL_CLIENT_ID`,
   `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=live`, `PAYPAL_MONTHLY_PLAN_ID`,
   `PAYPAL_ANNUAL_PLAN_ID`, `PAYPAL_WEBHOOK_ID` with the new Live values.
4. Have the `/terms`, `/privacy`, and `/refund` pages reviewed by a
   lawyer before accepting real payments — the current text is a
   reasonable starting draft, not vetted legal advice.

## How to change AI providers

See `docs/AI_ARCHITECTURE.md` → "Adding a new provider." No business
logic references a vendor by name outside `src/lib/ai/providers/` and
`provider-factory.ts`.

## Known limitations / technical debt at this stage

- Legal pages exist but have not been reviewed by a lawyer.
- Google sign-in is implemented but not configured (no Google Cloud
  OAuth app created yet).
- No CI security scanning beyond lint/typecheck/build.
- No sitemap/robots.txt yet, so search engine indexing hasn't been
  deliberately configured.
