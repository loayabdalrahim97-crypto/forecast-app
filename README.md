# Foresee

**AI Behavioral Scenario Forecasting & Decision Intelligence platform.**

> "Don't predict one future. Prepare for every possibility."

FORECAST analyzes a situation a user describes, separates facts from
assumptions from unknowns, and generates multiple plausible future
scenarios with likelihood, impact, and recommended responses — then
tracks what actually happened to improve future forecasts.

## Status

This repository is being built in phases (see `docs/ARCHITECTURE.md` for
the full phase plan). **Phase 1 — Repository, Architecture, Design System,
Database, Authentication, Internationalization — is scaffolded here.**

Phases 2–14 (Behavioral Profile, Situation Analyzer, Forecast Engine,
Scenario UI, Decision/Business Mode, Outcome Tracking, Personalization,
Billing, Admin/Analytics, SEO/Growth, Security/Testing/Performance,
Documentation/Deployment) are **not yet implemented**. Each will land as
its own scaffold with tests, following the same pattern established here.

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
