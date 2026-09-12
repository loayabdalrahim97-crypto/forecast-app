# Foresee

**AI Behavioral Scenario Forecasting & Decision Intelligence platform.**

> "Don't predict one future. Prepare for every possibility."

FORECAST analyzes a situation a user describes, separates facts from
assumptions from unknowns, and generates multiple plausible future
scenarios with likelihood, impact, and recommended responses — then
tracks what actually happened to improve future forecasts.

## Status

Live in production at theforesee.com (PayPal Sandbox billing — Live PayPal
credentials not switched on yet). Auth, the Forecast Engine (situation
analysis, scenario generation, behavioral profile, personalization),
Decision/Business mode, outcome tracking, PDF export (7 languages), PayPal
subscriptions (Free/Monthly/Annual), an admin dashboard, and rate limiting
are all implemented and covered by the automated test suite (`npm test`).

See `docs/ARCHITECTURE.md` for the original phase plan and
`docs/ACQUISITION_HANDOFF.md` for the current single-source-of-truth
status — both are kept close to the actual codebase, not aspirational.

Not yet done: legal-page content beyond the initial draft should get a
lawyer's review before Live PayPal is switched on; SEO/growth infra;
further security hardening and mobile QA (see `ACQUISITION_HANDOFF.md` →
"Known limitations").

## Stack

- **Frontend/Backend:** Next.js (App Router), TypeScript
- **Database:** PostgreSQL + Prisma
- **Auth:** NextAuth (Auth.js), server-side sessions
- **AI:** Provider-agnostic orchestration layer (`src/lib/ai`) — Anthropic
  first, OpenAI/Google/self-hosted addable without touching the Forecast
  Engine
- **Billing:** Stripe (scaffolded in a later phase)
- **i18n:** `next-intl`-style locale routing (`/en`, `/de`, `/ar`, ...),
  RTL support for Arabic, language stored independently of country

## Getting started

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

## Documentation

See `/docs` — start with `ARCHITECTURE.md`, `DATABASE.md`, and
`AI_ARCHITECTURE.md`. `ACQUISITION_HANDOFF.md` is kept up to date as the
single source of truth for a future buyer or incoming technical team.

## Principles this codebase enforces

- Assumptions are never silently converted into facts (see
  `docs/ARCHITECTURE.md` → "Data integrity").
- No AI output is trusted without schema validation (`src/lib/ai`).
- No vendor lock-in: swapping AI providers, payment provider, or hosting
  should not require rewriting business logic.
- No secrets in the repo — see `.env.example`.
